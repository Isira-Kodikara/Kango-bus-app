<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once __DIR__ . '/../services/MapboxService.php';

// Hardcoded route data for Phase 1 (Simulating DB)
// This matches frontend/src/components/Map.tsx
$COLOMBO_ROUTES = [
    1 => [
        'id' => 1,
        'name' => 'Coastal Line',
        'stops' => [ // Fort -> Mount Lavinia
            ['lat' => 6.9344, 'lng' => 79.8428], // Fort
            ['lat' => 6.9366, 'lng' => 79.8500], // Pettah
            ['lat' => 6.9114, 'lng' => 79.8489], // Kollupitiya
            ['lat' => 6.8897, 'lng' => 79.8553], // Bambalapitiya
            ['lat' => 6.8747, 'lng' => 79.8594], // Wellawatte
            ['lat' => 6.8564, 'lng' => 79.8650], // Dehiwala
            ['lat' => 6.8390, 'lng' => 79.8660], // Mount Lavinia
        ]
    ],
    2 => [
        'id' => 2,
        'name' => 'City Circle',
        'stops' => [ // Fort -> Pettah -> Maradana -> Borella -> Town Hall -> Kollupitiya
            ['lat' => 6.9344, 'lng' => 79.8428],
            ['lat' => 6.9366, 'lng' => 79.8500],
            ['lat' => 6.9289, 'lng' => 79.8675], // Maradana
            ['lat' => 6.9147, 'lng' => 79.8778], // Borella
            ['lat' => 6.9167, 'lng' => 79.8636], // Town Hall
            ['lat' => 6.9114, 'lng' => 79.8489], // Kollupitiya
        ]
    ],
    3 => [
        'id' => 3,
        'name' => 'Southern Express',
        'stops' => [ // Fort -> Town Hall -> Borella -> Nugegoda -> Maharagama
            ['lat' => 6.9344, 'lng' => 79.8428],
            ['lat' => 6.9167, 'lng' => 79.8636],
            ['lat' => 6.9147, 'lng' => 79.8778],
            ['lat' => 6.8722, 'lng' => 79.8883], // Nugegoda
            ['lat' => 6.8481, 'lng' => 79.9267], // Maharagama
        ]
    ]
];

$routeId = isset($_GET['route_id']) ? intval($_GET['route_id']) : null;

if (!$routeId || !isset($COLOMBO_ROUTES[$routeId])) {
    http_response_code(404);
    echo json_encode(['message' => 'Route not found']);
    exit;
}

$route = $COLOMBO_ROUTES[$routeId];
$mapbox = new MapboxService();

// Try to get real geometry from Mapbox
$geometry = $mapbox->getDrivingRoute($route['stops']);

// Fallback to straight lines if Mapbox fails or key missing
if (!$geometry) {
    $geometry = array_map(function ($stop) {
        return [$stop['lng'], $stop['lat']];
    }, $route['stops']);
}

// Mapbox sends [lng, lat]. Frontend usually expects [lat, lng] for Polyline,
// but Leaflet needs [lat, lng]. We will return [lat, lng] for consistency with our previous API.
// Polyline in Leaflet: [lat, lng]
$path = array_map(function ($coord) {
    return [$coord[1], $coord[0]];
}, $geometry);

echo json_encode([
    'id' => $route['id'],
    'name' => $route['name'],
    'path' => $path
]);
