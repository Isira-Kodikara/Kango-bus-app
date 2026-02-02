<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") { exit(0); }
/**
 * KANGO Smart Bus Navigation - API Entry Point
 * This file handles CORS and routes requests to the appropriate handlers
 */

// Load configuration
require_once __DIR__ . '/config/config.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Get the request URI and parse it
// For PHP built-in server, we need to handle the URI differently
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';

// Remove query string if present
if (strpos($requestUri, '?') !== false) {
    $requestUri = strstr($requestUri, '?', true);
}

$requestUri = rtrim($requestUri, '/');

// If empty after trimming, set to root
if (empty($requestUri)) {
    $requestUri = '/';
}

// Debug logging (remove in production)
error_log("Request URI: " . $requestUri);

// Route the request
switch (true) {
    case $requestUri === '/':
        echo json_encode(['success' => true, 'message' => 'KANGO API is running']);
        break;

    case preg_match('/^\/auth\/user/', $requestUri):
        require_once __DIR__ . '/api/auth/user.php';
        break;

    case preg_match('/^\/auth\/crew/', $requestUri):
        require_once __DIR__ . '/api/auth/crew.php';
        break;

    case preg_match('/^\/auth\/admin/', $requestUri):
        require_once __DIR__ . '/api/auth/admin.php';
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
