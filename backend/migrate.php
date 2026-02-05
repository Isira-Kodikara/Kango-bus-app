<?php
/**
 * Database Migration Script for Railway
 * Run this once to create all tables
 * DELETE THIS FILE AFTER RUNNING!
 */

require_once __DIR__ . '/config/config.php';

header('Content-Type: text/plain');

echo "=== KANGO Database Migration ===\n\n";

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    echo "✅ Connected to database: " . DB_NAME . " on " . DB_HOST . "\n\n";
    
    // Read and execute the SQL file
    $sqlFile = __DIR__ . '/../database/schema/tables-railway.sql';
    
    if (!file_exists($sqlFile)) {
        // Try alternate path
        $sqlFile = '/app/database/schema/tables-railway.sql';
    }
    
    if (!file_exists($sqlFile)) {
        die("❌ SQL file not found!\n");
    }
    
    $sql = file_get_contents($sqlFile);
    echo "📄 Loaded SQL file: " . basename($sqlFile) . "\n\n";
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $success = 0;
    $errors = 0;
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            // Extract table/index name for logging
            if (preg_match('/CREATE\s+TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i', $statement, $matches)) {
                echo "✅ Created table: {$matches[1]}\n";
            } elseif (preg_match('/CREATE\s+INDEX\s+(\w+)/i', $statement, $matches)) {
                echo "✅ Created index: {$matches[1]}\n";
            }
            $success++;
        } catch (PDOException $e) {
            // Ignore "already exists" errors
            if (strpos($e->getMessage(), 'already exists') !== false) {
                if (preg_match('/CREATE\s+TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i', $statement, $matches)) {
                    echo "⏭️  Table already exists: {$matches[1]}\n";
                } elseif (preg_match('/CREATE\s+INDEX\s+(\w+)/i', $statement, $matches)) {
                    echo "⏭️  Index already exists: {$matches[1]}\n";
                }
            } else {
                echo "❌ Error: " . $e->getMessage() . "\n";
                $errors++;
            }
        }
    }
    
    echo "\n=== Migration Complete ===\n";
    echo "Success: $success statements\n";
    echo "Errors: $errors\n";
    
    // Show tables
    echo "\n📋 Tables in database:\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        echo "   - $table\n";
    }
    
    echo "\n⚠️  DELETE THIS FILE (migrate.php) after running!\n";
    
} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
    echo "\nConnection details:\n";
    echo "Host: " . DB_HOST . "\n";
    echo "Port: " . DB_PORT . "\n";
    echo "Database: " . DB_NAME . "\n";
}
