<?php
// Headers are handled in config.php
// header("Access-Control-Allow-Origin: *");
// header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
// header("Access-Control-Allow-Headers: Content-Type");
// if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") { exit(0); }

require_once __DIR__ . '/config/config.php';

if (file_exists(__DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH))) {
    return false;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';

if (strpos($requestUri, '?') !== false) {
    $requestUri = strstr($requestUri, '?', true);
}

$requestUri = rtrim($requestUri, '/');

if (empty($requestUri)) {
    $requestUri = '/';
}

error_log("Request URI: " . $requestUri);

switch (true) {
    case $requestUri === '/':
        echo json_encode(['success' => true, 'message' => 'KANGO API is running']);
        break;

    case preg_match('/^(\/api)?\/auth\/user/', $requestUri):
        require_once __DIR__ . '/api/auth/user.php';
        break;

    case preg_match('/^(\/api)?\/auth\/crew/', $requestUri):
        require_once __DIR__ . '/api/auth/crew.php';
        break;

    case preg_match('/^(\/api)?\/auth\/admin/', $requestUri):
        require_once __DIR__ . '/api/auth/admin.php';
        break;

    case preg_match('/^(\/api)?\/trip-guidance/', $requestUri):
        require_once __DIR__ . '/api/trip-guidance.php';
        break;

    default:
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Endpoint not found',
            'requested_uri' => $requestUri
        ]);
        break;
}
