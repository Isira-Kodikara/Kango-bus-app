<?php
/**
 * Environment Variable Validator
 * Validates required environment variables on application startup
 */

class EnvironmentValidator {
    private $errors = [];
    private $warnings = [];

    /**
     * Validate all required environment variables
     * @return bool True if all validations pass
     */
    public function validate(): bool {
        $this->validateDatabaseConfig();
        $this->validateJWTConfig();
        $this->validateSecurityConfig();
        $this->validateEmailConfig();
        
        return empty($this->errors);
    }

    /**
     * Validate database configuration
     */
    private function validateDatabaseConfig() {
        $this->requireEnv('DB_HOST', 'Database host is required');
        $this->requireEnv('DB_NAME', 'Database name is required');
        $this->requireEnv('DB_USER', 'Database user is required');
        
        // DB_PASS can be empty for local development
        if (!defined('DB_PASS')) {
            $this->addWarning('DB_PASS is not set - using empty password');
        }

        // Validate DB_PORT is numeric
        if (defined('DB_PORT') && !is_numeric(DB_PORT)) {
            $this->addError('DB_PORT must be a number');
        }
    }

    /**
     * Validate JWT configuration
     */
    private function validateJWTConfig() {
        $this->requireEnv('JWT_SECRET', 'JWT secret key is required');
        
        if (defined('JWT_SECRET')) {
            $secret = JWT_SECRET;
            
            // Check if using default/weak secret
            if (strlen($secret) < 32) {
                $this->addWarning('JWT_SECRET should be at least 32 characters long');
            }
            
            if (strpos($secret, 'change_in_production') !== false || 
                strpos($secret, 'your_') !== false ||
                $secret === 'secret' || 
                $secret === 'password') {
                $this->addError('JWT_SECRET is using a default/insecure value. Generate a secure key!');
            }
        }
    }

    /**
     * Validate security configuration
     */
    private function validateSecurityConfig() {
        $isProduction = getenv('RAILWAY_ENVIRONMENT') || getenv('PRODUCTION');
        
        if ($isProduction) {
            // Check if error display is disabled in production
            if (ini_get('display_errors') == '1') {
                $this->addWarning('display_errors should be disabled in production');
            }
            
            // Check if debug mode is disabled
            if (getenv('DEBUG_MODE') === 'true') {
                $this->addWarning('DEBUG_MODE should be disabled in production');
            }
        }
    }

    /**
     * Validate email configuration (optional)
     */
    private function validateEmailConfig() {
        // Email is optional, but if configured, validate it
        if (defined('MAIL_HOST') && MAIL_HOST !== 'smtp.gmail.com') {
            if (!defined('MAIL_USERNAME') || empty(MAIL_USERNAME)) {
                $this->addWarning('MAIL_USERNAME should be set when MAIL_HOST is configured');
            }
            if (!defined('MAIL_PASSWORD') || empty(MAIL_PASSWORD)) {
                $this->addWarning('MAIL_PASSWORD should be set when MAIL_HOST is configured');
            }
        }
    }

    /**
     * Require an environment variable to be defined
     */
    private function requireEnv(string $name, string $message) {
        if (!defined($name) || empty(constant($name))) {
            $this->addError($message . " ($name)");
        }
    }

    /**
     * Add an error
     */
    private function addError(string $message) {
        $this->errors[] = $message;
        error_log("KANGO ENV ERROR: $message");
    }

    /**
     * Add a warning
     */
    private function addWarning(string $message) {
        $this->warnings[] = $message;
        error_log("KANGO ENV WARNING: $message");
    }

    /**
     * Get all errors
     */
    public function getErrors(): array {
        return $this->errors;
    }

    /**
     * Get all warnings
     */
    public function getWarnings(): array {
        return $this->warnings;
    }

    /**
     * Get formatted error message
     */
    public function getErrorMessage(): string {
        if (empty($this->errors)) {
            return '';
        }

        $message = "Environment Configuration Errors:\n";
        foreach ($this->errors as $error) {
            $message .= "  - $error\n";
        }

        if (!empty($this->warnings)) {
            $message .= "\nWarnings:\n";
            foreach ($this->warnings as $warning) {
                $message .= "  - $warning\n";
            }
        }

        return $message;
    }
}

// Validate environment on load
$validator = new EnvironmentValidator();
if (!$validator->validate()) {
    $errorMessage = $validator->getErrorMessage();
    error_log($errorMessage);
    
    // In production, fail gracefully
    if (getenv('RAILWAY_ENVIRONMENT') || getenv('PRODUCTION')) {
        http_response_code(503);
        die(json_encode([
            'success' => false,
            'error' => 'Service configuration error. Please contact administrator.',
            'timestamp' => date('c')
        ]));
    } else {
        // In development, show detailed errors
        die($errorMessage);
    }
}

// Log warnings but continue
if (!empty($validator->getWarnings())) {
    error_log("Environment validation completed with warnings:\n" . implode("\n", $validator->getWarnings()));
}
