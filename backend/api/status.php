<?php
/**
 * Simple Status Endpoint
 * Lightweight endpoint for basic uptime monitoring
 */

header('Content-Type: application/json');

echo json_encode([
    'success' => true,
    'status' => 'online',
    'message' => 'KANGO API is running',
    'timestamp' => date('c'),
    'uptime' => function_exists('sys_getloadavg') ? sys_getloadavg()[0] : null
], JSON_PRETTY_PRINT);

http_response_code(200);
