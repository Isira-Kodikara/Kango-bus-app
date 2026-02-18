<?php
/**
 * InputSanitizer Helper Class
 * Provides static methods to sanitize and validate input data.
 */

class InputSanitizer {
    
    /**
     * Sanitize a string input
     */
    public static function sanitizeString($input) {
        if ($input === null) return null;
        $input = trim($input);
        return htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    }

    /**
     * Sanitize an email address
     */
    public static function sanitizeEmail($email) {
        if ($email === null) return null;
        $email = trim($email);
        return filter_var($email, FILTER_SANITIZE_EMAIL);
    }

    /**
     * Validate an email address
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL);
    }

    /**
     * Sanitize an integer
     */
    public static function sanitizeInt($input) {
        if ($input === null) return null;
        return filter_var($input, FILTER_SANITIZE_NUMBER_INT);
    }

    /**
     * Sanitize a float
     */
    public static function sanitizeFloat($input) {
        if ($input === null) return null;
        return filter_var($input, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    }

    /**
     * Get JSON input from request body and decode it
     */
    public static function getJsonInput() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }
        
        return $data;
    }
}
