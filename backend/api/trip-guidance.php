<?php

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../services/RouteFinderService.php';
require_once __DIR__ . '/../services/BusETAService.php';
require_once __DIR__ . '/../services/WalkingDirectionsService.php';
require_once __DIR__ . '/../services/GeoUtils.php';

// Already handled by config.php via Database.php
// header('Content-Type: application/json');

$pdo = Database::getInstance()->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate input
    $requiredFields = ['origin_lat', 'origin_lng', 'destination_lat', 'destination_lng', 'user_id'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    $originLat = floatval($data['origin_lat']);
    $originLng = floatval($data['origin_lng']);
    $destLat = floatval($data['destination_lat']);
    $destLng = floatval($data['destination_lng']);
    $userId = intval($data['user_id']);

    // Initialize services
    $routeFinder = new RouteFinderService($pdo);
    $etaService = new BusETAService($pdo);
    $openrouteKey = getenv('OPENROUTE_API_KEY') ?: '5b3ce3597851110001cf6248abc123def456';
    $walkingService = new WalkingDirectionsService($openrouteKey);

    // Find best bus route
    $bestRoute = $routeFinder->findBestRoute($originLat, $originLng, $destLat, $destLng);

    if (!$bestRoute) {
        // FALLBACK: When no graph-based route found, use nearest stops directly
        // Use wider search (50km) to find ANY stops in the database
        $originStops = $routeFinder->findNearestStops($originLat, $originLng, 3, 50);
        $destStops = $routeFinder->findNearestStops($destLat, $destLng, 3, 50);

        if (empty($originStops) || empty($destStops)) {
            // Count total stops in database for debugging
            $totalStops = $pdo->query("SELECT COUNT(*) FROM stops")->fetchColumn();
            throw new Exception("No bus stops found. DB has $totalStops stops. Origin: $originLat,$originLng Dest: $destLat,$destLng");
        }

        $boardingStop = $originStops[0];
        $alightingStop = $destStops[0];

        // Calculate straight-line estimates
        $busDistKm = GeoUtils::haversineDistance(
            $boardingStop['latitude'], $boardingStop['longitude'],
            $alightingStop['latitude'], $alightingStop['longitude']
        );
        $estimatedBusTimeMin = ($busDistKm / 15) * 60; // 15 km/h avg speed

        $walkToStop = GeoUtils::haversineDistance(
            $originLat, $originLng,
            $boardingStop['latitude'], $boardingStop['longitude']
        ) * 1000;
        $walkingTimeToStop = ($walkToStop / 1.4) / 60;

        $walkFromStop = GeoUtils::haversineDistance(
            $alightingStop['latitude'], $alightingStop['longitude'],
            $destLat, $destLng
        ) * 1000;
        $walkingTimeFromStop = ($walkFromStop / 1.4) / 60;

        $bestRoute = [
            'boarding_stop' => $boardingStop,
            'alighting_stop' => $alightingStop,
            'bus_path' => [$boardingStop['stop_id'], $alightingStop['stop_id']],
            'walking_distance_to_stop' => $walkToStop,
            'walking_time_to_stop' => $walkingTimeToStop,
            'walking_distance_from_stop' => $walkFromStop,
            'walking_time_from_stop' => $walkingTimeFromStop,
            'bus_travel_time' => $estimatedBusTimeMin,
            'total_time' => $walkingTimeToStop + $estimatedBusTimeMin + $walkingTimeFromStop,
            'is_estimate' => true
        ];
    }

    // Check if user at boarding stop (within 50 meters)
    $distanceToStop = GeoUtils::haversineDistance(
        $originLat, $originLng,
        $bestRoute['boarding_stop']['latitude'],
        $bestRoute['boarding_stop']['longitude']
    ) * 1000;

    $needsGuidance = $distanceToStop > 50;

    $response = [
        'success' => true,
        'needs_walking_guidance' => $needsGuidance,
        'distance_to_stop' => round($distanceToStop),
        'boarding_stop' => $bestRoute['boarding_stop'],
        'alighting_stop' => $bestRoute['alighting_stop'],
        'bus_travel_time' => round($bestRoute['bus_travel_time'] * 60),
        'total_time' => round($bestRoute['total_time'] * 60),
        'is_estimate' => $bestRoute['is_estimate'] ?? false
    ];

    // 1. Walking Path To Stop (Origin -> Boarding Stop)
    $walkingPathToStop = null;
    if ($needsGuidance) {
        $walkingPathToStop = $walkingService->getWalkingPath(
            $originLat, $originLng,
            $bestRoute['boarding_stop']['latitude'],
            $bestRoute['boarding_stop']['longitude']
        );
    }
    else {
        $walkingPathToStop = $walkingService->getStraightLinePath(
            $originLat, $originLng,
            $bestRoute['boarding_stop']['latitude'],
            $bestRoute['boarding_stop']['longitude']
        );
    }

    // 2. Walking Path From Stop (Alighting Stop -> Destination)
    $walkingPathFromStop = $walkingService->getWalkingPath(
        $bestRoute['alighting_stop']['latitude'],
        $bestRoute['alighting_stop']['longitude'],
        $destLat, $destLng
    );

    // Get next bus ETA (Filter by the specific route we need)
    $targetRouteId = null;
    if (isset($bestRoute['detailed_path']) && count($bestRoute['detailed_path']) > 1) {
        // detailed_path[1] contains the route_id for the segment leaving the boarding stop
        $targetRouteId = $bestRoute['detailed_path'][1]['route_id'];
    }

    $nextBus = $etaService->getNextBusETA($bestRoute['boarding_stop']['stop_id'], $targetRouteId);

    // Check if can catch bus
    $canCatch = false;
    if ($nextBus && $walkingPathToStop) {
        $canCatch = $etaService->canCatchBus(
            $walkingPathToStop['duration_seconds'] / 60,
            $nextBus['eta_minutes']
        );
    }

    $response['walking_path_to_stop'] = $walkingPathToStop;
    $response['walking_path_from_stop'] = $walkingPathFromStop;
    $response['next_bus'] = $nextBus;
    $response['can_catch_next_bus'] = $canCatch;

    // Legacy support for older frontend code (optional, can be removed if frontend is fully updated)
    $response['walking_path'] = $walkingPathToStop;

    // Save journey plan (wrapped in try-catch so it doesn't break the response)
    try {
        $stmt = $pdo->prepare("
            INSERT INTO journey_plans 
            (user_id, origin_lat, origin_lng, destination_lat, destination_lng,
             boarding_stop_id, alighting_stop_id, walking_distance_meters,
             walking_time_seconds, bus_travel_time_seconds, total_journey_time_seconds,
             can_catch_next_bus)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $userId,
            $originLat, $originLng, $destLat, $destLng,
            $bestRoute['boarding_stop']['stop_id'],
            $bestRoute['alighting_stop']['stop_id'],
            $response['walking_path']['distance_meters'] ?? 0,
            $response['walking_path']['duration_seconds'] ?? 0,
            $response['bus_travel_time'],
            $response['total_time'],
            $response['can_catch_next_bus'] ?? false
        ]);
    }
    catch (Exception $saveErr) {
        // Don't fail the response just because saving the plan failed
        error_log("Failed to save journey plan: " . $saveErr->getMessage());
    }

    echo json_encode($response);


}
catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
