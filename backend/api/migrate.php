<?php
/**
 * Database Migration Endpoint
 * Use this to update the database schema on the live server.
 */
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/Database.php';

try {
    $pdo = Database::getInstance()->getConnection();
    $output = [];
    
    $output[] = "Starting migration...";

    // 1. Add Tracking and Metadata Columns
    $output[] = "Checking routes and stops schema...";
    
    // routes columns
    $routeColumns = [
        'osm_id' => "BIGINT UNIQUE",
        'start_point' => "VARCHAR(100)",
        'end_point' => "VARCHAR(100)",
        'total_stops' => "INT DEFAULT 0",
        'avg_time_minutes' => "INT DEFAULT 0",
        'frequency_minutes' => "INT DEFAULT 0",
        'color' => "VARCHAR(20) DEFAULT '#3b82f6'",
        'status' => "ENUM('active', 'inactive') DEFAULT 'active'",
        'updated_at' => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    ];

    foreach ($routeColumns as $col => $definition) {
        $check = $pdo->query("SHOW COLUMNS FROM routes LIKE '$col'")->fetch();
        if (!$check) {
            $pdo->exec("ALTER TABLE routes ADD COLUMN $col $definition");
            $output[] = " - Added $col to routes";
        }
    }

    // stops.osm_id
    $check = $pdo->query("SHOW COLUMNS FROM stops LIKE 'osm_id'")->fetch();
    if (!$check) {
        $pdo->exec("ALTER TABLE stops ADD COLUMN osm_id BIGINT UNIQUE");
        $output[] = " - Added osm_id to stops";
    }

    // user table maintenance
    $output[] = "Cleaning up users table...";
    $legacyUserCols = ['username', 'code', 'nic'];
    foreach ($legacyUserCols as $lcol) {
        $check = $pdo->query("SHOW COLUMNS FROM users LIKE '$lcol'")->fetch();
        if ($check) {
            try {
                $pdo->exec("ALTER TABLE users DROP COLUMN $lcol");
                $output[] = " - Successfully dropped legacy column '$lcol' from users";
            } catch (Exception $e) {
                $output[] = " - Failed to drop '$lcol': " . $e->getMessage();
            }
        }
    }

    $userCols = [
        'status' => "ENUM('pending', 'verified', 'suspended') DEFAULT 'verified'",
        'phone' => "VARCHAR(20)",
        'full_name' => "VARCHAR(100)",
        'email' => "VARCHAR(100) UNIQUE",
        'password' => "VARCHAR(255)"
    ];
    foreach ($userCols as $col => $def) {
        $check = $pdo->query("SHOW COLUMNS FROM users LIKE '$col'")->fetch();
        if (!$check) {
            // Check for legacy names
            if ($col === 'full_name') {
                $checkLegacy = $pdo->query("SHOW COLUMNS FROM users LIKE 'name'")->fetch();
                if ($checkLegacy) {
                    $pdo->exec("ALTER TABLE users CHANGE name full_name VARCHAR(100)");
                    $output[] = " - Renamed 'name' to 'full_name' in users";
                    continue;
                }
            }
            if ($col === 'phone') {
                $checkLegacy = $pdo->query("SHOW COLUMNS FROM users LIKE 'phone_number'")->fetch();
                if ($checkLegacy) {
                    $pdo->exec("ALTER TABLE users CHANGE phone_number phone VARCHAR(20)");
                    $output[] = " - Renamed 'phone_number' to 'phone' in users";
                    continue;
                }
            }
            
            $pdo->exec("ALTER TABLE users ADD COLUMN $col $def");
            $output[] = " - Added missing column '$col' to users";
        }
    }






    // 2. Create/Repair Route Segments Table
    $output[] = "Checking route_segments table...";
    
    // Check if column exists
    $tableExists = $pdo->query("SHOW TABLES LIKE 'route_segments'")->fetch();
    $columnExists = false;
    if ($tableExists) {
        $columnExists = $pdo->query("SHOW COLUMNS FROM route_segments LIKE 'segment_id'")->fetch();
    }

    if (!$columnExists) {
        $output[] = " - segment_id missing or table not found. Force recreating route_segments...";
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        $pdo->exec("DROP TABLE IF EXISTS route_segments");
        $pdo->exec("CREATE TABLE route_segments (
            segment_id INT PRIMARY KEY AUTO_INCREMENT,
            route_id INT NOT NULL,
            from_stop_id INT NOT NULL,
            to_stop_id INT NOT NULL,
            distance_km DECIMAL(10,2) NOT NULL,
            default_speed_kmh DECIMAL(5,1) NOT NULL DEFAULT 15.0,
            road_type ENUM('urban_arterial', 'residential', 'highway', 'congested') DEFAULT 'urban_arterial',
            sequence_order INT NOT NULL,
            FOREIGN KEY (route_id) REFERENCES routes(id),
            FOREIGN KEY (from_stop_id) REFERENCES stops(id),
            FOREIGN KEY (to_stop_id) REFERENCES stops(id),
            INDEX idx_route (route_id, sequence_order)
        )");
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        $output[] = " - route_segments table recreated successfully.";
    } else {
        $output[] = " - route_segments schema is already correct.";
    }


    // 3. Create Journey Plans Table
    $output[] = "Creating journey_plans table...";
    $pdo->exec("CREATE TABLE IF NOT EXISTS journey_plans (
        plan_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        origin_lat DECIMAL(10,8) NOT NULL,
        origin_lng DECIMAL(11,8) NOT NULL,
        destination_lat DECIMAL(10,8) NOT NULL,
        destination_lng DECIMAL(11,8) NOT NULL,
        selected_route_id INT,
        boarding_stop_id INT,
        alighting_stop_id INT,
        walking_distance_meters INT,
        walking_time_seconds INT,
        bus_travel_time_seconds INT,
        total_journey_time_seconds INT,
        can_catch_next_bus BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_user (user_id),
        INDEX idx_created (created_at)
    )");

    // 4. Create Route Stops Table
    $output[] = "Creating route_stops table...";
    $pdo->exec("CREATE TABLE IF NOT EXISTS route_stops (
        route_id INT NOT NULL,
        stop_id INT NOT NULL,
        stop_order INT NOT NULL,
        PRIMARY KEY (route_id, stop_id),
        FOREIGN KEY (route_id) REFERENCES routes(id),
        FOREIGN KEY (stop_id) REFERENCES stops(id),
        INDEX idx_stop_order (route_id, stop_order)
    )");

    // 5. Create Buses and Trips Tables
    $output[] = "Creating buses and trips tables...";
    $pdo->exec("CREATE TABLE IF NOT EXISTS buses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        plate_number VARCHAR(20) UNIQUE NOT NULL,
        route_id INT,
        capacity INT DEFAULT 60,
        status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (route_id) REFERENCES routes(id)
    )");

    // Repair buses table if columns are missing or named differently
    $output[] = "Repairing buses table...";
    $checkBusPlate = $pdo->query("SHOW COLUMNS FROM buses LIKE 'plate_number'")->fetch();

    if (!$checkBusPlate) {
        $checkBusCode = $pdo->query("SHOW COLUMNS FROM buses LIKE 'code'")->fetch();
        $checkBusNum = $pdo->query("SHOW COLUMNS FROM buses LIKE 'bus_number'")->fetch();
        
        if ($checkBusCode) {
            $pdo->exec("ALTER TABLE buses CHANGE code plate_number VARCHAR(20) UNIQUE NOT NULL");
            $output[] = " - Renamed 'code' to 'plate_number' in buses";
        } elseif ($checkBusNum) {
            $pdo->exec("ALTER TABLE buses CHANGE bus_number plate_number VARCHAR(20) UNIQUE NOT NULL");
            $output[] = " - Renamed 'bus_number' to 'plate_number' in buses";
        } else {
            $pdo->exec("ALTER TABLE buses ADD COLUMN plate_number VARCHAR(20) UNIQUE NOT NULL AFTER id");
            $output[] = " - Added 'plate_number' to buses";
        }
    } else {
        // plate_number exists, but check for legacy columns that might block inserts
        $checkBusCode = $pdo->query("SHOW COLUMNS FROM buses LIKE 'code'")->fetch();
        $checkBusNum = $pdo->query("SHOW COLUMNS FROM buses LIKE 'bus_number'")->fetch();
        if ($checkBusCode) {
            $pdo->exec("ALTER TABLE buses DROP COLUMN code");
            $output[] = " - Dropped legacy column 'code' from buses";
        }
        if ($checkBusNum) {
            $pdo->exec("ALTER TABLE buses DROP COLUMN bus_number");
            $output[] = " - Dropped legacy column 'bus_number' from buses";
        }
    }

    // Check for status in buses
    $checkBusStatus = $pdo->query("SHOW COLUMNS FROM buses LIKE 'status'")->fetch();
    if (!$checkBusStatus) {
        $pdo->exec("ALTER TABLE buses ADD COLUMN status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active'");
        $output[] = " - Added status to buses";
    }

    // Check for is_active, stop_code, and address in stops
    $stopCols = [
        'is_active' => "BOOLEAN DEFAULT TRUE",
        'stop_code' => "VARCHAR(20)",
        'address' => "TEXT"
    ];
    foreach ($stopCols as $col => $def) {
        $check = $pdo->query("SHOW COLUMNS FROM stops LIKE '$col'")->fetch();
        if (!$check) {
            $pdo->exec("ALTER TABLE stops ADD COLUMN $col $def");
            $output[] = " - Added $col to stops";
        }
    }





    $checkBusRoute = $pdo->query("SHOW COLUMNS FROM buses LIKE 'route_id'")->fetch();
    if (!$checkBusRoute) {
        $pdo->exec("ALTER TABLE buses ADD COLUMN route_id INT, ADD FOREIGN KEY (route_id) REFERENCES routes(id)");
        $output[] = " - Added route_id to buses";
    }



    $pdo->exec("CREATE TABLE IF NOT EXISTS trips (
        trip_id INT PRIMARY KEY AUTO_INCREMENT,
        bus_id INT NOT NULL,
        route_id INT NOT NULL,
        current_stop_id INT,
        status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP NULL,
        FOREIGN KEY (bus_id) REFERENCES buses(id),
        FOREIGN KEY (route_id) REFERENCES routes(id),
        FOREIGN KEY (current_stop_id) REFERENCES stops(id)
    )");

    // 6. Create Additional Support Tables
    $output[] = "Creating support tables (analytics, emergency, etc.)...";
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS analytics (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_type VARCHAR(50),
        event_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        name VARCHAR(100),
        phone_number VARCHAR(20),
        relationship VARCHAR(50),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )");

    // Repair emergency_contacts if needed
    $checkEC = $pdo->query("SHOW COLUMNS FROM emergency_contacts LIKE 'phone_number'")->fetch();
    if (!$checkEC) {
        $checkECPhone = $pdo->query("SHOW COLUMNS FROM emergency_contacts LIKE 'phone'")->fetch();
        if ($checkECPhone) {
            $pdo->exec("ALTER TABLE emergency_contacts CHANGE phone phone_number VARCHAR(20)");
            $output[] = " - Renamed 'phone' to 'phone_number' in emergency_contacts";
        } else {
            $pdo->exec("ALTER TABLE emergency_contacts ADD COLUMN phone_number VARCHAR(20)");
            $output[] = " - Added 'phone_number' to emergency_contacts";
        }
    }


    $pdo->exec("CREATE TABLE IF NOT EXISTS emergency_alerts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        trip_id INT,
        type VARCHAR(50),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        status ENUM('active', 'resolved') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (trip_id) REFERENCES trips(trip_id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        amount DECIMAL(10,2),
        status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS saved_locations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        label VARCHAR(50),
        address TEXT,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS wait_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        stop_id INT,
        route_id INT,
        status ENUM('pending', 'picked_up', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (stop_id) REFERENCES stops(id),
        FOREIGN KEY (route_id) REFERENCES routes(id)
    )");



    echo json_encode([
        'success' => true,
        'message' => 'Migration completed successfully',
        'log' => $output
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
