<?php
/**
 * JWT Helper Class for Authentication
 */

require_once __DIR__ . '/../config/config.php';

class JWT {

    /**
     * Generate a JWT token
     */
    public static function generate(array $payload): string {
        $header = self::base64UrlEncode(json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'
        ]));

        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_EXPIRY;
        $payload = self::base64UrlEncode(json_encode($payload));

        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
        );

        return "$header.$payload.$signature";
    }

    /**
     * Verify and decode a JWT token
     */
    public static function verify(string $token): ?array {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;

        // Verify signature
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
        );

        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        // Decode payload
        $decodedPayload = json_decode(self::base64UrlDecode($payload), true);

        // Check expiration
        if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
            return null;
        }

        return $decodedPayload;
    }

    /**
     * Get token from Authorization header
     */
    public static function getTokenFromHeader(): ?string {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Authenticate request and return user data
     */
    public static function authenticate(): ?array {
        $token = self::getTokenFromHeader();

        if (!$token) {
            return null;
        }

        return self::verify($token);
    }

    /**
     * Require authentication - exits if not authenticated
     */
    public static function requireAuth(): array {
        $user = self::authenticate();

        if (!$user) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Unauthorized: Invalid or expired token'
            ]);
            exit();
        }

        return $user;
    }

    /**
     * Base64 URL-safe encode
     */
    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL-safe decode
     */
    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
