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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method Not Allowed', 405);
}

// Authenticate
$user = JWT::authenticate();
if (!$user) {
    Response::error('Unauthorized', 401);
}

$userId = $user['user_id'] ?? $user['id'];
$userEmail = $user['email'];
$db = Database::getInstance()->getConnection();

try {
    $stripe = StripeClientWrapper::getClient();

    // Check if user has a Stripe Customer ID
    $stmt = $db->prepare("SELECT stripe_customer_id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    $customerId = $user['stripe_customer_id'];

    // If not, create one
    if (empty($customerId)) {
        $customer = $stripe->customers->create([
            'email' => $userEmail,
            'metadata' => ['user_id' => $userId]
        ]);
        $customerId = $customer->id;

        // Save to DB
        $updateStmt = $db->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?");
        $updateStmt->execute([$customerId, $userId]);
    }

    // Create SetupIntent
    $setupIntent = $stripe->setupIntents->create([
        'customer' => $customerId,
        'payment_method_types' => ['card'],
    ]);

    Response::success([
        'client_secret' => $setupIntent->client_secret
    ]);

}
catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
