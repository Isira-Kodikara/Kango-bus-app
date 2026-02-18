<?php
// Test script for full journey guidance
require_once __DIR__ . '/../backend/includes/Database.php';

// Mock environment
putenv('MAPBOX_ACCESS_TOKEN=pk.test');
putenv('OPENROUTE_API_KEY=test_key');

// Use a known location (Fort) and a known destination (Mount Lavinia)
$data = [
    'origin_lat' => 6.9344,
    'origin_lng' => 79.8428, // Fort
    'destination_lat' => 6.8390,
    'destination_lng' => 79.8660, // Mt Lavinia
    'user_id' => 1
];

$url = 'http://localhost:8000/api/trip-guidance.php';

$options = [
    'http' => [
        'header' => "Content-type: application/json\r\n",
        'method' => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true // To capture error responses
    ]
];
$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo "HTTP Code: " . $http_response_header[0] . "\n";
$response = $result;
$json = json_decode($response, true);

if ($json) {
    echo "Success: " . ($json['success'] ? 'YES' : 'NO') . "\n";
    echo "Walking Path To Stop: " . (isset($json['walking_path_to_stop']) ? 'YES' : 'NO') . "\n";
    echo "Walking Path From Stop: " . (isset($json['walking_path_from_stop']) ? 'YES' : 'NO') . "\n";

    if (isset($json['walking_path_from_stop']['coordinates'])) {
        echo "Walking Path From Stop Coords: " . count($json['walking_path_from_stop']['coordinates']) . "\n";
    }
}
else {
    echo "Raw Response: $response\n";
}
