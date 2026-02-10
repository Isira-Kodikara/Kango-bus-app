<?php

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../services/RouteFinderService.php';
require_once __DIR__ . '/../services/BusETAService.php';
require_once __DIR__ . '/../services/WalkingDirectionsService.php';
require_once __DIR__ . '/../services/GeoUtils.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    $requiredFields = ['origin_lat', 'origin_lng', 'destination_lat', 'destination_lng'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    $originLat = floatval($data['origin_lat']);
    $originLng = floatval($data['origin_lng']);
    $destLat = floatval($data['destination_lat']);
    $destLng = floatval($data['destination_lng']);
    $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    
    // Initialize services
    $db = Database::getInstance()->getConnection();
    
    $routeFinder = new RouteFinderService($db);
    $etaService = new BusETAService($db);
    
    $openrouteKey = getenv('OPENROUTE_API_KEY');
    if (!$openrouteKey) {
        // Try to load from env file or use a placeholder if dev
        // For now, let's assume it's set or handle gracefully
        // If not set, WalkingDirectionsService will fallback to straight line
        $openrouteKey = ''; 
    }
    
    $walkingService = new WalkingDirectionsService($openrouteKey);
    
    // Find best bus route
    $bestRoute = $routeFinder->findBestRoute($originLat, $originLng, $destLat, $destLng);
    
    if (!$bestRoute) {
        // If no bus route found, maybe just walking?
        // Check distance
        $directDistance = GeoUtils::haversineDistance($originLat, $originLng, $destLat, $destLng);
        if ($directDistance < 2.0) { // If less than 2km, suggest walking
             $walkingPath = $walkingService->getWalkingPath($originLat, $originLng, $destLat, $destLng);
             echo json_encode([
                'success' => true,
                'needs_walking_guidance' => true,
                'distance_to_stop' => 0, // Direct walk
                'direct_walk' => true,
                'walking_path' => $walkingPath,
                'total_time' => $walkingPath['duration_seconds'] / 60,
                 'message' => 'Destination is close enough to walk directly.'
             ]);
             exit;
        }
        
        throw new Exception('No bus route found between origin and destination');
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
        'total_time' => round($bestRoute['total_time'] * 60)
    ];

    // Get bus path coordinates for map polyline
    if (!empty($bestRoute['bus_path'])) {
        $stopIds = implode(',', array_map('intval', $bestRoute['bus_path']));
        try {
            $stmt = $db->query("SELECT latitude, longitude FROM bus_stops WHERE stop_id IN ($stopIds) ORDER BY FIELD(stop_id, $stopIds)");
            $busPathCoordinates = $stmt->fetchAll(PDO::FETCH_FUNC, function($lat, $lng) {
                return [(float)$lat, (float)$lng];
            });
            $response['bus_path_coordinates'] = $busPathCoordinates;
        } catch (PDOException $e) {
            // Fallback to 'stops' table
             try {
                $stmt = $db->query("SELECT latitude, longitude FROM stops WHERE id IN ($stopIds) ORDER BY FIELD(id, $stopIds)");
                $busPathCoordinates = $stmt->fetchAll(PDO::FETCH_FUNC, function($lat, $lng) {
                    return [(float)$lat, (float)$lng];
                });
                $response['bus_path_coordinates'] = $busPathCoordinates;
             } catch (PDOException $e2) {
                 // Ignore if verify fails
             }
        }
    }
    
    if ($needsGuidance) {
        // Get walking path from OpenRouteService
        $walkingPath = $walkingService->getWalkingPath(
            $originLat, $originLng,
            $bestRoute['boarding_stop']['latitude'],
            $bestRoute['boarding_stop']['longitude']
        );
        
        // Get next bus ETA
        $nextBus = $etaService->getNextBusETA($bestRoute['boarding_stop']['stop_id']);
        
        // Check if can catch bus
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
    }
    
    // Walking path from alighting stop to destination
     $walkingPathDest = $walkingService->getWalkingPath(
            $bestRoute['alighting_stop']['latitude'],
            $bestRoute['alighting_stop']['longitude'],
            $destLat,
            $destLng
        );
    $response['walking_path_to_destination'] = $walkingPathDest;
    
    
    // Save journey plan
    // Using 'journey_plans' table. Be careful if table doesn't exist.
    try {
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
            $response['bus_travel_time'],
            $response['total_time'],
            $response['can_catch_next_bus'] ?? 0
        ]);
    } catch (PDOException $e) {
        // Ignore save error, don't break response
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
