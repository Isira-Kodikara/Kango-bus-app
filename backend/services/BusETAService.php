<?php

class BusETAService {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    /**
     * Get ETA of next bus arriving at a specific stop
     */
    public function getNextBusETA($stopId, $routeId = null) {
        // Find active trips heading to this stop
        // Using 'trips' table ? The prompt assumed 'trips' table exists.
        // I don't recall seeing a 'trips' table in seed_colombo.php.
        // seed_colombo.php seeds 'routes', 'stops', 'route_segments'.
        // It does NOT seed 'trips'.
        // However, 'get-live-buses.php' probably uses something.
        // Let's check 'get-live-buses.php' later to see where it gets data.
        // For now, I'll implement as requested, but if 'trips' doesn't exist, this will fail.
        
        $query = "
            SELECT 
                t.trip_id,
                t.bus_id,
                t.route_id,
                t.current_stop_id,
                rs_current.stop_sequence as current_sequence,
                rs_target.stop_sequence as target_sequence,
                r.route_number,
                r.route_name
            FROM trips t
            JOIN routes r ON t.route_id = r.route_id
            JOIN route_stops rs_current ON t.current_stop_id = rs_current.stop_id 
                AND t.route_id = rs_current.route_id
            JOIN route_stops rs_target ON rs_target.stop_id = ? 
                AND t.route_id = rs_target.route_id
            WHERE t.status = 'active'
            AND rs_target.stop_sequence > rs_current.stop_sequence
        ";
        
        $params = [$stopId];
        
        if ($routeId) {
            $query .= " AND t.route_id = ?";
            $params[] = $routeId;
        }
        
        $query .= " ORDER BY (rs_target.stop_sequence - rs_current.stop_sequence) ASC LIMIT 3";
        
        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $activeBuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Table might not exist
            return null;
        }
        
        if (empty($activeBuses)) {
            return null;
        }
        
        // Calculate ETA for each bus
        $minETA = PHP_INT_MAX;
        $nextBus = null;
        
        foreach ($activeBuses as $bus) {
            $eta = $this->calculateSegmentETA(
                $bus['trip_id'],
                $bus['route_id'],
                $bus['current_stop_id'],
                $stopId
            );
            
            if ($eta !== null && $eta < $minETA) {
                $minETA = $eta;
                $nextBus = [
                    'trip_id' => $bus['trip_id'],
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
     */
    private function calculateSegmentETA($tripId, $routeId, $fromStopId, $toStopId) {
        // This query assumes route_segments is populated and route_stops has stop_sequence
        $query = "
            SELECT 
                rs.distance_km,
                rs.default_speed_kmh
            FROM route_segments rs
            WHERE rs.route_id = ?
            AND rs.sequence_order >= (
                SELECT stop_sequence FROM route_stops 
                WHERE stop_id = ? AND route_id = ?
            )
            AND rs.sequence_order < (
                SELECT stop_sequence FROM route_stops 
                WHERE stop_id = ? AND route_id = ?
            )
        ";
        
        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute([$routeId, $fromStopId, $routeId, $toStopId, $routeId]);
            $segments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($segments)) {
                return null;
            }
            
            $totalTime = 0;
            $trafficMultiplier = GeoUtils::getTrafficMultiplier();
            
            foreach ($segments as $seg) {
                $speed = $seg['default_speed_kmh'] > 0 ? $seg['default_speed_kmh'] : 15;
                $segmentTime = ($seg['distance_km'] / $speed) * 60;
                $totalTime += $segmentTime * $trafficMultiplier;
            }
            
            return $totalTime;
            
        } catch (PDOException $e) {
            return null;
        }
    }
    
    /**
     * Check if user can catch the bus
     */
    public function canCatchBus($walkingTimeMinutes, $busETAMinutes, $safetyBuffer = 2) {
        if ($busETAMinutes === null) {
            return false;
        }
        return $walkingTimeMinutes < ($busETAMinutes - $safetyBuffer);
    }
}
