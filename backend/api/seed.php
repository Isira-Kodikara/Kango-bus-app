<?php
/**
 * Real-World Seeder for Colombo, Sri Lanka
 * 
 * This script clears everything and populates with actual Colombo bus routes 
 * and their corresponding walking-friendly coordinates.
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/Database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // 1. CLEAR EVERYTHING (Fresh Start)
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    $db->exec("TRUNCATE TABLE route_segments");
    $db->exec("TRUNCATE TABLE route_stops");
    $db->exec("TRUNCATE TABLE trips");
    $db->exec("TRUNCATE TABLE buses");
    $db->exec("TRUNCATE TABLE stops");
    $db->exec("TRUNCATE TABLE routes");
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");

    // 2. ACTUAL COLOMBO BUS STOPS 
    // These coordinates are confirmed on Google Maps/OSM
    $stops = [
        // Route 100/101 Line (Galle Road)
        ['Fort Railway Station', 'FRT', 6.9344, 79.8428, 'Fort, Colombo 01'],
        ['Pettah Bus Stand', 'PTH', 6.9366, 79.8500, 'Pettah, Colombo 11'],
        ['Galle Face Green', 'GFG', 6.9248, 79.8448, 'Galle Face, Colombo 03'],
        ['Kollupitiya Junction', 'KLP', 6.9114, 79.8489, 'Galle Road, Colombo 03'],
        ['Bambalapitiya Junction', 'BBP', 6.8897, 79.8553, 'Galle Road, Colombo 04'],
        ['Wellawatte Junction', 'WLW', 6.8747, 79.8594, 'Galle Road, Colombo 06'],
        ['Dehiwala Junction', 'DHW', 6.8564, 79.8650, 'Galle Road, Dehiwala'],
        ['Mount Lavinia Hotel Stop', 'MLV', 6.8390, 79.8660, 'Galle Road, Mt Lavinia'],

        // Route 138 Line (High Level Road)
        ['Maradana Railway Station', 'MRD', 6.9289, 79.8675, 'Maradana, Colombo 10'],
        ['Borella Junction', 'BRL', 6.9147, 79.8778, 'Borella, Colombo 08'],
        ['Town Hall', 'TWH', 6.9167, 79.8636, 'Cinnamon Gardens, Colombo 07'],
        ['Kirulapone', 'KRP', 6.8782, 79.8789, 'High Level Rd, Kirulapone'],
        ['Nugegoda Junction', 'NGD', 6.8722, 79.8883, 'High Level Rd, Nugegoda'],
        ['Maharagama Stand', 'MHR', 6.8481, 79.9267, 'High Level Rd, Maharagama'],
        
        // Internal Connections
        ['Thummulla Junction', 'TMJ', 6.9015, 79.8617, 'Thummulla, Colombo 07']
    ];

    $stmtStop = $db->prepare("INSERT INTO stops (stop_name, stop_code, latitude, longitude, address, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())");
    foreach ($stops as $stop) {
        $stmtStop->execute($stop);
    }

    // 3. OFFICIAL ROUTES
    $routes = [
        ['100', 'Panadura - Colombo Fort', 'Colombo Fort', 'Panadura', 7, 45, 8, '#3b82f6'],
        ['138', 'Maharagama - Pettah', 'Pettah', 'Maharagama', 10, 55, 5, '#ef4444'],
        ['154', 'Angulana - Kiribathgoda', 'Angulana', 'Kiribathgoda', 15, 80, 15, '#10b981']
    ];

    $stmtRoute = $db->prepare("INSERT INTO routes (route_number, route_name, start_point, end_point, total_stops, avg_time_minutes, frequency_minutes, color, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())");
    foreach ($routes as $route) {
        $stmtRoute->execute($route);
    }

    // Map names to IDs for segments
    $stopIds = $db->query("SELECT id, stop_name FROM stops")->fetchAll(PDO::FETCH_KEY_PAIR);
    $stopIds = array_flip($stopIds);
    $routeIds = $db->query("SELECT id, route_number FROM routes")->fetchAll(PDO::FETCH_KEY_PAIR);
    $routeIds = array_flip($routeIds);

    // 4. ROUTE STOPS & SEGMENTS (The Network Graph)
    // This allows the Journey Planner to find valid connections
    $network = [
        // Route 100: Fort -> Mt Lavinia
        ['100', 'Fort Railway Station', 'Galle Face Green', 1.2, 20],
        ['100', 'Galle Face Green', 'Kollupitiya Junction', 1.8, 30],
        ['100', 'Kollupitiya Junction', 'Bambalapitiya Junction', 2.5, 40],
        ['100', 'Bambalapitiya Junction', 'Wellawatte Junction', 2.1, 40],
        ['100', 'Wellawatte Junction', 'Dehiwala Junction', 2.0, 35],
        ['100', 'Dehiwala Junction', 'Mount Lavinia Hotel Stop', 2.4, 30],
        
        // Route 138: Pettah -> Maharagama
        ['138', 'Pettah Bus Stand', 'Maradana Railway Station', 1.5, 15],
        ['138', 'Maradana Railway Station', 'Town Hall', 1.8, 20],
        ['138', 'Town Hall', 'Borella Junction', 1.6, 20],
        ['138', 'Borella Junction', 'Thummulla Junction', 2.4, 30],
        ['138', 'Thummulla Junction', 'Kirulapone', 2.8, 30],
        ['138', 'Kirulapone', 'Nugegoda Junction', 1.2, 25],
        ['138', 'Nugegoda Junction', 'Maharagama Stand', 4.5, 40]
    ];

    $stmtRS = $db->prepare("INSERT INTO route_segments (route_id, from_stop_id, to_stop_id, distance_km, default_speed_kmh, sequence_order) VALUES (?, ?, ?, ?, ?, ?)");
    $stmtMap = $db->prepare("INSERT INTO route_stops (route_id, stop_id, stop_order) VALUES (?, ?, ?)");

    $orderIdx = 1;
    foreach ($network as $link) {
        $rId = $routeIds[$link[0]];
        $fId = $stopIds[$link[1]];
        $tId = $stopIds[$link[2]];
        
        // Insert segment (Uni-directional for simplicity in this seed)
        $stmtRS->execute([$rId, $fId, $tId, $link[3], $link[4], $orderIdx]);
        
        // Map stop sequence for ETAs
        $stmtMap->execute([$rId, $fId, $orderIdx]);
        if ($link[2] === end($network)[2]) { // If it's the last stop of a route line
             $stmtMap->execute([$rId, $tId, $orderIdx + 1]);
        }
        $orderIdx++;
    }

    // 5. LIVE BUSES (Sample of what live data would look like)
    $buses = [
        ['NB-4450', 55, 'active'],
        ['NA-9981', 40, 'active'],
        ['NB-1120', 60, 'active']
    ];
    $stmtBus = $db->prepare("INSERT INTO buses (plate_number, capacity, status) VALUES (?, ?, ?)");
    foreach ($buses as $bus) {
        $stmtBus->execute($bus);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Clean Slate: Database purged and populated with accurate Colombo 100 & 138 routes.',
        'stats' => [
            'stops' => count($stops),
            'routes' => count($routes),
            'segments' => count($network)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
