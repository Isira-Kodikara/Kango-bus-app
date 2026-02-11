<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require_once __DIR__ . '/../services/MapboxService.php';

// Mock Routes (Must match get-route-details.php)
$COLOMBO_ROUTES = [
    1 => [
        'id' => 1,
        'stops' => [
            ['lat' => 6.9344, 'lng' => 79.8428], ['lat' => 6.9366, 'lng' => 79.8500],
            ['lat' => 6.9114, 'lng' => 79.8489], ['lat' => 6.8897, 'lng' => 79.8553],
            ['lat' => 6.8747, 'lng' => 79.8594], ['lat' => 6.8564, 'lng' => 79.8650],
            ['lat' => 6.8390, 'lng' => 79.8660]
        ],
        'color' => '#3b82f6',
        'duration_mins' => 45 // One way trip time estimate
    ],
    2 => [
        'id' => 2,
        'stops' => [
            ['lat' => 6.9344, 'lng' => 79.8428], ['lat' => 6.9366, 'lng' => 79.8500],
            ['lat' => 6.9289, 'lng' => 79.8675], ['lat' => 6.9147, 'lng' => 79.8778],
            ['lat' => 6.9167, 'lng' => 79.8636], ['lat' => 6.9114, 'lng' => 79.8489]
        ],
        'color' => '#10b981',
        'duration_mins' => 40
    ],
    3 => [
        'id' => 3,
        'stops' => [
            ['lat' => 6.9344, 'lng' => 79.8428], ['lat' => 6.9167, 'lng' => 79.8636],
            ['lat' => 6.9147, 'lng' => 79.8778], ['lat' => 6.8722, 'lng' => 79.8883],
            ['lat' => 6.8481, 'lng' => 79.9267]
        ],
        'color' => '#f59e0b',
        'duration_mins' => 50
    ]
];

// Helper to interpolate position along a path
function interpolatePosition($path, $progress)
{
    if (empty($path))
        return null;

    // Total distance is 1.0 (100%)
    // Since we don't have exact distances for segments in this simple mock, 
    // we assume equal spacing between points returned by Mapbox (which is roughly true for detailed geometry).

    $pointCount = count($path);
    $targetIndexFloat = $progress * ($pointCount - 1);
    $index = floor($targetIndexFloat);
    $nextIndex = min($index + 1, $pointCount - 1);
    $fraction = $targetIndexFloat - $index;

    $p1 = $path[$index];
    $p2 = $path[$nextIndex];

    // Linear interpolation
    $lat = $p1[0] + ($p2[0] - $p1[0]) * $fraction;
    $lng = $p1[1] + ($p2[1] - $p1[1]) * $fraction;

    // Calculate heading
    $dy = $p2[0] - $p1[0];
    $dx = $p2[1] - $p1[1];
    $heading = rad2deg(atan2($dx, $dy)); // 0 is North
    if ($heading < 0)
        $heading += 360;

    return ['lat' => $lat, 'lng' => $lng, 'heading' => $heading];
}

$mapbox = new MapboxService();
$liveBuses = [];
$currentTime = time();


foreach ($COLOMBO_ROUTES as $route) {
    // Cache simplistic route path for performance (in memory for this script run)
    // In production, we would cache this in Redis or DB.
    // For now, allow lazy fetching or just interpolate between stops if Mapbox fails/slow
    // To keep this fast, let's just interpolate between the STOPS for the simulation
    // This ensures lines go "roughly" right, but for "lines on road" we need the full geometry.
    // Let's assume frontend draws the lines, and backend just calculates position "somewhere".
    // Actually, for "buses on the line", we need the exact path.

    // Let's perform a lightweight fetch or fallback
    // Note: Calling Mapbox for every bus poll is bad. 
    // Strategy: Frontend will animate buses. Backend just returns "ETA/Status".
    // BUT user asked for "buses circulating... shows all buses".
    // Let's generate 2 buses per route.

    for ($i = 0; $i < 2; $i++) {
        // Stagger buses: Bus 1 at 10%, Bus 2 at 60%
        // Add time component to make them move
        $loopTime = $route['duration_mins'] * 60; // seconds
        $offset = ($i * 0.5) * $loopTime;
        $timeProgress = ($currentTime + $offset) % $loopTime;
        $progress = $timeProgress / $loopTime; // 0.0 to 1.0

        // Direction: 0.0->1.0 (Outbound), then flip for Inbound?
        // Simplification: Buses teleport back to start. 0->1 loop.

        // Calculate position based on STOPS (Linear between stops)
        // This won't perfectly match the road curve unless we have the full path.
        // But getting full path every time is slow.
        // Let's interpolate between stops. The marker will be "on the straight line between stops".
        $stops = $route['stops'];
        // Re-format stops to [lat, lng] array
        $path = array_map(function ($s) {
            return [$s['lat'], $s['lng']]; }, $stops);

        $pos = interpolatePosition($path, $progress);

        if ($pos) {
            $liveBuses[] = [
                'plate_number' => "NB-" . (1000 + $route['id'] * 100 + $i),
                'route_id' => $route['id'],
                'latitude' => $pos['lat'],
                'longitude' => $pos['lng'],
                'heading' => $pos['heading'],
                'passengers' => rand(10, 50),
                'capacity' => 60,
                'progress' => $progress
            ];
        }
    }
}

echo json_encode([
    'success' => true,
    'buses' => $liveBuses
]);
