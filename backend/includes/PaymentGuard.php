<?php

require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/StripeClient.php';

class PaymentGuard
{
    /**
     * Check if the user has a valid default payment method.
     * Throws an error response if not.
     * 
     * @param int $userId
     * @return bool
     */
    public static function enforcePaymentMethod($userId)
    {
        $db = Database::getInstance()->getConnection();

        // 1. Check local database first for speed
        $stmt = $db->prepare("SELECT default_payment_method_id, stripe_customer_id FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || empty($user['default_payment_method_id'])) {
            Response::error('Payment method not in place', 402, [
                'code' => 'NO_PAYMENT_METHOD',
                'action_required' => 'setup_payment_method'
            ]);
            return false; // Should not reach here due to Response::error exit
        }

        // Optional: Verify with Stripe if strict checking is needed (can be cached or skipped for performance)
        return true;
    }
}
