<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Response.php';

try {
    $db = Database::getInstance()->getConnection();

    // Fetch buses matching similar format to what frontend expects
    // Only fetch buses active and updated recently (e.g. last 10 mins)
    // If no recent update, they might be offline. 
    // For MVP demo, avoiding strict time check to ensure they show up if updated once.
    
    $query = "
        SELECT 
            b.id,
            b.plate_number, 
            b.route_id, 
            b.latitude, 
            b.longitude, 
            b.heading, 
            b.current_passengers as passengers, 
            b.capacity,
            b.status,
            r.route_number,
            r.route_name,
            r.color
        FROM buses b
        LEFT JOIN routes r ON b.route_id = r.id
        WHERE b.status = 'active'
        AND b.latitude IS NOT NULL 
        AND b.longitude IS NOT NULL
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $buses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format for frontend
    // Frontend expects: plate_number, route_id, latitude, longitude, heading, passengers, capacity
    // And possibly progress (which we can't easily calc without full path, set to 0 or remove)
    
    $output = array_map(function($bus) {
        return [
            'plate_number' => $bus['plate_number'],
            'route_id' => $bus['route_id'],
            'latitude' => (float)$bus['latitude'],
            'longitude' => (float)$bus['longitude'],
            'heading' => (int)$bus['heading'],
            'passengers' => (int)$bus['passengers'],
            'capacity' => (int)$bus['capacity'],
            'status' => $bus['status'],
            'route_number' => $bus['route_number'],
            'route_name' => $bus['route_name'],
            'color' => $bus['color'],
            // Add 'route' string for frontend display consistency
            'route' => $bus['route_number'] . ' - ' . $bus['route_name']
        ];
    }, $buses);

    echo json_encode([
        'success' => true,
        'buses' => $output
    ]);

} catch (Exception $e) {
    Response::error("Failed to fetch live buses: " . $e->getMessage(), 500);
}
