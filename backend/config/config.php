<?php
/**
 * KANGO Smart Bus Navigation - Configuration File
 */

// Load .env if it exists
if (file_exists(__DIR__ . '/../.env') && is_readable(__DIR__ . '/../.env')) {
    $lines = @file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines) {
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                putenv("{$name}={$value}");
            }
        }
    }
}

// Error reporting - Environment-based configuration
$isProduction = getenv('RAILWAY_ENVIRONMENT') || getenv('PRODUCTION') === 'true';
$debugMode = getenv('DEBUG_MODE') === 'true';

if ($isProduction && !$debugMode) {
    // Production: Log errors but don't display them
    error_reporting(E_ALL);
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    ini_set('log_errors', '1');
    ini_set('error_log', __DIR__ . '/../logs/php-errors.log');
} else {
    // Development: Show all errors
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    ini_set('log_errors', '1');
}


// Database Configuration - Support for DATABASE_URL or individual variables
$dbUrl = getenv('DATABASE_URL') ?: getenv('MYSQL_URL');

if ($dbUrl) {
    // Parse the URL (format: mysql://user:pass@host:port/dbname)
    $urlParts = parse_url($dbUrl);
    
    define('DB_HOST', $urlParts['host'] ?? 'localhost');
    define('DB_USER', $urlParts['user'] ?? 'root');
    define('DB_PASS', $urlParts['pass'] ?? '');
    define('DB_NAME', ltrim($urlParts['path'] ?? 'kango_bus', '/'));
    define('DB_PORT', $urlParts['port'] ?? '3306');
} else {
    // Fallback to individual variables (Railway provides these by default in production)
    define('DB_HOST', getenv('MYSQLHOST') ?: getenv('MYSQL_HOST') ?: '127.0.0.1');
    define('DB_NAME', getenv('MYSQLDATABASE') ?: getenv('MYSQL_DATABASE') ?: 'kango_bus');
    define('DB_USER', getenv('MYSQLUSER') ?: getenv('MYSQL_USER') ?: 'root');
    define('DB_PASS', getenv('MYSQLPASSWORD') ?: getenv('MYSQL_PASSWORD') ?: '');
    define('DB_PORT', getenv('MYSQLPORT') ?: getenv('MYSQL_PORT') ?: '3306');
}
define('DB_CHARSET', 'utf8mb4');

// JWT Configuration
// JWT Configuration
if (!getenv('JWT_SECRET')) {
    // In production, we must have a secret. In dev, we can warn or throw.
    // For security hardening, we will strictly require it.
    if (getenv('PRODUCTION') === 'true') {
        error_log('FATAL: JWT_SECRET environment variable is not set!');
        http_response_code(500);
        exit(json_encode(['error' => 'Server misconfiguration']));
    }
}
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'DEV_ONLY_SECRET_CHANGE_ME_IMMEDIATELY');
define('JWT_EXPIRY', 86400); // 24 hours in seconds

// OTP Configuration
define('OTP_EXPIRY_MINUTES', 10);
define('OTP_LENGTH', 6);

// API Configuration
define('API_VERSION', '1.0');
define('BASE_URL', getenv('RAILWAY_PUBLIC_DOMAIN')
    ? 'https://' . getenv('RAILWAY_PUBLIC_DOMAIN')
    : 'http://localhost/kango-backend');

// Fare Configuration
define('BASE_FARE', 2.50);
define('PER_KM_FARE', 0.50);
define('MIN_FARE', 2.50);
define('MAX_FARE', 20.00);

// Email Configuration (for OTP)
define('MAIL_HOST', getenv('MAIL_HOST') ?: 'smtp.gmail.com');
define('MAIL_PORT', getenv('MAIL_PORT') ?: 587);
define('MAIL_USERNAME', getenv('MAIL_USERNAME') ?: 'your-email@gmail.com');
define('MAIL_PASSWORD', getenv('MAIL_PASSWORD') ?: 'your-app-password');
define('MAIL_FROM', 'noreply@kango.com');
define('MAIL_FROM_NAME', 'KANGO Bus Navigation');

// Timezone
date_default_timezone_set('Asia/Colombo');

// Validate environment configuration
require_once __DIR__ . '/../includes/EnvironmentValidator.php';


// CORS Headers - Robust handling
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin) {
    // If an origin is provided, mirror it and allow credentials
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}
else {
    // If no origin (e.g. direct API call), allow anything but NO credentials
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight requests
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Initialize graceful shutdown handler
require_once __DIR__ . '/../includes/GracefulShutdown.php';

// Initialize request logger
require_once __DIR__ . '/../includes/RequestLogger.php';

// Initialize input sanitizer
require_once __DIR__ . '/../includes/InputSanitizer.php';
