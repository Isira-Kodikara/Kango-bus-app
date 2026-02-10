<?php
// Verification script for Realistic Routes & Live Buses (Mocking API Context)

echo "Verifying Realistic Routes & Live Buses API (Direct Include)...\n\n";

// Helper to capture output
function capture_output($file)
{
    ob_start();
    include $file;
    return ob_get_clean();
}

// 1. Test get-route-details.php for Route 1
echo "1. Testing get-route-details.php?route_id=1\n";

$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['route_id'] = 1;

$routeDetailsOutput = capture_output(__DIR__ . '/../backend/api/get-route-details.php');
$data = json_decode($routeDetailsOutput, true);

if (isset($data['id']) && isset($data['path']) && is_array($data['path'])) {
    echo "[PASS] Route details returned correctly.\n";
    echo "       Route Name: " . $data['name'] . "\n";
    echo "       Path Points: " . count($data['path']) . "\n";
// echo "       First Point: " . json_encode($data['path'][0]) . "\n";
}
else {
    echo "[FAIL] Unexpected response structure:\n";
    print_r($data);
    echo "\nRaw Output: " . substr($routeDetailsOutput, 0, 100) . "...\n";
}

echo "\n---------------------------------------------------\n\n";

// 2. Test get-live-buses.php
echo "2. Testing get-live-buses.php\n";

$_SERVER['REQUEST_METHOD'] = 'GET';
unset($_GET['route_id']);

$liveBusesOutput = capture_output(__DIR__ . '/../backend/api/get-live-buses.php');
$data = json_decode($liveBusesOutput, true);

if (is_array($data) && count($data) > 0) {
    echo "[PASS] Live buses returned correctly.\n";
    echo "       Total Buses: " . count($data) . "\n";
    $firstBus = $data[0];
    echo "       First Bus ID: " . $firstBus['id'] . "\n";
    echo "       Route ID: " . $firstBus['routeId'] . "\n";
    echo "       Progress: " . number_format($firstBus['progress'] * 100, 1) . "%\n";
}
else {
    echo "[FAIL] No buses returned or invalid format.\n";
    print_r($data);
    echo "\nRaw Output: " . substr($liveBusesOutput, 0, 100) . "...\n";
}

echo "\nDone.\n";
