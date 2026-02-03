<?php
/**
 * KANGO Smart Bus Navigation - Configuration File
 */

// Error reporting (disable in production)
$isProduction = getenv('RAILWAY_ENVIRONMENT') || getenv('PRODUCTION');
if ($isProduction) {
    error_reporting(0);
    ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Database Configuration - Use environment variables for Railway
// Railway provides: MYSQLHOST, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD, MYSQLPORT
define('DB_HOST', getenv('MYSQLHOST') ?: 'localhost');
define('DB_NAME', getenv('MYSQLDATABASE') ?: 'kango_bus');
define('DB_USER', getenv('MYSQLUSER') ?: 'root');
define('DB_PASS', getenv('MYSQLPASSWORD') ?: '');
define('DB_PORT', getenv('MYSQLPORT') ?: '3306');
define('DB_CHARSET', 'utf8mb4');

// JWT Configuration
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'kango_secret_key_change_in_production_2026');
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

// CORS Headers - Allow your Vercel frontend
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://kango-bus-app.vercel.app',
    'https://frontend-vert-mu-31.vercel.app' // Your current Vercel URL
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else if (!$isProduction) {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
