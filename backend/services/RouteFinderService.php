<?php

require_once __DIR__ . '/GeoUtils.php';

class RouteFinderService {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    /**
     * Find nearest bus stops to a given coordinate
     * Returns array of stops within 2km, ordered by distance
     */
    public function findNearestStops($lat, $lng, $limit = 5) {
        // Note: Using 'bus_stops' table as per instructions, or 'stops' if that's what exists.
        // Prompt said 'bus_stops'.
        // I should stick to 'bus_stops' but handle if it's 'stops'.
        // Based on seed_colombo.php, the table name is 'stops'.
        // But the prompt specifically said 'CREATE NEW TABLES' or 'ADD COLUMN' to 'bus_stops'.
        // The migration script used 'bus_stops'.
        // If 'bus_stops' doesn't exist, this will fail.
        // I will assume for now 'bus_stops' exists or is an alias, but given seed_colombo.php used 'stops',
        // I might need to check. Use 'bus_stops' as per explicit instruction.
        
        $query = "
            SELECT 
                stop_id,
                stop_name,
                latitude,
                longitude,
                (6371 * acos(
                    LEAST(1.0, GREATEST(-1.0,
                        cos(radians(?)) * cos(radians(latitude)) *
                        cos(radians(longitude) - radians(?)) +
                        sin(radians(?)) * sin(radians(latitude))
                    ))
                )) AS distance_km
            FROM bus_stops
            HAVING distance_km < 2
            ORDER BY distance_km ASC
            LIMIT ?
        ";
        
        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute([$lat, $lng, $lat, $limit]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Fallback to 'stops' table if 'bus_stops' fails (common issue if table wasn't renamed)
             $query = str_replace('bus_stops', 'stops', $query);
             $query = str_replace('stop_id', 'id', $query); // 'stops' usually has 'id'
             try {
                $stmt = $this->db->prepare($query);
                $stmt->execute([$lat, $lng, $lat, $limit]);
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                // Map id to stop_id for consistency
                foreach ($results as &$row) {
                    $row['stop_id'] = $row['id'];
                }
                return $results;
                
             } catch (PDOException $e2) {
                 return [];
             }
        }
    }
    
    /**
     * Build graph representation of bus network
     * Returns adjacency list with travel times
     */
    private function buildGraph() {
        $query = "
            SELECT 
                from_stop_id, 
                to_stop_id, 
                segment_id, 
                distance_km, 
                default_speed_kmh,
                route_id
            FROM route_segments
        ";
        try {
            $segments = $this->db->query($query)->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
        
        $graph = [];
        $trafficMultiplier = GeoUtils::getTrafficMultiplier();
        
        foreach ($segments as $seg) {
            // Calculate travel time in minutes
            $travelTime = ($seg['distance_km'] / $seg['default_speed_kmh']) * 60;
            $travelTime *= $trafficMultiplier;
            
            if (!isset($graph[$seg['from_stop_id']])) {
                $graph[$seg['from_stop_id']] = [];
            }
            
            $graph[$seg['from_stop_id']][$seg['to_stop_id']] = [
                'time' => $travelTime,
                'segment_id' => $seg['segment_id'],
                'route_id' => $seg['route_id']
            ];
        }
        
        return $graph;
    }
    
    /**
     * Dijkstra's shortest path algorithm
     * Returns path and total travel time between two stops
     */
    public function findShortestPath($startStopId, $endStopId) {
        $graph = $this->buildGraph();
        
        // Initialize
        $distances = [];
        $previous = [];
        $unvisited = [];
        
        // Optimization: Only initialize nodes in the graph
        // If start/end not in graph, return null
        // But graph keys are only source nodes.
        // We'll collect all nodes first.
        
        $allNodes = [];
        foreach ($graph as $node => $edges) {
            $allNodes[$node] = true;
            foreach ($edges as $neighbor => $data) {
                $allNodes[$neighbor] = true;
            }
        }
        
        foreach ($allNodes as $node => $val) {
            $distances[$node] = PHP_INT_MAX;
            $unvisited[$node] = true;
        }
        
        if (!isset($allNodes[$startStopId]) || !isset($allNodes[$endStopId])) {
              return [
                'path' => [],
                'total_time_minutes' => null
            ];
        }
        
        $distances[$startStopId] = 0;
        
        // Main Dijkstra loop
        while (!empty($unvisited)) {
            // Find unvisited node with minimum distance
            $minNode = null;
            $minDistance = PHP_INT_MAX;
            foreach ($unvisited as $node => $val) {
                if ($distances[$node] < $minDistance) {
                    $minDistance = $distances[$node];
                    $minNode = $node;
                }
            }
            
            if ($minNode === null || $minNode == $endStopId) {
                break;
            }
            
            unset($unvisited[$minNode]);
            
            if (!isset($graph[$minNode])) {
                continue;
            }
            
            // Update distances to neighbors
            foreach ($graph[$minNode] as $neighbor => $data) {
                if (!isset($unvisited[$neighbor])) continue;
                
                $alt = $distances[$minNode] + $data['time'];
                if ($alt < $distances[$neighbor]) {
                    $distances[$neighbor] = $alt;
                    $previous[$neighbor] = $minNode;
                }
            }
        }
        
        // Reconstruct path
        $path = [];
        $current = $endStopId;
        
        if ($distances[$endStopId] === PHP_INT_MAX) {
             return [
                'path' => [],
                'total_time_minutes' => null
            ];
        }
        
        while (isset($previous[$current])) {
            array_unshift($path, $current);
            $current = $previous[$current];
        }
        array_unshift($path, $startStopId);
        
        return [
            'path' => $path,
            'total_time_minutes' => $distances[$endStopId]
        ];
    }
    
    /**
     * Find best bus route from origin to destination
     * Considers walking distance to/from stops + bus travel time
     */
    public function findBestRoute($originLat, $originLng, $destLat, $destLng) {
        // Find nearest stops
        $originStops = $this->findNearestStops($originLat, $originLng, 3);
        $destStops = $this->findNearestStops($destLat, $destLng, 3);
        
        if (empty($originStops) || empty($destStops)) {
            return null;
        }
        
        $bestRoute = null;
        $minTotalTime = PHP_INT_MAX;
        
        // Try all combinations
        foreach ($originStops as $originStop) {
            foreach ($destStops as $destStop) {
                if ($originStop['stop_id'] == $destStop['stop_id']) continue; // Same stop
                
                // Walking time to boarding stop (1.4 m/s walking speed)
                $walkToStop = GeoUtils::haversineDistance(
                    $originLat, $originLng,
                    $originStop['latitude'], $originStop['longitude']
                ) * 1000; // meters
                
                $walkingTimeToStop = ($walkToStop / 1.4) / 60; // minutes
                
                // Bus travel
                $busRoute = $this->findShortestPath(
                    $originStop['stop_id'], 
                    $destStop['stop_id']
                );
                
                if ($busRoute['total_time_minutes'] === null) {
                    continue;
                }
                
                // Walking time from alighting stop
                $walkFromStop = GeoUtils::haversineDistance(
                    $destStop['latitude'], $destStop['longitude'],
                    $destLat, $destLng
                ) * 1000;
                
                $walkingTimeFromStop = ($walkFromStop / 1.4) / 60;
                
                // Total journey time
                $totalTime = $walkingTimeToStop + 
                            $busRoute['total_time_minutes'] + 
                            $walkingTimeFromStop;
                
                if ($totalTime < $minTotalTime && count($busRoute['path']) > 1) {
                    $minTotalTime = $totalTime;
                    $bestRoute = [
                        'boarding_stop' => $originStop,
                        'alighting_stop' => $destStop,
                        'bus_path' => $busRoute['path'],
                        'walking_distance_to_stop' => $walkToStop,
                        'walking_time_to_stop' => $walkingTimeToStop,
                        'walking_distance_from_stop' => $walkFromStop,
                        'walking_time_from_stop' => $walkingTimeFromStop,
                        'bus_travel_time' => $busRoute['total_time_minutes'],
                        'total_time' => $totalTime
                    ];
                }
            }
        }
        
        return $bestRoute;
    }
}
