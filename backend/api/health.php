<?php
/**
 * Health Check Endpoint
 * Monitors API and database status for production monitoring
 */

header('Content-Type: application/json');

$health = [
    'status' => 'healthy',
    'timestamp' => date('c'),
    'version' => API_VERSION ?? '1.0',
    'checks' => []
];

// Check Database Connection
try {
    require_once __DIR__ . '/../config/Database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        // Test query to verify database is responsive
        $stmt = $db->query("SELECT 1");
        $health['checks']['database'] = [
            'status' => 'healthy',
            'message' => 'Database connection successful'
        ];
    } else {
        throw new Exception('Database connection failed');
    }
} catch (Exception $e) {
    $health['status'] = 'unhealthy';
    $health['checks']['database'] = [
        'status' => 'unhealthy',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ];
}

// Check PHP Version
$health['checks']['php'] = [
    'status' => version_compare(PHP_VERSION, '8.0.0', '>=') ? 'healthy' : 'warning',
    'version' => PHP_VERSION,
    'message' => version_compare(PHP_VERSION, '8.0.0', '>=') 
        ? 'PHP version is supported' 
        : 'PHP version should be 8.0 or higher'
];

// Check Required Extensions
$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
$missingExtensions = [];

foreach ($requiredExtensions as $ext) {
    if (!extension_loaded($ext)) {
        $missingExtensions[] = $ext;
    }
}

$health['checks']['extensions'] = [
    'status' => empty($missingExtensions) ? 'healthy' : 'unhealthy',
    'message' => empty($missingExtensions) 
        ? 'All required extensions loaded' 
        : 'Missing extensions: ' . implode(', ', $missingExtensions),
    'required' => $requiredExtensions,
    'missing' => $missingExtensions
];

// Check Disk Space (if available)
if (function_exists('disk_free_space')) {
    $freeSpace = disk_free_space(__DIR__);
    $totalSpace = disk_total_space(__DIR__);
    $usedPercent = (($totalSpace - $freeSpace) / $totalSpace) * 100;
    
    $health['checks']['disk'] = [
        'status' => $usedPercent < 90 ? 'healthy' : 'warning',
        'free_space_mb' => round($freeSpace / 1024 / 1024, 2),
        'used_percent' => round($usedPercent, 2),
        'message' => $usedPercent < 90 
            ? 'Disk space is adequate' 
            : 'Disk space is running low'
    ];
}

// Check Environment Variables
$requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
$missingEnvVars = [];

foreach ($requiredEnvVars as $var) {
    if (!defined($var) || empty(constant($var))) {
        $missingEnvVars[] = $var;
    }
}

$health['checks']['environment'] = [
    'status' => empty($missingEnvVars) ? 'healthy' : 'unhealthy',
    'message' => empty($missingEnvVars) 
        ? 'All required environment variables are set' 
        : 'Missing environment variables: ' . implode(', ', $missingEnvVars),
    'missing' => $missingEnvVars
];

// Overall status determination
if ($health['status'] === 'healthy') {
    foreach ($health['checks'] as $check) {
        if ($check['status'] === 'unhealthy') {
            $health['status'] = 'unhealthy';
            break;
        }
    }
}

// Set HTTP status code based on health
http_response_code($health['status'] === 'healthy' ? 200 : 503);

echo json_encode($health, JSON_PRETTY_PRINT);
