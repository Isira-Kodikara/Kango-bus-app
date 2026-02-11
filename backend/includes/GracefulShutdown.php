<?php
/**
 * Graceful Shutdown Handler
 * Ensures proper cleanup and logging during server shutdown
 */

class GracefulShutdown {
    private static $instance = null;
    private $shutdownHandlers = [];
    private $isShuttingDown = false;

    private function __construct() {
        // Register shutdown function
        register_shutdown_function([$this, 'handleShutdown']);
        
        // Register signal handlers for graceful shutdown (if available)
        if (function_exists('pcntl_signal')) {
            pcntl_signal(SIGTERM, [$this, 'handleSignal']);
            pcntl_signal(SIGINT, [$this, 'handleSignal']);
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Register a shutdown handler
     * @param callable $handler Function to call during shutdown
     * @param string $name Optional name for the handler
     */
    public function registerHandler(callable $handler, string $name = '') {
        $this->shutdownHandlers[] = [
            'handler' => $handler,
            'name' => $name ?: 'handler_' . count($this->shutdownHandlers)
        ];
    }

    /**
     * Handle shutdown signals
     */
    public function handleSignal($signal) {
        $this->isShuttingDown = true;
        error_log("KANGO API: Received shutdown signal: $signal");
        $this->executeHandlers();
        exit(0);
    }

    /**
     * Handle PHP shutdown
     */
    public function handleShutdown() {
        if ($this->isShuttingDown) {
            return; // Already handled by signal
        }

        $error = error_get_last();
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
            error_log("KANGO API: Fatal error during shutdown: " . json_encode($error));
        }

        $this->executeHandlers();
    }

    /**
     * Execute all registered shutdown handlers
     */
    private function executeHandlers() {
        foreach ($this->shutdownHandlers as $handler) {
            try {
                error_log("KANGO API: Executing shutdown handler: {$handler['name']}");
                call_user_func($handler['handler']);
            } catch (Exception $e) {
                error_log("KANGO API: Error in shutdown handler {$handler['name']}: " . $e->getMessage());
            }
        }
    }

    /**
     * Check if system is shutting down
     */
    public function isShuttingDown(): bool {
        return $this->isShuttingDown;
    }
}

// Initialize graceful shutdown
$shutdown = GracefulShutdown::getInstance();

// Register database cleanup handler
$shutdown->registerHandler(function() {
    error_log("KANGO API: Closing database connections...");
    // Database connections will be closed automatically by PDO destructor
}, 'database_cleanup');

// Register session cleanup handler
$shutdown->registerHandler(function() {
    error_log("KANGO API: Cleaning up sessions...");
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
}, 'session_cleanup');

// Register log flush handler
$shutdown->registerHandler(function() {
    error_log("KANGO API: Shutdown complete at " . date('Y-m-d H:i:s'));
}, 'log_flush');
