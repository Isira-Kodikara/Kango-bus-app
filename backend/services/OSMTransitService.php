<?php

class OSMTransitService {
    private $apiEndpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ];
    
    /**
     * Get ALL bus stops and routes from OpenStreetMap in a specific area
     */
    public function syncArea($pdo, $minLat, $minLng, $maxLat, $maxLng) {
        $bbox = "$minLat,$minLng,$maxLat,$maxLng";
        
        // Comprehensive query for both route relations AND standalone stop nodes
        $query = "[out:json][timeout:180];
            (
              // Get all bus stops
              node[\"highway\"=\"bus_stop\"]($bbox);
              node[\"public_transport\"=\"stop_position\"][\"bus\"=\"yes\"]($bbox);
              node[\"public_transport\"=\"platform\"][\"bus\"=\"yes\"]($bbox);
              
              // Get all bus routes and their members
              relation[\"type\"=\"route\"][\"route\"=\"bus\"]($bbox);
              relation[\"route\"=\"bus\"]($bbox);
            );
            out body;
            >;
            out skel qt;";
        
        $data = $this->fetchFromOverpass($query);
        if (!$data || !isset($data['elements'])) {
            return ["success" => false, "message" => "Failed to fetch data from OSM"];
        }

        $nodes = [];
        $relations = [];
        foreach ($data['elements'] as $element) {
            if ($element['type'] === 'node') {
                $nodes[$element['id']] = $element;
            } elseif ($element['type'] === 'relation') {
                $relations[] = $element;
            }
        }

        // 1. First, sync ALL bus stop nodes found
        $stopCount = 0;
        $stmtStop = $pdo->prepare("
            INSERT INTO stops (stop_name, latitude, longitude, osm_id, created_at)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
            stop_name = VALUES(stop_name),
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            updated_at = NOW()
        ");

        foreach ($nodes as $id => $node) {
            $isStop = isset($node['tags']['highway']) && $node['tags']['highway'] === 'bus_stop';
            $isStopPos = isset($node['tags']['public_transport']) && 
                         ($node['tags']['public_transport'] === 'stop_position' || $node['tags']['public_transport'] === 'platform');
            
            if ($isStop || $isStopPos) {
                $name = $node['tags']['name'] ?? "Stop #$id";
                // Filter out obviously bad names
                if (strpos($name, "http") !== false) $name = "Bus Stop #$id";
                
                $stmtStop->execute([$name, $node['lat'], $node['lon'], $id]);
                $stopCount++;
            }
        }

        // 2. Sync Routes and their connections
        $routeCount = 0;
        foreach ($relations as $rel) {
            $tags = $rel['tags'] ?? [];
            if (!isset($tags['route']) || $tags['route'] !== 'bus') continue;

            $routeNum = $tags['ref'] ?? 'N/A';
            $routeName = $tags['name'] ?? ($tags['ref'] ?? 'Unknown Route');
            
            // Insert/Update Route
            $stmt = $pdo->prepare("
                INSERT INTO routes (route_name, route_number, osm_id, status, created_at, updated_at)
                VALUES (?, ?, ?, 'active', NOW(), NOW())
                ON DUPLICATE KEY UPDATE 
                route_name = VALUES(route_name),
                route_number = VALUES(route_number),
                updated_at = NOW()
            ");
            $stmt->execute([$routeName, $routeNum, $rel['id']]);
            $routeId = $pdo->lastInsertId() ?: $this->getRouteIdByOsmId($pdo, $rel['id']);

            if (!$routeId) continue;

            // Sync Member Stops (Route Order)
            if (isset($rel['members'])) {
                $order = 1;
                // Clean old mappings for this route
                $pdo->prepare("DELETE FROM route_stops WHERE route_id = ?")->execute([$routeId]);
                
                foreach ($rel['members'] as $member) {
                    if ($member['type'] === 'node' && in_array($member['role'], ['stop', 'platform'])) {
                        $nodeId = $member['ref'];
                        $internalStopId = $this->getStopIdByOsmId($pdo, $nodeId);
                        
                        if ($internalStopId) {
                            $stmtRS = $pdo->prepare("
                                INSERT INTO route_stops (route_id, stop_id, stop_order)
                                VALUES (?, ?, ?)
                                ON DUPLICATE KEY UPDATE stop_order = VALUES(stop_order)
                            ");
                            $stmtRS->execute([$routeId, $internalStopId, $order++]);
                        }
                    }
                }
            }
            $routeCount++;
        }

        return [
            "success" => true, 
            "stops_synced" => $stopCount, 
            "routes_synced" => $routeCount
        ];
    }

    private function fetchFromOverpass($query) {
        foreach ($this->apiEndpoints as $apiUrl) {
            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, "data=" . urlencode($query));
            curl_setopt($ch, CURLOPT_USERAGENT, "KANGO-Bus-App-Service/1.0");
            curl_setopt($ch, CURLOPT_TIMEOUT, 120);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            
            if ($httpCode === 200 && $response) {
                return json_decode($response, true);
            }
        }
        return null;
    }

    private function getStopIdByOsmId($pdo, $osmId) {
        $stmt = $pdo->prepare("SELECT id FROM stops WHERE osm_id = ?");
        $stmt->execute([$osmId]);
        return $stmt->fetchColumn();
    }

    private function getRouteIdByOsmId($pdo, $osmId) {
        $stmt = $pdo->prepare("SELECT id FROM routes WHERE osm_id = ?");
        $stmt->execute([$osmId]);
        return $stmt->fetchColumn();
    }
}
