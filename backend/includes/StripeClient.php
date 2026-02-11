<?php

require_once __DIR__ . '/../vendor/autoload.php'; // Ensure Composer autoload is included

use Stripe\StripeClient;

class StripeClientWrapper
{
    private static $instance = null;

    private function __construct()
    {
    // Private constructor to prevent direct instantiation
    }

    public static function getClient()
    {
        if (self::$instance === null) {
            $apiKey = getenv('STRIPE_SECRET_KEY');
            if (!$apiKey) {
                // Fallback for local dev if getenv doesn't work directly (e.g. .env not loaded by PHP directly)
                // In production (Railway), this should be set in environment variables.
                // For this implementation, we assume environment variables are populated.
                throw new Exception('STRIPE_SECRET_KEY is not set in environment variables.');
            }
            self::$instance = new StripeClient($apiKey);
        }
        return self::$instance;
    }
}
