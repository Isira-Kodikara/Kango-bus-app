<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../services/RouteFinderService.php';
require_once __DIR__ . '/../services/WalkingDirectionsService.php';
require_once __DIR__ . '/../services/BusETAService.php';
require_once __DIR__ . '/../services/GeoUtils.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->origin_lat) || 
    !isset($data->origin_lng) || 
    !isset($data->destination_lat) || 
    !isset($data->destination_lng)
) {
    http_response_code(400);
    echo json_encode(["message" => "Incomplete data. Please provide origin and destination coordinates."]);
    exit;
}

try {
    $routeFinder = new RouteFinderService();
    $bestRoute = $routeFinder->findBestRoute(
        $data->origin_lat, 
        $data->origin_lng, 
        $data->destination_lat, 
        $data->destination_lng
    );

    if (isset($bestRoute['error'])) {
        http_response_code(404);
        echo json_encode(["message" => $bestRoute['error']]);
        exit;
    }

    $boardingStop = $bestRoute['boarding_stop'];
    
    // Check distance to boarding stop
    $distanceToStopKm = GeoUtils::haversineDistance(
        $data->origin_lat, 
        $data->origin_lng, 
        $boardingStop['latitude'], 
        $boardingStop['longitude']
    );
    $distanceToStopMeters = $distanceToStopKm * 1000;

    // If user is more than 50m away, they need walking guidance
    $needsGuidance = $distanceToStopMeters > 50;
    
    $response = [
        'needs_walking_guidance' => $needsGuidance,
        'boarding_stop' => $boardingStop,
        'alighting_stop' => $bestRoute['alighting_stop'],
        'current_distance_to_stop' => round($distanceToStopMeters)
    ];

    if ($needsGuidance) {
        // Get walking path with steps
        $walkingService = new WalkingDirectionsService();
        $walkingPath = $walkingService->getWalkingPath(
            $data->origin_lat, 
            $data->origin_lng, 
            $boardingStop['latitude'], 
            $boardingStop['longitude']
        );
        
        $response['walking_path'] = $walkingPath;

        // Get next bus ETA
        // Assuming we use the primary route ID from the route finder result
        // Note: findBestRoute returns 'bus_data' which has 'primary_route_id'
        $routeId = $bestRoute['bus_data']['primary_route_id'] ?? 1; // Default to 1 if missing
        
        $etaService = new BusETAService();
        $nextBusEta = $etaService->getNextBusETA($boardingStop['id'], $routeId);
        
        $response['next_bus'] = [
            'route_id' => $routeId,
            'eta_seconds' => $nextBusEta,
            'eta_minutes' => $nextBusEta ? round($nextBusEta / 60) : null
        ];

        // Check catchability
        $canCatch = false;
        if ($nextBusEta !== null) {
            // Walking duration + 2 min buffer
            $requiredTime = $walkingPath['duration_seconds'] + 120;
            $canCatch = $nextBusEta > $requiredTime;
        }
        $response['can_catch_bus'] = $canCatch;
    }

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Server error: " . $e->getMessage()]);
}
