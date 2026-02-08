<?php

// Validates and processes journey planning requests
// Endpoint: POST /api/journey-planner.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Include Services
require_once __DIR__ . '/../services/RouteFinderService.php';
require_once __DIR__ . '/../services/WalkingDirectionsService.php';
require_once __DIR__ . '/../services/BusETAService.php';
require_once __DIR__ . '/../includes/Database.php';

// Get JSON Input
$input = json_decode(file_get_contents('php://input'), true);

// Validate Input
if (!isset($input['origin_lat'], $input['origin_lng'], $input['destination_lat'], $input['destination_lng'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: origin_lat, origin_lng, destination_lat, destination_lng']);
    exit;
}

$origin = [
    'lat' => $input['origin_lat'], 
    'lng' => $input['origin_lng']
];
$dest = [
    'lat' => $input['destination_lat'], 
    'lng' => $input['destination_lng']
];
$userId = $input['user_id'] ?? 0; // Optional for guests, required for logged in

try {
    // 1. Find Best Bus Route (Logic: Nearest stops + Dijkstra)
    $routeFinder = new RouteFinderService();
    $bestRoute = $routeFinder->findBestRoute(
        $origin['lat'], $origin['lng'],
        $dest['lat'], $dest['lng']
    );

    if (isset($bestRoute['error'])) {
        echo json_encode(['success' => false, 'message' => $bestRoute['error']]);
        exit;
    }

    $boardingStop = $bestRoute['boarding_stop'];
    $alightingStop = $bestRoute['alighting_stop'];
    $busData = $bestRoute['bus_data'];

    // 2. Get Accurate Walking Directions (Mapbox) from Origin -> Boarding Stop
    $walkingService = new WalkingDirectionsService();
    $walkingPath = $walkingService->getWalkingPath(
        $origin['lat'], $origin['lng'],
        $boardingStop['latitude'], $boardingStop['longitude']
    );

    // 3. Get Real-time Bus ETA
    $busService = new BusETAService();
    // Assuming simple route for now; if multiple routes, we'd need to handle lists
    // The RouteFinder returns 'primary_route_id' or 'routes' array.
    $routeId = $busData['routes'][0] ?? null; 
    
    $nextBusEtaSeconds = null;
    if ($routeId) {
        $nextBusEtaSeconds = $busService->getNextBusETA($boardingStop['id'], $routeId);
    }

    // 4. Analysis: Can user catch the bus?
    $canCatch = false;
    if ($nextBusEtaSeconds !== null) {
        $canCatch = $busService->canCatchBus(
            $walkingPath['duration_seconds'], 
            $nextBusEtaSeconds
        );
    }

    // 5. Construct Response
    $response = [
        'success' => true,
        'journey' => [
            'origin' => $origin,
            'destination' => $dest,
            'walking_path' => $walkingPath, // coordinates for map
            'boarding_stop' => $boardingStop,
            'alighting_stop' => $alightingStop,
            'bus_route_id' => $routeId,
            'metrics' => [
                'walking_distance_meters' => $walkingPath['distance_meters'],
                'walking_time_seconds' => $walkingPath['duration_seconds'],
                'bus_travel_time_seconds' => $busData['total_bus_time_seconds'],
                'total_time_seconds' => $walkingPath['duration_seconds'] + $busData['total_bus_time_seconds'] + $bestRoute['walk_from_stop']['time'],
                'next_bus_eta_seconds' => $nextBusEtaSeconds,
                'can_catch_bus' => $canCatch
            ]
        ]
    ];

    // 6. Save to Database (Logging)
    if ($userId) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("INSERT INTO journey_plans 
            (user_id, origin_lat, origin_lng, destination_lat, destination_lng, selected_route_id, 
             boarding_stop_id, alighting_stop_id, walking_distance_meters, walking_time_seconds, 
             bus_travel_time_seconds, total_journey_time_seconds, can_catch_next_bus)
            VALUES 
            (:uid, :olat, :olng, :dlat, :dlng, :rid, :bsid, :asid, :wdm, :wts, :bts, :tts, :ccnb)
        ");
        
        $stmt->execute([
            ':uid' => $userId,
            ':olat' => $origin['lat'], ':olng' => $origin['lng'],
            ':dlat' => $dest['lat'], ':dlng' => $dest['lng'],
            ':rid' => $routeId,
            ':bsid' => $boardingStop['id'],
            ':asid' => $alightingStop['id'],
            ':wdm' => $walkingPath['distance_meters'],
            ':wts' => $walkingPath['duration_seconds'],
            ':bts' => $busData['total_bus_time_seconds'],
            ':tts' => $response['journey']['metrics']['total_time_seconds'],
            ':ccnb' => $canCatch ? 1 : 0
        ]);
        
        $response['plan_id'] = $db->lastInsertId();
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
