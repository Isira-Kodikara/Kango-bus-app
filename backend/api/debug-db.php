<?php
/**
 * Debug endpoint - shows database state and nearest stops for diagnostics
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/Database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Get all stops
    $stops = $db->query("SELECT * FROM stops")->fetchAll(PDO::FETCH_ASSOC);
    
    // Get all routes
    $routes = $db->query("SELECT * FROM routes")->fetchAll(PDO::FETCH_ASSOC);
    
    // Get all segments
    $segments = $db->query("SELECT * FROM route_segments")->fetchAll(PDO::FETCH_ASSOC);
    
    // Test nearest stop query for a Colombo location
    $testLat = 6.9271;
    $testLng = 79.8612;
    
    $nearestQuery = $db->prepare("
        SELECT 
            id, stop_name, latitude, longitude,
            (6371 * acos(
                LEAST(1.0, GREATEST(-1.0,
                    cos(radians(?)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians(?)) +
                    sin(radians(?)) * sin(radians(latitude))
                ))
            )) AS distance_km
        FROM stops
        ORDER BY distance_km ASC
        LIMIT 5
    ");
    $nearestQuery->execute([$testLat, $testLng, $testLat]);
    $nearestStops = $nearestQuery->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'database_state' => [
            'total_stops' => count($stops),
            'total_routes' => count($routes),
            'total_segments' => count($segments),
            'stops' => $stops,
            'routes' => $routes,
            'segments_count' => count($segments)
        ],
        'nearest_stops_test' => [
            'test_location' => ['lat' => $testLat, 'lng' => $testLng, 'description' => 'Colombo center'],
            'nearest' => $nearestStops
        ]
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
