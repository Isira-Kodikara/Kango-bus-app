<?php
// backend/services/BusETAService.php

require_once __DIR__ . '/GeoUtils.php';

class BusETAService {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    /**
     * Get ETA of next bus arriving at a specific stop
     * Returns trip info and estimated arrival time in minutes
     */
    public function getNextBusETA($stopId, $routeId = null) {
        // Find active buses heading to this stop
        $query = "
            SELECT 
                b.id as bus_id,
                b.route_id,
                b.current_stop_id,
                rs_current.stop_order as current_sequence,
                rs_target.stop_order as target_sequence,
                r.route_number,
                r.route_name
            FROM buses b
            JOIN routes r ON b.route_id = r.id
            JOIN route_stops rs_current ON b.current_stop_id = rs_current.stop_id 
                AND b.route_id = rs_current.route_id
            JOIN route_stops rs_target ON rs_target.stop_id = ? 
                AND b.route_id = rs_target.route_id
            WHERE b.status = 'active'
            AND rs_target.stop_order > rs_current.stop_order
        ";
        
        $params = [$stopId];
        
        if ($routeId) {
            $query .= " AND b.route_id = ?";
            $params[] = $routeId;
        }
        
        $query .= " ORDER BY (rs_target.stop_order - rs_current.stop_order) ASC LIMIT 3";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        $activeBuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($activeBuses)) {
            return null;
        }
        
        // Calculate ETA for each bus and return the closest one
        $minETA = PHP_INT_MAX;
        $nextBus = null;
        
        foreach ($activeBuses as $bus) {
            $eta = $this->calculateSegmentETA(
                $bus['route_id'],
                $bus['current_stop_id'],
                $stopId
            );
            
            if ($eta !== null && $eta < $minETA) {
                $minETA = $eta;
                $nextBus = [
                    'bus_id' => $bus['bus_id'],
                    'route_id' => $bus['route_id'],
                    'route_number' => $bus['route_number'],
                    'route_name' => $bus['route_name'],
                    'eta_minutes' => round($eta, 1)
                ];
            }
        }
        
        return $nextBus;
    }
    
    /**
     * Calculate ETA through multiple route segments
     * Returns time in minutes
     */
    private function calculateSegmentETA($routeId, $fromStopId, $toStopId) {
        $query = "
            SELECT 
                rs.distance_km,
                rs.default_speed_kmh
            FROM route_segments rs
            WHERE rs.route_id = ?
            AND rs.sequence_order >= (
                SELECT stop_order FROM route_stops 
                WHERE stop_id = ? AND route_id = ?
            )
            AND rs.sequence_order < (
                SELECT stop_order FROM route_stops 
                WHERE stop_id = ? AND route_id = ?
            )
        ";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([$routeId, $fromStopId, $routeId, $toStopId, $routeId]);
        $segments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($segments)) {
            return null;
        }
        
        $totalTime = 0;
        $trafficMultiplier = GeoUtils::getTrafficMultiplier();
        
        foreach ($segments as $seg) {
            $segmentTime = ($seg['distance_km'] / $seg['default_speed_kmh']) * 60; // minutes
            $totalTime += $segmentTime * $trafficMultiplier;
        }
        
        return $totalTime;
    }
    
    /**
     * Check if user can catch the bus given walking time and bus ETA
     * Returns boolean with safety buffer
     */
    public function canCatchBus($walkingTimeMinutes, $busETAMinutes, $safetyBuffer = 2) {
        if ($busETAMinutes === null) {
            return false;
        }
        return $walkingTimeMinutes < ($busETAMinutes - $safetyBuffer);
    }
}
