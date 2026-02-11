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

    // 2. Create Route Segments Table
    $output[] = "Creating route_segments table...";
    $pdo->exec("CREATE TABLE IF NOT EXISTS route_segments (
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
