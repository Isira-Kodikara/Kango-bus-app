<?php

class OSMTransitService {
    private $apiEndpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ];
    
    /**
     * Get bus routes from OpenStreetMap in a specific area
     */
    public function getBusRoutesInArea($minLat, $minLng, $maxLat, $maxLng) {
        $bbox = "$minLat,$minLng,$maxLat,$maxLng";
        $query = "[out:json][timeout:90];
            (
              relation[\"type\"=\"route\"][\"route\"=\"bus\"]($bbox);
              relation[\"route\"=\"bus\"]($bbox);
            );
            out body;
            >;
            out skel qt;";
        
        $response = null;
        $success = false;

        foreach ($this->apiEndpoints as $apiUrl) {
            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, "data=" . urlencode($query));
            curl_setopt($ch, CURLOPT_USERAGENT, "KANGO-Bus-App-Service/1.0");
            curl_setopt($ch, CURLOPT_TIMEOUT, 60);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            
            if ($httpCode === 200 && $response) {
                $data = json_decode($response, true);
                if ($data && isset($data['elements'])) {
                    $success = true;
                    break;
                }
            }
            // curl_close is deprecated in PHP 8.5+
        }

        if (!$success) {
            return [];
        }
        
        return $this->parseOSMData($data);
    }
    
    /**
     * Parse OSM data into route format
     */
    private function parseOSMData($data) {
        $nodes = [];
        $relations = [];
        
        foreach ($data['elements'] as $element) {
            if ($element['type'] === 'node') {
                $nodes[$element['id']] = $element;
            } elseif ($element['type'] === 'relation') {
                $relations[] = $element;
            }
        }
        
        $routes = [];
        foreach ($relations as $rel) {
            $tags = $rel['tags'] ?? [];
            if (!isset($tags['route']) || $tags['route'] !== 'bus') continue;

            $route = [
                'osm_id' => $rel['id'],
                'route_number' => $tags['ref'] ?? 'N/A',
                'route_name' => $tags['name'] ?? ($tags['ref'] ?? 'Unknown Route'),
                'operator' => $tags['operator'] ?? 'N/A',
                'stops' => []
            ];
            
            if (isset($rel['members'])) {
                foreach ($rel['members'] as $member) {
                    if ($member['type'] === 'node' && in_array($member['role'], ['stop', 'platform'])) {
                        $nodeId = $member['ref'];
                        if (isset($nodes[$nodeId])) {
                            $node = $nodes[$nodeId];
                            $route['stops'][] = [
                                'osm_id' => $nodeId,
                                'name' => $node['tags']['name'] ?? "Stop #$nodeId",
                                'lat' => $node['lat'],
                                'lon' => $node['lon']
                            ];
                        }
                    }
                }
            }
            
            if (!empty($route['stops'])) {
                $routes[] = $route;
            }
        }
        
        return $routes;
    }
    
    /**
     * Sync OSM routes to database
     */
    public function syncRoutesToDatabase($pdo, $minLat, $minLng, $maxLat, $maxLng) {
        $osmRoutes = $this->getBusRoutesInArea($minLat, $minLng, $maxLat, $maxLng);
        
        if (empty($osmRoutes)) {
            error_log("OSMTransitService: No routes found in area ($minLat, $minLng, $maxLat, $maxLng)");
            return 0;
        }

        $syncedCount = 0;
        
        foreach ($osmRoutes as $osmRoute) {
            try {
                // Check if route exists
                $stmt = $pdo->prepare("SELECT id FROM routes WHERE osm_id = ?");
                $stmt->execute([$osmRoute['osm_id']]);
                $existing = $stmt->fetch();
                
                if ($existing) {
                    $stmt = $pdo->prepare("
                        UPDATE routes 
                        SET route_name = ?, route_number = ?, updated_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $osmRoute['route_name'],
                        $osmRoute['route_number'],
                        $existing['id']
                    ]);
                    $routeId = $existing['id'];
                } else {
                    $stmt = $pdo->prepare("
                        INSERT INTO routes (route_name, route_number, osm_id, status, created_at, updated_at)
                        VALUES (?, ?, ?, 'active', NOW(), NOW())
                    ");
                    $stmt->execute([
                        $osmRoute['route_name'],
                        $osmRoute['route_number'],
                        $osmRoute['osm_id']
                    ]);
                    $routeId = $pdo->lastInsertId();
                }
                
                // Sync stops
                $this->syncRouteStops($pdo, $routeId, $osmRoute['stops']);
                $syncedCount++;
            } catch (Exception $e) {
                error_log("OSMTransitService Error syncing route {$osmRoute['osm_id']}: " . $e->getMessage());
            }
        }
        
        return $syncedCount;
    }
    
    /**
     * Sync stops for a route
     */
    private function syncRouteStops($pdo, $routeId, $stops) {
        // Delete existing from route_stops for this route
        $stmt = $pdo->prepare("DELETE FROM route_stops WHERE route_id = ?");
        $stmt->execute([$routeId]);
        
        $order = 1;
        foreach ($stops as $stop) {
            try {
                // Check if stop exists
                $stmt = $pdo->prepare("SELECT id FROM stops WHERE osm_id = ?");
                $stmt->execute([$stop['osm_id']]);
                $existingStop = $stmt->fetch();
                
                if ($existingStop) {
                    $stopId = $existingStop['id'];
                } else {
                    $stmt = $pdo->prepare("
                        INSERT INTO stops (stop_name, latitude, longitude, osm_id, created_at)
                        VALUES (?, ?, ?, ?, NOW())
                    ");
                    $stmt->execute([
                        $stop['name'],
                        $stop['lat'],
                        $stop['lon'],
                        $stop['osm_id']
                    ]);
                    $stopId = $pdo->lastInsertId();
                }
                
                // Add to route_stops
                $stmt = $pdo->prepare("
                    INSERT INTO route_stops (route_id, stop_id, stop_order)
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([$routeId, $stopId, $order++]);
            } catch (Exception $e) {
                error_log("OSMTransitService Error syncing stop {$stop['osm_id']}: " . $e->getMessage());
            }
        }
    }
}
