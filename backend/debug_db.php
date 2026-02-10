<?php
header('Content-Type: application/json');
require_once __DIR__ . '/includes/Database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    $stops = $db->query("SELECT * FROM stops")->fetchAll(PDO::FETCH_ASSOC);
    $segments = $db->query("SELECT * FROM route_segments")->fetchAll(PDO::FETCH_ASSOC);
    $routes = $db->query("SELECT * FROM routes")->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'stops' => $stops,
            'segments' => $segments,
            'routes' => $routes
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
