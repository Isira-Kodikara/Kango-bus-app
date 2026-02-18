<?php

require_once __DIR__ . '/../includes/Database.php';

// header('Content-Type: application/json'); // Already handled by config/Database if needed, but let's be safe
if (!headers_sent()) {
    header('Content-Type: application/json');
}

$pdo = Database::getInstance()->getConnection();

try {
    // Fetch all distinct route paths
    // We want the coordinates for all routes to draw the "network"
    $query = "
        SELECT 
            r.id as route_id,
            r.route_number,
            rs.path_coordinates
        FROM routes r
        JOIN route_segments rs ON r.id = rs.route_id
        ORDER BY r.id, rs.sequence_order
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $segments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $servicePaths = [];

    foreach ($segments as $seg) {
        if (!empty($seg['path_coordinates'])) {
            $coords = json_decode($seg['path_coordinates'], true);
            if (is_array($coords)) {
                // Ensure format [lat, lng] for Leaflet
                // DB usually stores [lng, lat] (GeoJSON) or [lat, lng]. 
                // Let's assume standard [lat, lng] from previous usage or check format.
                // If previous code mapped coords, we should follow suit.
                // Checking RouteFinderService: it relies on `haversineDistance` which takes args. 
                // Let's assume the JSON in DB is [[lat,lng], [lat,lng]...] or similar.
                // If it's GeoJSON [[lng,lat]...], we need to flip.
                // Let's check a sample or consistent usage. 
                // In UserHome.tsx, we saw `routePath` being passed directly to Polyline.

                // For now, pass as is, frontend can flip if needed.
                // Actually, let's standardize to [lat, lng] if we can detect.

                $path = [];
                foreach ($coords as $c) {
                    // Simple heuristic: Lat is usually [-90, 90], Lng [-180, 180]
                    // Sri Lanka: Lat ~6-10, Lng ~79-82
                    if ($c[0] > 50) {
                        // First element is > 50, likely Longitude (79...) -> [lng, lat]
                        $path[] = [$c[1], $c[0]];
                    }
                    else {
                        // First element is < 50, likely Latitude (6...) -> [lat, lng]
                        $path[] = [$c[0], $c[1]];
                    }
                }

                if (!empty($path)) {
                    $servicePaths[] = $path;
                }
            }
        }
    }

    echo json_encode([
        'success' => true,
        'paths' => $servicePaths
    ]);

}
catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
