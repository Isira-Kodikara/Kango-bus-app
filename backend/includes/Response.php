<?php
/**
 * Response Helper Class
 */

class Response {

    /**
     * Send a success response
     */
    public static function success($data = null, string $message = 'Success', int $code = 200): void {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
        exit();
    }

    /**
     * Send an error response
     */
    public static function error(string $message, int $code = 400, $errors = null): void {
        http_response_code($code);
        $response = [
            'success' => false,
            'error' => $message
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        echo json_encode($response);
        exit();
    }

    /**
     * Send a validation error response
     */
    public static function validationError(array $errors): void {
        // Convert errors array to a readable message
        $errorMessages = array_values($errors);
        $firstError = count($errorMessages) > 0 ? $errorMessages[0] : 'Please check your input';
        self::error($firstError, 422, $errorMessages);
    }

    /**
     * Send unauthorized response
     */
    public static function unauthorized(string $message = 'Unauthorized'): void {
        self::error($message, 401);
    }

    /**
     * Send forbidden response
     */
    public static function forbidden(string $message = 'Forbidden'): void {
        self::error($message, 403);
    }

    /**
     * Send not found response
     */
    public static function notFound(string $message = 'Resource not found'): void {
        self::error($message, 404);
    }

    /**
     * Send method not allowed response
     */
    public static function methodNotAllowed(): void {
        self::error('Method not allowed', 405);
    }
}
