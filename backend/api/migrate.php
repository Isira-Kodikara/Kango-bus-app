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

    // 1. Add Tracking Columns
    $output[] = "Checking for OSM tracking columns...";
    
    // routes.osm_id
    $check = $pdo->query("SHOW COLUMNS FROM routes LIKE 'osm_id'")->fetch();
    if (!$check) {
        $pdo->exec("ALTER TABLE routes ADD COLUMN osm_id BIGINT UNIQUE");
        $output[] = " - Added osm_id to routes";
    }

    // stops.osm_id
    $check = $pdo->query("SHOW COLUMNS FROM stops LIKE 'osm_id'")->fetch();
    if (!$check) {
        $pdo->exec("ALTER TABLE stops ADD COLUMN osm_id BIGINT UNIQUE");
        $output[] = " - Added osm_id to stops";
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
        capacity INT DEFAULT 60,
        status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

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

    // Repair trips.trip_id if it was created as 'id'
    $check = $pdo->query("SHOW COLUMNS FROM trips LIKE 'trip_id'")->fetch();
    if (!$check) {
        $checkId = $pdo->query("SHOW COLUMNS FROM trips LIKE 'id'")->fetch();
        if ($checkId) {
            $pdo->exec("ALTER TABLE trips CHANGE id trip_id INT AUTO_INCREMENT");
            $output[] = " - Renamed 'id' to 'trip_id' in trips";
        }
    }


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
