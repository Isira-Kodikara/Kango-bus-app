<?php
// backend/services/RouteFinderService.php

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
        $query = "
            SELECT 
                id as stop_id,
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
            FROM stops
            HAVING distance_km < 20
            ORDER BY distance_km ASC
            LIMIT ?
        ";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([$lat, $lng, $lat, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Build graph representation of bus network
     * Returns adjacency list: [from_stop_id => [to_stop_id => ['time' => minutes, 'segment_id' => id]]]
     */
    private function buildGraph() {
        $query = "
            SELECT 
                from_stop_id, 
                to_stop_id, 
                id as segment_id, 
                distance_km, 
                default_speed_kmh,
                route_id
            FROM route_segments
        ";
        $segments = $this->db->query($query)->fetchAll(PDO::FETCH_ASSOC);
        
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
        
        // Initialize distances and previous nodes
        $distances = [];
        $previous = [];
        $unvisited = [];
        
        // Ensure both start and end exist in the graph or stop list
        // Note: Graph only contains stops that are part of a segment
        foreach ($graph as $node => $edges) {
            $distances[$node] = PHP_INT_MAX;
            $unvisited[$node] = true;
            foreach ($edges as $neighbor => $data) {
                if (!isset($distances[$neighbor])) {
                    $distances[$neighbor] = PHP_INT_MAX;
                    $unvisited[$neighbor] = true;
                }
            }
        }
        
        if (!isset($distances[$startStopId])) {
            return ['path' => [], 'total_time_minutes' => null];
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
        if (!isset($previous[$current]) && $current != $startStopId) {
             return ['path' => [], 'total_time_minutes' => null];
        }
        
        while (isset($previous[$current])) {
            array_unshift($path, $current);
            $current = $previous[$current];
        }
        array_unshift($path, $startStopId);
        
        return [
            'path' => $path,
            'total_time_minutes' => $distances[$endStopId] !== PHP_INT_MAX ? $distances[$endStopId] : null
        ];
    }
    
    /**
     * Find best bus route from origin to destination
     * Considers walking distance to/from stops + bus travel time
     */
    private $lastError = null;

    public function getLastError() {
        return $this->lastError;
    }

    public function findBestRoute($originLat, $originLng, $destLat, $destLng) {
        $this->lastError = null;
        
        // Find nearest stops to origin and destination
        $originStops = $this->findNearestStops($originLat, $originLng, 3);
        $destStops = $this->findNearestStops($destLat, $destLng, 3);
        
        if (empty($originStops)) {
            $this->lastError = "No bus stops found within 50km of your starting location. Please try a location near Colombo.";
            return null;
        }
        
        if (empty($destStops)) {
            $this->lastError = "No bus stops found within 50km of your destination. Please try a destination near Colombo.";
            return null;
        }
        
        $bestRoute = null;
        $minTotalTime = PHP_INT_MAX;
        $attempts = 0;
        $failures = 0;
        
        // Try all combinations of origin and destination stops
        foreach ($originStops as $originStop) {
            foreach ($destStops as $destStop) {
                $attempts++;
                
                // Walking time to boarding stop (1.4 m/s walking speed)
                $walkToStop = GeoUtils::haversineDistance(
                    $originLat, $originLng,
                    $originStop['latitude'], $originStop['longitude']
                ) * 1000; // Convert to meters
                
                $walkingTimeToStop = ($walkToStop / 1.4) / 60; // Minutes
                
                // Bus travel between stops
                $busRoute = $this->findShortestPath(
                    $originStop['stop_id'], 
                    $destStop['stop_id']
                );
                
                if (empty($busRoute['path']) || !$busRoute['total_time_minutes']) {
                    $failures++;
                    continue; // No route found
                }
                
                // Walking time from alighting stop to destination
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
        
        if (!$bestRoute) {
            if ($failures === $attempts) {
                $this->lastError = "No connected bus routes found between stops near you and your destination.";
            } else {
                $this->lastError = "Could not calculate a valid route. Try different stops.";
            }
        }
        
        return $bestRoute;
    }
}
