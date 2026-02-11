<?php

require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/../../includes/Database.php';
require_once __DIR__ . '/../../includes/JWT.php';
require_once __DIR__ . '/../../includes/StripeClient.php';

// Handle CORS/Options
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['message' => 'OK']);
    exit;
}

// Authenticate
$user = JWT::authenticate();
if (!$user) {
    Response::error('Unauthorized', 401);
}

$userId = $user['user_id'] ?? $user['id'];
$db = Database::getInstance()->getConnection();

try {
    // Check DB for payment method
    $stmt = $db->prepare("SELECT stripe_customer_id, default_payment_method_id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['default_payment_method_id'])) {
        Response::success([
            'has_payment_method' => false,
            'card' => null
        ]);
    }

    // Retrieve details from Stripe
    $stripe = StripeClientWrapper::getClient();
    $paymentMethod = $stripe->paymentMethods->retrieve($user['default_payment_method_id']);

    Response::success([
        'has_payment_method' => true,
        'card' => [
            'brand' => $paymentMethod->card->brand,
            'last4' => $paymentMethod->card->last4,
            'exp_month' => $paymentMethod->card->exp_month,
            'exp_year' => $paymentMethod->card->exp_year
        ]
    ]);

}
catch (Exception $e) {
    // If Stripe fails (e.g. invalid PM), fallback to no payment method
    Response::success([
        'has_payment_method' => false,
        'error' => $e->getMessage()
    ]);
}
