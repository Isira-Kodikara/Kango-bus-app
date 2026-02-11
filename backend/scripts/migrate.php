<?php
/**
 * Simple PHP Migration Script
 * Usage: php backend/scripts/migrate.php [fresh|seed]
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/Database.php';

class Migrator {
    private $db;
    private $pdo;

    public function __construct() {
        // Use Singleton pattern as defined in Database.php
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function run($args) {
        $fresh = in_array('fresh', $args);
        $seed = in_array('seed', $args);

        echo "🚀 Starting Database Migration...\n";

        if ($fresh) {
            echo "⚠️  Dropping all tables...\n";
            $this->dropAllTables();
        }

        echo "📦 Importing Master Schema...\n";
        $schemaPath = __DIR__ . '/../../database/schema/schema_master.sql';
        
        if (!file_exists($schemaPath)) {
            die("❌ Error: Schema file not found at $schemaPath\n");
        }

        $sql = file_get_contents($schemaPath);
        
        try {
            // Split by semicolon mostly works, but prone to error if ; is inside strings.
            // A better way is executing the whole block if the driver permits, or simplistic splitting.
            // PDO can handle multiple statements if configured.
            
            $this->pdo->exec($sql);
            echo "✅ Schema imported successfully!\n";
        } catch (PDOException $e) {
            die("❌ Sync Error: " . $e->getMessage() . "\n");
        }

        if ($seed) {
            echo "🌱 Seeding data...\n";
            require_once __DIR__ . '/seed.php';
            $seeder = new Seeder($this->pdo);
            $seeder->run();
        }
        
        echo "✨ Migration Completed!\n";
    }

    private function dropAllTables() {
        $this->pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        $stmt = $this->pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($tables as $table) {
            if ($table == 'sys_config') continue; // Skip system tables if any
            $this->pdo->exec("DROP TABLE IF EXISTS `$table`");
            echo "   - Dropped $table\n";
        }
        $this->pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    }
}

// Run immediately if executed from CLI
if (php_sapi_name() === 'cli') {
    $migrator = new Migrator();
    $migrator->run($argv);
} else {
    echo "This script must be run from the command line.";
}
