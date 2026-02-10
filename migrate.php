<?php
require_once 'backend/includes/Database.php';

try {
    $db = Database::getInstance()->getConnection();
    $sql = file_get_contents('database/schema/journey_rebuild.sql');
    
    // Split SQL by semicolons, but be careful with seeded data
    // A better way is to execute the whole block if using PDO with certain settings, 
    // but standard FETCH_MODE might not like multiple statements.
    
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $stmt) {
        if (!empty($stmt)) {
            $db->exec($stmt);
        }
    }
    
    echo json_encode(['success' => true, 'message' => 'Database tables created and seeded successfully.']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
