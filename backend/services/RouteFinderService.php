<?php

require_once 'GeoUtils.php';

class RouteFinderService
{
    private $db;

    public function __construct($database)
    {
        $this->db = $database;
    }

    /**
     * Find nearest bus stops to a given coordinate
     * Returns array of stops within 2km, ordered by distance
     */
    public function findNearestStops($lat, $lng, $limit = 5, $maxDistanceKm = 50)
    {
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
            HAVING distance_km < ?
            ORDER BY distance_km ASC
            LIMIT ?
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([$lat, $lng, $lat, $maxDistanceKm, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Build graph representation of bus network
     * Returns adjacency list with travel times
     */
    private function buildGraph()
    {
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

        // --- NEW: Add Walking Transfer Edges ---
        // Get all stops to find nearby ones
        // In a real large-scale app, use PostGIS or spatial index. Here, simple distance check.
        $stops = $this->db->query("SELECT id, latitude, longitude FROM stops")->fetchAll(PDO::FETCH_ASSOC);
        $transferSpeed = 1.4 * 60; // m/min (approx 84 m/min) ~ 5 km/h
        $maxTransferDist = 0.2; // 200 meters max walking transfer

        // Very naive O(N^2) - okay for small number of stops (< 500)
        // For production, this should be pre-calculated or spatially optimized
        foreach ($stops as $stopA) {
            foreach ($stops as $stopB) {
                if ($stopA['id'] == $stopB['id'])
                    continue;

                $distKm = GeoUtils::haversineDistance(
                    $stopA['latitude'], $stopA['longitude'],
                    $stopB['latitude'], $stopB['longitude']
                );

                if ($distKm <= $maxTransferDist) {
                    $walkTime = ($distKm * 1000) / $transferSpeed; // minutes

                    // Add penalty for transfer (e.g. 5 mins) to prefer direct bus
                    $transferPenalty = 5;
                    $totalTransferCost = $walkTime + $transferPenalty;

                    if (!isset($graph[$stopA['id']]))
                        $graph[$stopA['id']] = [];

                    // Only add if faster than existing edge (unlikely for bus vs walk, but good practice)
                    if (!isset($graph[$stopA['id']][$stopB['id']]) || $totalTransferCost < $graph[$stopA['id']][$stopB['id']]['time']) {
                        $graph[$stopA['id']][$stopB['id']] = [
                            'time' => $totalTransferCost,
                            'segment_id' => null, // Walking transfer
                            'route_id' => null // Walking transfer
                        ];
                    }
                }
            }
        }
        // ---------------------------------------

        return $graph;
    }

    /**
     * Dijkstra's shortest path algorithm
     * Returns path and total travel time between two stops
     */
    public function findShortestPath($startStopId, $endStopId)
    {
        $graph = $this->buildGraph();

        // Initialize
        $distances = [];
        $previous = [];
        $previousInfo = []; // Store route_id and segment_id for reconstruction
        $unvisited = [];

        foreach ($graph as $node => $edges) {
            $distances[$node] = PHP_INT_MAX;
            $unvisited[$node] = true;
        }

        // Ensure start and end nodes are in the graph
        if (!isset($distances[$startStopId]))
            $distances[$startStopId] = PHP_INT_MAX;
        if (!isset($distances[$endStopId]))
            $distances[$endStopId] = PHP_INT_MAX;

        $distances[$startStopId] = 0;
        $unvisited[$startStopId] = true;
        $unvisited[$endStopId] = true;

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
                $alt = $distances[$minNode] + $data['time'];
                if (!isset($distances[$neighbor]) || $alt < $distances[$neighbor]) {
                    $distances[$neighbor] = $alt;
                    $previous[$neighbor] = $minNode;
                    $previousInfo[$neighbor] = [
                        'route_id' => $data['route_id'],
                        'segment_id' => $data['segment_id']
                    ];
                    $unvisited[$neighbor] = true;
                }
            }
        }

        // Reconstruct path
        $path = [];
        $detailedPath = []; // Array of {stop_id, route_id_to_reach_here}
        $current = $endStopId;
        while (isset($previous[$current])) {
            $prev = $previous[$current];
            $info = $previousInfo[$current];

            array_unshift($path, $current);
            array_unshift($detailedPath, [
                'stop_id' => $current,
                'route_id' => $info['route_id'],
                'segment_id' => $info['segment_id']
            ]);

            $current = $prev;
        }

        if (!empty($path) || $startStopId == $endStopId) {
            array_unshift($path, $startStopId);
            array_unshift($detailedPath, [
                'stop_id' => $startStopId,
                'route_id' => null, // Start node
                'segment_id' => null
            ]);
        }

        return [
            'path' => $path,
            'detailed_path' => $detailedPath,
            'total_time_minutes' => (isset($distances[$endStopId]) && $distances[$endStopId] !== PHP_INT_MAX) ? $distances[$endStopId] : null
        ];
    }

    /**
     * Find best bus route from origin to destination
     * Considers walking distance to/from stops + bus travel time
     */
    public function findBestRoute($originLat, $originLng, $destLat, $destLng)
    {
        // Find nearest stops (Increased limit to find better connections)
        $originStops = $this->findNearestStops($originLat, $originLng, 10, 50);
        $destStops = $this->findNearestStops($destLat, $destLng, 10, 50);

        if (empty($originStops) || empty($destStops)) {
            return null;
        }

        $bestRoute = null;
        $minTotalTime = PHP_INT_MAX;

        // Try all combinations
        foreach ($originStops as $originStop) {
            foreach ($destStops as $destStop) {
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

                if (!$busRoute['total_time_minutes']) {
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
                        'detailed_path' => $busRoute['detailed_path'],
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
