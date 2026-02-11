<?php

require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/../../includes/JWT.php';
require_once __DIR__ . '/../../includes/PaymentGuard.php';

// Handle CORS/Options
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['message' => 'OK']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method Not Allowed', 405);
}

// Authenticate
$user = JWT::authenticate();
if (!$user) {
    Response::error('Unauthorized', 401);
}

$userId = $user['user_id'] ?? $user['id'];

// Gate access
PaymentGuard::enforcePaymentMethod($userId);

// Mock Charge Logic
// In reliable app, we would create a PaymentIntent here using $user['stripe_customer_id'] and $user['default_payment_method_id']

Response::success([
    'receipt_url' => 'https://example.com/receipt/mock-12345',
    'amount' => 500,
    'currency' => 'usd'
], 'Test charge successful! Access granted.');
