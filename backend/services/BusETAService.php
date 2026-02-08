<?php

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/GeoUtils.php';

class BusETAService {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Get ETA for the next bus at a specific stop for a specific route
     * Returns ETA in seconds, or null if no bus found
     */
    public function getNextBusETA($stopId, $routeId) {
        try {
            // Find active trips for this route
            // In a real system, we'd use live GPS locations from `buses` table
            // For this phase, we'll estimate based on the bus's last known location and average speed
            
            // 1. Get active buses on this route
            $sql = "SELECT b.id, b.current_latitude, b.current_longitude, b.current_stop_id 
                    FROM buses b 
                    WHERE b.route_id = :route_id AND b.status = 'active'";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':route_id' => $routeId]);
            $buses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($buses)) {
                return null; // No active buses
            }

            $minEta = null;

            // 2. Get the target stop location
            $targetStopSql = "SELECT latitude, longitude FROM stops WHERE id = :stop_id";
            $targetStmt = $this->db->prepare($targetStopSql);
            $targetStmt->execute([':stop_id' => $stopId]);
            $targetStop = $targetStmt->fetch(PDO::FETCH_ASSOC);

            if (!$targetStop) {
                return null;
            }

            foreach ($buses as $bus) {
                // Simplified ETA: Distance from bus to stop / average speed
                // In a real app, we'd check if the bus has already passed the stop.
                // Here we assume if it's "close enough" it might be the one.
                // A better approach requires checking stop sequence order.

                $distKm = GeoUtils::haversineDistance(
                    $bus['current_latitude'], $bus['current_longitude'],
                    $targetStop['latitude'], $targetStop['longitude']
                );

                // Assuming average bus speed of 25 km/h
                $speedKmh = 25 * GeoUtils::getTrafficMultiplier();
                $etaSeconds = ($distKm / $speedKmh) * 3600;

                // Add a small buffer for stops (30 sec per km roughly)
                $etaSeconds += ($distKm * 30);

                if ($minEta === null || $etaSeconds < $minEta) {
                    $minEta = $etaSeconds;
                }
            }

            return $minEta !== null ? round($minEta) : null;

        } catch (PDOException $e) {
            error_log("BusETAService Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Calculate travel time between two stops on a route
     */
    public function calculateSegmentETA($routeId, $fromStopId, $toStopId) {
        if ($fromStopId == $toStopId) return 0;

        try {
            // Sum travel times of segments between these stops
            // We need to know the sequence.
            
            // Get sequence numbers
            $seqSql = "SELECT stop_id, sequence_order FROM route_segments 
                       WHERE route_id = :route_id AND (from_stop_id = :s1 OR to_stop_id = :s2)";
            // Ideally current schema links stops via segments. 
            // A simpler valid query for graph based systems:
            // Find path in route_segments.
            
            // Let's rely on the graph builder in RouteFinder for complex paths.
            // This method is a helper for direct segments.
            
            // Fallback: simple distance * traffic
             $distSql = "SELECT distance_km, default_speed_kmh FROM route_segments 
                         WHERE route_id = :route_id AND from_stop_id = :from_id AND to_stop_id = :to_id";
             
             $stmt = $this->db->prepare($distSql);
             $stmt->execute([
                 ':route_id' => $routeId,
                 ':from_id' => $fromStopId,
                 ':to_id' => $toStopId
             ]);
             
             $segment = $stmt->fetch(PDO::FETCH_ASSOC);
             
             if ($segment) {
                 $traffic = GeoUtils::getTrafficMultiplier();
                 $speed = $segment['default_speed_kmh'] * $traffic;
                 return ($segment['distance_km'] / $speed) * 3600;
             }
             
             return 300; // Default 5 mins if segment missing

        } catch (Exception $e) {
            return 300;
        }
    }

    /**
     * Check if user can catch the bus
     */
    public function canCatchBus($walkingTimeSeconds, $busEtaSeconds, $safetyBufferMinutes = 2) {
        if ($busEtaSeconds === null) return false; // Bus not found
        
        $safetyBufferSeconds = $safetyBufferMinutes * 60;
        
        // User needs to arrive BEFORE (Bus ETA - Buffer)
        // So Walking Time < (Bus ETA - Buffer)
        return $walkingTimeSeconds < ($busEtaSeconds - $safetyBufferSeconds);
    }
}
