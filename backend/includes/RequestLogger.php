<?php
/**
 * Request Logger Middleware
 * Logs all API requests for monitoring and debugging
 */

class RequestLogger {
    private static $instance = null;
    private $logFile;
    private $startTime;
    private $requestId;

    private function __construct() {
        $this->startTime = microtime(true);
        $this->requestId = $this->generateRequestId();
        
        // Set log file path
        $logDir = __DIR__ . '/../logs';
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0755, true);
        }
        
        $this->logFile = $logDir . '/requests-' . date('Y-m-d') . '.log';
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Generate unique request ID
     */
    private function generateRequestId(): string {
        return uniqid('req_', true);
    }

    /**
     * Get request ID
     */
    public function getRequestId(): string {
        return $this->requestId;
    }

    /**
     * Log incoming request
     */
    public function logRequest() {
        $data = [
            'request_id' => $this->requestId,
            'timestamp' => date('Y-m-d H:i:s'),
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
            'uri' => $_SERVER['REQUEST_URI'] ?? '/',
            'ip' => $this->getClientIp(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'referer' => $_SERVER['HTTP_REFERER'] ?? null
        ];

        $this->writeLog('REQUEST', $data);
    }

    /**
     * Log response
     */
    public function logResponse(int $statusCode, $responseData = null) {
        $duration = round((microtime(true) - $this->startTime) * 1000, 2);
        
        $data = [
            'request_id' => $this->requestId,
            'timestamp' => date('Y-m-d H:i:s'),
            'status_code' => $statusCode,
            'duration_ms' => $duration,
            'memory_mb' => round(memory_get_peak_usage(true) / 1024 / 1024, 2)
        ];

        // Don't log full response data, just metadata
        if ($responseData !== null && is_array($responseData)) {
            $data['success'] = $responseData['success'] ?? null;
            if (isset($responseData['error'])) {
                $data['error'] = $responseData['error'];
            }
        }

        $this->writeLog('RESPONSE', $data);
    }

    /**
     * Log error
     */
    public function logError(string $message, $context = []) {
        $data = [
            'request_id' => $this->requestId,
            'timestamp' => date('Y-m-d H:i:s'),
            'message' => $message,
            'context' => $context
        ];

        $this->writeLog('ERROR', $data);
    }

    /**
     * Write log entry
     */
    private function writeLog(string $type, array $data) {
        $logEntry = sprintf(
            "[%s] [%s] %s\n",
            $type,
            date('Y-m-d H:i:s'),
            json_encode($data, JSON_UNESCAPED_SLASHES)
        );

        @file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }

    /**
     * Get client IP address
     */
    private function getClientIp(): string {
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',  // Proxy
            'HTTP_X_REAL_IP',        // Nginx
            'REMOTE_ADDR'            // Direct
        ];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                // Handle comma-separated IPs (proxies)
                if (strpos($ip, ',') !== false) {
                    $ips = explode(',', $ip);
                    $ip = trim($ips[0]);
                }
                return $ip;
            }
        }

        return 'unknown';
    }

    /**
     * Clean old log files (keep last 30 days)
     */
    public static function cleanOldLogs() {
        $logDir = __DIR__ . '/../logs';
        if (!is_dir($logDir)) {
            return;
        }

        $files = glob($logDir . '/requests-*.log');
        $cutoffTime = strtotime('-30 days');

        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                @unlink($file);
            }
        }
    }
}

// Initialize request logger
$logger = RequestLogger::getInstance();
$logger->logRequest();

// Register shutdown handler to log response
register_shutdown_function(function() use ($logger) {
    $statusCode = http_response_code();
    $logger->logResponse($statusCode);
});

// Clean old logs occasionally (1% chance)
if (rand(1, 100) === 1) {
    RequestLogger::cleanOldLogs();
}
