<?php
/**
 * OSM Bus Route Importer for Colombo, Sri Lanka
 * 
 * This script:
 * 1. Clears existing transit data from the database.
 * 2. Fetches bus route data from OSM Overpass API.
 * 3. Processes and inserts data into the database.
 */

// Load configuration and database
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Database.php';

// Set headers for CLI or Browser output
if (php_sapi_name() === 'cli') {
    ini_set('display_errors', 1);
} else {
    header('Content-Type: text/plain');
}

function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    echo "[$timestamp] $message\n";
    // Optional: write to file
    file_put_contents(__DIR__ . '/import_osm.log', "[$timestamp] $message\n", FILE_APPEND);
}

try {
    $db = Database::getInstance()->getConnection();
    logMessage("Starting OSM Import Process...");

    // 1. CLEAR EXISTING DATA
    logMessage("Clearing existing transit data...");
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    $tablesToClear = [
        'payments',
        'trips',
        'wait_requests',
        'emergency_alerts',
        'crew_reports',
        'schedule',
        'route_segments',
        'route_stops',
        'buses',
        'routes',
        'stops'
    ];

    foreach ($tablesToClear as $table) {
        logMessage("Truncating table: $table");
        $db->exec("TRUNCATE TABLE $table");
        // Reset auto-increment is implicit in TRUNCATE for most MySQL engines, 
        // but some might need ALTER TABLE. TRUNCATE is generally sufficient.
    }
    
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    logMessage("Database cleared successfully.");

    // 2. FETCH DATA FROM OVERPASS API
    // Bounding box for Colombo: (6.8, 79.8, 7.0, 80.0)
    $bbox = "6.8,79.8,7.0,80.0";
    $query = '[out:json][timeout:180];
        (
          relation["type"="route"]["route"="bus"](' . $bbox . ');
        );
        out body;
        >;
        out skel qt;';

    $apiEndpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ];
    
    $response = null;
    $httpCode = 0;
    $success = false;

    foreach ($apiEndpoints as $apiUrl) {
        logMessage("Fetching data from Overpass API ($apiUrl)...");
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, "data=" . urlencode($query));
        curl_setopt($ch, CURLOPT_USERAGENT, "KANGO-Bus-App-Importer/1.1");
        curl_setopt($ch, CURLOPT_TIMEOUT, 200); // Allow enough time for the query to complete
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            if ($data && isset($data['elements'])) {
                $success = true;
                break;
            }
        }
        
        logMessage("Failed to fetch from $apiUrl (HTTP $httpCode). " . (curl_error($ch) ?: ""));
        curl_close($ch);
        
        if ($httpCode === 429) {
            logMessage("Rate limited. Waiting 10 seconds before next attempt...");
            sleep(10);
        } else {
            sleep(2); // Short pause between retry with different endpoint
        }
    }

    if (!$success) {
        throw new Exception("All Overpass API endpoints failed. Last HTTP code: $httpCode. Response start: " . substr($response, 0, 200));
    }
    
    if (isset($ch) && is_resource($ch)) {
        curl_close($ch);
    }
    
    logMessage("Fetched " . count($data['elements']) . " elements from OSM.");

    // 3. PROCESS DATA
    $nodes = [];
    $ways = [];
    $relations = [];

    foreach ($data['elements'] as $element) {
        if ($element['type'] === 'node') {
            $nodes[$element['id']] = $element;
        } elseif ($element['type'] === 'way') {
            $ways[$element['id']] = $element;
        } elseif ($element['type'] === 'relation') {
            $relations[] = $element;
        }
    }

    logMessage("Processing " . count($relations) . " bus routes...");

    $stmtStop = $db->prepare("INSERT INTO stops (stop_name, latitude, longitude, osm_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)");
    $stmtRoute = $db->prepare("INSERT INTO routes (route_number, route_name, start_point, end_point, osm_id, operator, geometry, total_stops) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmtRouteStop = $db->prepare("INSERT INTO route_stops (route_id, stop_id, stop_order) VALUES (?, ?, ?)");

    $importCount = 0;
    foreach ($relations as $rel) {
        $tags = $rel['tags'] ?? [];
        $routeName = $tags['name'] ?? ($tags['ref'] ?? 'Unknown Route');
        $routeRef = $tags['ref'] ?? 'N/A';
        $from = $tags['from'] ?? 'Unknown';
        $to = $tags['to'] ?? 'Unknown';
        $operator = $tags['operator'] ?? 'N/A';
        $osmId = $rel['id'];

        // Extract stops and geometry
        $routeStops = [];
        $routeCoords = [];
        
        foreach ($rel['members'] as $member) {
            if ($member['type'] === 'node' && $member['role'] === 'stop') {
                $nodeId = $member['ref'];
                if (isset($nodes[$nodeId])) {
                    $node = $nodes[$nodeId];
                    $stopName = $node['tags']['name'] ?? "Stop #$nodeId";
                    
                    // Insert or update stop
                    $stmtStop->execute([$stopName, $node['lat'], $node['lon'], $nodeId]);
                    $stopId = $db->lastInsertId();
                    $routeStops[] = $stopId;
                }
            } elseif ($member['type'] === 'way') {
                $wayId = $member['ref'];
                if (isset($ways[$wayId])) {
                    foreach ($ways[$wayId]['nodes'] as $nodeId) {
                        if (isset($nodes[$nodeId])) {
                            $routeCoords[] = [$nodes[$nodeId]['lon'], $nodes[$nodeId]['lat']];
                        }
                    }
                }
            }
        }

        // Format geometry as GeoJSON
        $geometry = json_encode([
            'type' => 'LineString',
            'coordinates' => $routeCoords
        ]);

        // Insert Route
        try {
            $stmtRoute->execute([
                $routeRef,
                $routeName,
                $from,
                $to,
                $osmId,
                $operator,
                $geometry,
                count($routeStops)
            ]);
            $routeId = $db->lastInsertId();

            // Insert route-stop relationships
            $order = 1;
            foreach ($routeStops as $stopId) {
                $stmtRouteStop->execute([$routeId, $stopId, $order++]);
            }

            $importCount++;
            if ($importCount % 10 === 0) {
                logMessage("Processed $importCount routes...");
            }
        } catch (PDOException $e) {
            logMessage("Error inserting route $routeRef (OSM ID $osmId): " . $e->getMessage());
        }
    }

    logMessage("Import completed. Successfully imported $importCount bus routes.");

} catch (Exception $e) {
    logMessage("FATAL ERROR: " . $e->getMessage());
    if (isset($db)) {
        $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    }
}
