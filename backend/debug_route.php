<?php
// backend/debug_route.php
header('Content-Type: application/json');
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/includes/Database.php';
require_once __DIR__ . '/services/RouteFinderService.php';

try {
    $db = Database::getInstance()->getConnection();
    $finder = new RouteFinderService($db);

    // Hardcoded test coordinates (seed data)
    // Origin: Fort Railway Station (6.9344, 79.8500)
    // Dest: Galle Face Green (6.9271, 79.8450)
    
    $originLat = 6.9344;
    $originLng = 79.8500;
    $destLat = 6.9271;
    $destLng = 79.8450;

    // 1. Check if stops exist near these coordinates
    $nearbyOrigin = $finder->findNearestStops($originLat, $originLng);
    $nearbyDest = $finder->findNearestStops($destLat, $destLng);

    // 2. Attempt route finding
    $route = $finder->findBestRoute($originLat, $originLng, $destLat, $destLng);

    echo json_encode([
        'debug_info' => [
            'origin_coords' => [$originLat, $originLng],
            'dest_coords' => [$destLat, $destLng],
            'nearby_origin_stops' => $nearbyOrigin,
            'nearby_dest_stops' => $nearbyDest,
        ],
        'route_result' => $route
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
