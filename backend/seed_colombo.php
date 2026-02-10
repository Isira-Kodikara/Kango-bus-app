<?php
header('Content-Type: application/json');
require_once __DIR__ . '/includes/Database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Clear existing data
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    $db->exec("TRUNCATE TABLE route_segments");
    $db->exec("TRUNCATE TABLE stops");
    $db->exec("TRUNCATE TABLE routes");
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Bus Stops - EXACT coordinates from frontend Map.tsx
    $stops = [
        ['Fort Railway Station', 'FRT', 6.9344, 79.8428, 'Olcott Mawatha, Colombo 01'],
        ['Pettah Bus Stand', 'PTH', 6.9366, 79.8500, 'Manning Market, Colombo 11'],
        ['Kollupitiya Junction', 'KLP', 6.9114, 79.8489, 'Galle Road, Colombo 03'],
        ['Bambalapitiya', 'BBP', 6.8897, 79.8553, 'Galle Road, Colombo 04'],
        ['Wellawatte', 'WLW', 6.8747, 79.8594, 'Galle Road, Colombo 06'],
        ['Dehiwala', 'DHW', 6.8564, 79.8650, 'Galle Road, Dehiwala'],
        ['Mount Lavinia', 'MLV', 6.8390, 79.8660, 'Galle Road, Mount Lavinia'],
        ['Town Hall', 'TWH', 6.9167, 79.8636, 'Cinnamon Gardens, Colombo 07'],
        ['Borella Junction', 'BRL', 6.9147, 79.8778, 'Ward Place, Colombo 08'],
        ['Maradana', 'MRD', 6.9289, 79.8675, 'Maradana Road, Colombo 10'],
        ['Nugegoda', 'NGD', 6.8722, 79.8883, 'High Level Road, Nugegoda'],
        ['Maharagama', 'MHR', 6.8481, 79.9267, 'High Level Road, Maharagama']
    ];

    $stmt = $db->prepare("INSERT INTO stops (stop_name, stop_code, latitude, longitude, address, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())");
    foreach ($stops as $stop) {
        $stmt->execute($stop);
    }
    
    // Routes
    $routes = [
        ['100', 'Coastal Line', 'Fort', 'Mount Lavinia', 7, 45, 10, '#3b82f6'],
        ['138', 'High Level Road', 'Pettah', 'Maharagama', 10, 60, 5, '#ef4444'],
        ['177', 'Kollupitiya - Kaduwela', 'Kollupitiya', 'Kaduwela', 20, 50, 15, '#10b981']
    ];

    $stmt = $db->prepare("INSERT INTO routes (route_number, route_name, start_point, end_point, total_stops, avg_time_minutes, frequency_minutes, color, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())");
    foreach ($routes as $route) {
        $stmt->execute($route);
    }

    // Get IDs
    $stopIds = [];
    $res = $db->query("SELECT id, stop_name FROM stops");
    while ($row = $res->fetch(PDO::FETCH_ASSOC)) {
        $stopIds[$row['stop_name']] = $row['id'];
    }

    $routeIds = [];
    $res = $db->query("SELECT id, route_number FROM routes");
    while ($row = $res->fetch(PDO::FETCH_ASSOC)) {
        $routeIds[$row['route_number']] = $row['id'];
    }

    // Route Segments
    $segments = [
        // Route 100: Fort -> Mt Lavinia
        ['100', 'Fort Railway Station', 'Pettah Bus Stand', 1.0, 20, 'urban_arterial'],
        ['100', 'Pettah Bus Stand', 'Kollupitiya Junction', 3.0, 30, 'congested'],
        ['100', 'Kollupitiya Junction', 'Bambalapitiya', 2.5, 40, 'urban_arterial'],
        ['100', 'Bambalapitiya', 'Wellawatte', 2.0, 40, 'urban_arterial'],
        ['100', 'Wellawatte', 'Dehiwala', 2.0, 35, 'urban_arterial'],
        ['100', 'Dehiwala', 'Mount Lavinia', 2.5, 30, 'urban_arterial'],
        
        // Reverse Route 100
        ['100', 'Mount Lavinia', 'Dehiwala', 2.5, 30, 'urban_arterial'],
        ['100', 'Dehiwala', 'Wellawatte', 2.0, 35, 'urban_arterial'],
        ['100', 'Wellawatte', 'Bambalapitiya', 2.0, 40, 'urban_arterial'],
        ['100', 'Bambalapitiya', 'Kollupitiya Junction', 2.5, 40, 'urban_arterial'],
        ['100', 'Kollupitiya Junction', 'Pettah Bus Stand', 3.0, 30, 'congested'],
        ['100', 'Pettah Bus Stand', 'Fort Railway Station', 1.0, 20, 'urban_arterial'],

        // Route 138 connections
        ['138', 'Pettah Bus Stand', 'Maradana', 1.5, 20, 'urban_arterial'],
        ['138', 'Maradana', 'Borella Junction', 2.0, 25, 'urban_arterial'],
        ['138', 'Borella Junction', 'Town Hall', 1.5, 15, 'congested'],
    ];

    $stmt = $db->prepare("INSERT INTO route_segments (route_id, from_stop_id, to_stop_id, distance_km, default_speed_kmh, road_type, sequence_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");

    $seq = 1;
    foreach ($segments as $seg) {
        $rId = $routeIds[$seg[0]] ?? null;
        $fId = $stopIds[$seg[1]] ?? null;
        $tId = $stopIds[$seg[2]] ?? null;

        if ($rId && $fId && $tId) {
            $stmt->execute([$rId, $fId, $tId, $seg[3], $seg[4], $seg[5], $seq++]);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Database fully aligned with frontend Map data',
        'counts' => ['stops' => count($stops), 'routes' => count($routes), 'segments' => count($segments)]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
