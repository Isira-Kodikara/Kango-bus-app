<?php

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../services/OSMTransitService.php';

// Already handled by config.php via Database.php
// header('Content-Type: application/json');

$pdo = Database::getInstance()->getConnection();

// Define your service area (adjust for your city)
// Example: Colombo, Sri Lanka
$minLat = floatval(getenv('SERVICE_AREA_MIN_LAT') ?: 6.8);
$minLng = floatval(getenv('SERVICE_AREA_MIN_LNG') ?: 79.7);
$maxLat = floatval(getenv('SERVICE_AREA_MAX_LAT') ?: 7.0);
$maxLng = floatval(getenv('SERVICE_AREA_MAX_LNG') ?: 80.0);

$osmService = new OSMTransitService();

try {
    $syncedCount = $osmService->syncRoutesToDatabase($pdo, $minLat, $minLng, $maxLat, $maxLng);
    
    echo json_encode([
        'success' => true,
        'message' => "Synced $syncedCount routes from OpenStreetMap",
        'synced_routes' => $syncedCount
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
