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
$db = Database::getInstance()->getConnection();
$stripe = StripeClientWrapper::getClient();

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['payment_method_id'])) {
    Response::error('Payment Method ID is required', 400);
}

try {
    // Get Customer ID
    $stmt = $db->prepare("SELECT stripe_customer_id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (empty($user['stripe_customer_id'])) {
        Response::error('Stripe Customer ID not found. Call setup-intent first.', 400);
    }

    $customerId = $user['stripe_customer_id'];
    $paymentMethodId = $data['payment_method_id']; /** @var string $paymentMethodId */

    // Attach PaymentMethod to Customer (if not already attached via SetupIntent)
    // Note: SetupIntent confirms it, but ensuring attachment is safe
    try {
        $stripe->paymentMethods->attach($paymentMethodId, ['customer' => $customerId]);
    }
    catch (\Stripe\Exception\InvalidRequestException $e) {
    // Ignore if already attached
    }

    // Set as Default Payment Method
    $stripe->customers->update($customerId, [
        'invoice_settings' => ['default_payment_method' => $paymentMethodId]
    ]);

    // Update DB
    $updateStmt = $db->prepare("UPDATE users SET default_payment_method_id = ? WHERE id = ?");
    $updateStmt->execute([$paymentMethodId, $userId]);

    Response::success(null, 'Payment method attached successfully');

}
catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
