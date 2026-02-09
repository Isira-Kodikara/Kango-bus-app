<?php

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/GeoUtils.php';

class RouteFinderService
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Find nearest bus stops to a location
     */
    public function findNearestStops($lat, $lng, $limit = 5)
    {
        $sql = "SELECT id, stop_name, latitude, longitude, 
                (6371 * acos(
                    cos(radians(:lat)) * cos(radians(latitude)) * 
                    cos(radians(longitude) - radians(:lng)) + 
                    sin(radians(:lat)) * sin(radians(latitude))
                )) AS distance
                FROM stops
                WHERE is_active = 1
                HAVING distance < 150 -- Within 150km (Supports cross-city planning like Galle to Colombo)
                ORDER BY distance ASC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':lat', $lat);
        $stmt->bindParam(':lng', $lng);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Build graph from route_segments
     * Nodes: stop_ids
     * Edges: travel_time (weighted by traffic)
     */
    private function buildGraph()
    {
        $traffic = GeoUtils::getTrafficMultiplier();
        $graph = [];

        $sql = "SELECT segment_id, route_id, from_stop_id, to_stop_id, distance_km, default_speed_kmh 
                FROM route_segments";
        $stmt = $this->db->query($sql);
        $segments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($segments as $seg) {
            $speed = $seg['default_speed_kmh'] * $traffic;
            if ($speed <= 0)
                $speed = 20; // Safety fallback

            $travelTimeSeconds = ($seg['distance_km'] / $speed) * 3600;

            if (!isset($graph[$seg['from_stop_id']])) {
                $graph[$seg['from_stop_id']] = [];
            }

            $graph[$seg['from_stop_id']][] = [
                'to_node' => $seg['to_stop_id'],
                'weight' => $travelTimeSeconds,
                'route_id' => $seg['route_id'],
                'distance' => $seg['distance_km']
            ];
        }

        return $graph;
    }

    /**
     * Dijkstra's Algorithm to find shortest path between two stops
     */
    public function findShortestPath($startNode, $endNode)
    {
        $graph = $this->buildGraph(); // Build graph on the fly with current traffic

        // Priority Queue (simulated with array)
        // Format: [cost, node]
        $pq = [];
        $pq[] = [0, $startNode];

        $distances = [];
        $previous = []; // To reconstruct path
        $routeTaken = []; // To track which route was used

        // Initialize distances
        foreach (array_keys($graph) as $node) {
            $distances[$node] = INF;
        }
        // Also initialize for endNode if not in keys (it might be a terminal node)
        $distances[$startNode] = 0;

        // Visited set not strictly needed with distance check, but good for optimization
        $visited = [];

        while (!empty($pq)) {
            // 1. Extract min
            // Sort by cost (this is O(N log N) inside loop, suboptimal but fine for N < 1000)
            usort($pq, function ($a, $b) {
                return $a[0] <=> $b[0];
            });

            list($currentDist, $u) = array_shift($pq);

            if ($u == $endNode)
                break; // Found target

            if (isset($visited[$u]))
                continue;
            $visited[$u] = true;

            if (!isset($graph[$u]))
                continue; // Dead end

            // 2. Explore neighbors
            foreach ($graph[$u] as $edge) {
                $v = $edge['to_node'];
                $weight = $edge['weight'];
                $alt = $currentDist + $weight;

                if (!isset($distances[$v]) || $alt < $distances[$v]) {
                    $distances[$v] = $alt;
                    $previous[$v] = $u;
                    $routeTaken[$v] = $edge['route_id'];
                    $pq[] = [$alt, $v];
                }
            }
        }

        // Reconstruct Path
        if (!isset($previous[$endNode])) {
            return null; // No path found
        }

        $path = [];
        $curr = $endNode;
        $totalTime = 0;
        $totalDistance = 0;

        // Use a set to count distinct routes (transfers)
        $routesUsed = [];

        while (isset($previous[$curr])) {
            $prev = $previous[$curr];
            $rid = $routeTaken[$curr];

            // Find specific edge info again (optional, for more detail)
            // For now just aggregate totals
            // Note: $distances[$endNode] has total time

            $routesUsed[] = $rid;
            $curr = $prev;
        }

        // Simple return structure
        return [
            'total_bus_time_seconds' => $distances[$endNode],
            'routes' => array_unique($routesUsed),
            'boarding_stop' => $startNode,
            'alighting_stop' => $endNode,
            // Assuming simplified single route for now as per phase 1 requirements usually implying direct or simple paths
            'primary_route_id' => !empty($routesUsed) ? $routesUsed[0] : null
        ];
    }

    /**
     * Main Entry Point: Find best route from A (lat,lng) to B (lat,lng)
     */
    public function findBestRoute($originLat, $originLng, $destLat, $destLng)
    {
        // 1. Find nearest stops to Origin and Destination
        $startStops = $this->findNearestStops($originLat, $originLng, 3);
        $endStops = $this->findNearestStops($destLat, $destLng, 3);

        if (empty($startStops) || empty($endStops)) {
            return ['error' => 'No bus stops found near locations'];
        }

        $bestPlan = null;
        $minTotalTime = INF;

        // 2. Iterate combinations (Start Stop -> End Stop)
        foreach ($startStops as $startStop) {
            foreach ($endStops as $endStop) {
                if ($startStop['id'] == $endStop['id'])
                    continue;

                // Simple Walking Time (Origin -> Start Stop)
                // Use Haversine for speed (Phase 1/2 simplification before Mapbox call in controller)
                $walkToStopDist = $startStop['distance'] * 1000; // meters
                $walkToStopTime = $walkToStopDist / 1.4; // seconds

                // Walking Time (End Stop -> Dest)
                $walkFromStopDist = $endStop['distance'] * 1000;
                $walkFromStopTime = $walkFromStopDist / 1.4;

                // Bus Path
                $busPath = $this->findShortestPath($startStop['id'], $endStop['id']);

                if ($busPath) {
                    $totalJourneyTime = $walkToStopTime + $busPath['total_bus_time_seconds'] + $walkFromStopTime;

                    if ($totalJourneyTime < $minTotalTime) {
                        $minTotalTime = $totalJourneyTime;
                        $bestPlan = [
                            'boarding_stop' => $startStop,
                            'alighting_stop' => $endStop,
                            'bus_data' => $busPath,
                            'walk_to_stop' => [
                                'distance' => $walkToStopDist,
                                'time' => $walkToStopTime
                            ],
                            'walk_from_stop' => [
                                'distance' => $walkFromStopDist,
                                'time' => $walkFromStopTime
                            ],
                            'total_time_seconds' => $totalJourneyTime
                        ];
                    }
                }
            }
        }

        return $bestPlan ?: ['error' => 'No route found connecting these locations'];
    }
}
