<?php
require_once __DIR__ . '/../includes/Database.php';

$pdo = Database::getInstance()->getConnection();

try {
    echo "Starting migration...\n";

    // Add OSM tracking columns to existing tables
    echo "Updating routes and bus_stops tables...\n";
    
    // Check and add osm_id to routes
    $checkRoutes = $pdo->query("SHOW COLUMNS FROM routes LIKE 'osm_id'")->fetch();
    if (!$checkRoutes) {
        $pdo->exec("ALTER TABLE routes ADD COLUMN osm_id BIGINT UNIQUE");
    }

    // Check and add osm_id to stops
    $checkStops = $pdo->query("SHOW COLUMNS FROM stops LIKE 'osm_id'")->fetch();
    if (!$checkStops) {
        $pdo->exec("ALTER TABLE stops ADD COLUMN osm_id BIGINT UNIQUE");
    }

    // Route segments table
    echo "Creating route_segments table...\n";
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

    // Journey plans table
    echo "Creating journey_plans table...\n";
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

    // Route stops table (needed for sequencing)
    echo "Creating route_stops table...\n";
    $pdo->exec("CREATE TABLE IF NOT EXISTS route_stops (
        route_id INT NOT NULL,
        stop_id INT NOT NULL,
        stop_order INT NOT NULL,
        PRIMARY KEY (route_id, stop_id),
        FOREIGN KEY (route_id) REFERENCES routes(id),
        FOREIGN KEY (stop_id) REFERENCES stops(id),
        INDEX idx_stop_order (route_id, stop_order)
    )");

    // Seed Route Segments Data - Check if route_stops exists
    echo "Seeding route_segments data...\n";
    $routeStopsExists = $pdo->query("SHOW TABLES LIKE 'route_stops'")->fetch();
    if ($routeStopsExists) {
        // Handle stop_order vs stop_sequence
        $checkCol = $pdo->query("SHOW COLUMNS FROM route_stops LIKE 'stop_order'")->fetch();
        $colName = $checkCol ? 'stop_order' : 'stop_sequence';

        $pdo->exec("INSERT INTO route_segments (route_id, from_stop_id, to_stop_id, distance_km, default_speed_kmh, road_type, sequence_order)
            SELECT 
                rs.route_id,
                rs.stop_id AS from_stop_id,
                rs_next.stop_id AS to_stop_id,
                ROUND(1.4 * 6371 * ACOS(
                    LEAST(1.0, GREATEST(-1.0,
                        COS(RADIANS(bs1.latitude)) * COS(RADIANS(bs2.latitude)) *
                        COS(RADIANS(bs2.longitude) - RADIANS(bs1.longitude)) +
                        SIN(RADIANS(bs1.latitude)) * SIN(RADIANS(bs2.latitude))
                    ))
                ), 2) AS distance_km,
                15.0 AS default_speed_kmh,
                'urban_arterial' AS road_type,
                rs.$colName AS sequence_order
            FROM route_stops rs
            JOIN route_stops rs_next ON rs.route_id = rs_next.route_id 
                AND rs_next.$colName = rs.$colName + 1
            JOIN stops bs1 ON rs.stop_id = bs1.id
            JOIN stops bs2 ON rs_next.stop_id = bs2.id
            ON DUPLICATE KEY UPDATE distance_km = VALUES(distance_km)");
    } else {
        echo " - Skipping seed: route_stops table not found. Use seed_colombo.php or sync-osm-routes.php instead.\n";
    }

    echo "Migration completed successfully!\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
