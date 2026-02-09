<?php
require_once __DIR__ . '/../backend/services/WalkingDirectionsService.php';

// Mock env for Mapbox Token if not set
// We'll set a dummy token and expect a fallback or error, but we want to verify method existence and return structure.
putenv('MAPBOX_ACCESS_TOKEN=pk.test');

$service = new WalkingDirectionsService();

// Test coordinates (Colombo)
$fromLat = 6.9147;
$fromLng = 79.8778;
$toLat = 6.9344;
$toLng = 79.8428;

echo "Testing getWalkingPath...\n";
try {
    $result = $service->getWalkingPath($fromLat, $fromLng, $toLat, $toLng);

    if (isset($result['distance_meters']) && isset($result['steps'])) {
        echo "SUCCESS: Returned valid structure.\n";
        echo "Source: " . ($result['source'] ?? 'unknown') . "\n";
        echo "Steps count: " . count($result['steps']) . "\n";
    }
    else {
        echo "FAILURE: Invalid structure returned.\n";
        print_r($result);
    }
}
catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
}
