<?php
// backend/api/trip-guidance.php

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../services/GeoUtils.php';
require_once __DIR__ . '/../services/RouteFinderService.php';
require_once __DIR__ . '/../services/BusETAService.php';
require_once __DIR__ . '/../services/WalkingDirectionsService.php';

header('Content-Type: application/json');

// Get database connection
$db = Database::getInstance()->getConnection();

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
    $routeFinder = new RouteFinderService($db);
    $etaService = new BusETAService($db);
    $mapboxToken = getenv('MAPBOX_ACCESS_TOKEN');
    $walkingService = new WalkingDirectionsService($mapboxToken);
    
    // Find best bus route
    $bestRoute = $routeFinder->findBestRoute($originLat, $originLng, $destLat, $destLng);
    
    if (!$bestRoute) {
        throw new Exception($routeFinder->getLastError() ?: 'No route found between origin and destination');
    }
    
    // Check if user is already at boarding stop (within 50 meters)
    $distanceToStop = GeoUtils::haversineDistance(
        $originLat, $originLng,
        $bestRoute['boarding_stop']['latitude'],
        $bestRoute['boarding_stop']['longitude']
    ) * 1000; // Convert to meters
    
    $needsGuidance = $distanceToStop > 50;
    
    $response = [
        'success' => true,
        'needs_walking_guidance' => $needsGuidance,
        'distance_to_stop' => round($distanceToStop),
        'boarding_stop' => $bestRoute['boarding_stop'],
        'alighting_stop' => $bestRoute['alighting_stop'],
        'bus_travel_time' => round($bestRoute['bus_travel_time'] * 60), // Convert to seconds
        'total_time' => round($bestRoute['total_time'] * 60)
    ];
    
    if ($needsGuidance) {
        // Get walking path from Mapbox
        $walkingPath = $walkingService->getWalkingPath(
            $originLat, $originLng,
            $bestRoute['boarding_stop']['latitude'],
            $bestRoute['boarding_stop']['longitude']
        );
        
        // Get next bus ETA
        $nextBus = $etaService->getNextBusETA($bestRoute['boarding_stop']['stop_id']);
        
        // Check if user can catch the bus
        $canCatch = false;
        if ($nextBus) {
            $canCatch = $etaService->canCatchBus(
                $walkingPath['duration_seconds'] / 60,
                $nextBus['eta_minutes']
            );
        }
        
        $response['walking_path'] = $walkingPath;
        $response['next_bus'] = $nextBus;
        $response['can_catch_next_bus'] = $canCatch;
    } else {
        $response['message'] = 'You are already at the boarding stop!';
        $nextBus = $etaService->getNextBusETA($bestRoute['boarding_stop']['stop_id']);
        $response['next_bus'] = $nextBus;
        
        // Even if not walking, we need some dummy walking path for the frontend logic if it expects it
        // Or we just handle it in frontend.
    }
    
    // Save journey plan to database
    $stmt = $db->prepare("
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
        round($bestRoute['bus_travel_time'] * 60),
        round($bestRoute['total_time'] * 60),
        (int)($response['can_catch_next_bus'] ?? false)
    ]);
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
