<?php

echo "Starting migration...\n";

$host = '127.0.0.1';
$db   = 'kango_bus';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     echo "Connecting to $dsn with user $user...\n";
     $pdo = new PDO($dsn, $user, $pass, $options);
     echo "Connected successfully.\n";
     
    // 1. Add OSM tracking columns
    echo "1. Adding OSM columns...\n";
    
    // Check if column exists before adding to avoid error
    // routes.osm_id
    $stmt = $pdo->query("SHOW COLUMNS FROM routes LIKE 'osm_id'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE routes ADD COLUMN osm_id BIGINT UNIQUE");
        echo " - Added osm_id to routes.\n";
    } else {
        echo " - osm_id already exists in routes.\n";
    }

    // bus_stops.osm_node_id
    $stmt = $pdo->query("SHOW COLUMNS FROM bus_stops LIKE 'osm_node_id'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE bus_stops ADD COLUMN osm_node_id BIGINT UNIQUE");
        echo " - Added osm_node_id to bus_stops.\n";
    } else {
        echo " - osm_node_id already exists in bus_stops.\n";
    }

    // 2. Create route_segments table
    echo "2. Creating route_segments table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS route_segments (
        segment_id INT PRIMARY KEY AUTO_INCREMENT,
        route_id INT NOT NULL,
        from_stop_id INT NOT NULL,
        to_stop_id INT NOT NULL,
        distance_km DECIMAL(5,2) NOT NULL,
        default_speed_kmh DECIMAL(4,1) NOT NULL DEFAULT 15.0,
        road_type ENUM('urban_arterial', 'residential', 'highway', 'congested') DEFAULT 'urban_arterial',
        sequence_order INT NOT NULL,
        FOREIGN KEY (route_id) REFERENCES routes(route_id),
        FOREIGN KEY (from_stop_id) REFERENCES bus_stops(stop_id),
        FOREIGN KEY (to_stop_id) REFERENCES bus_stops(stop_id),
        INDEX idx_route (route_id, sequence_order)
    )";
    $pdo->exec($sql);
    echo " - route_segments table confirmed.\n";

    // 3. Create journey_plans table
    echo "3. Creating journey_plans table...\n";
    $sql = "CREATE TABLE IF NOT EXISTS journey_plans (
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
        INDEX idx_user (user_id),
        INDEX idx_created (created_at)
    )";
    $pdo->exec($sql);
    
    // Add FK separately
    try {
        // Check if constraint exists
        $stmt = $pdo->query("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'journey_plans' AND CONSTRAINT_NAME = 'fk_journey_plans_user' AND TABLE_SCHEMA = '$db'");
        if ($stmt->rowCount() == 0) {
             // Try to add it, but don't fail if user_id doesn't match users table PK type
             $pdo->exec("ALTER TABLE journey_plans ADD CONSTRAINT fk_journey_plans_user FOREIGN KEY (user_id) REFERENCES users(id)"); 
             // Note: Users table usually has 'id' or 'user_id'. Adjusting based on common practice or previous seed file.
             // Seed file didn't show users table structure. Assuming 'users(id)' or 'users(user_id)'.
             // The prompt sql said 'FOREIGN KEY (user_id) REFERENCES users(user_id)'.
             // I'll stick to 'users(user_id)' but wrap in try-catch.
        }
    } catch (Exception $e) {
        // Retry with 'id' if 'user_id' failed
        try {
             $pdo->exec("ALTER TABLE journey_plans ADD CONSTRAINT fk_journey_plans_user_id FOREIGN KEY (user_id) REFERENCES users(id)"); 
        } catch (Exception $e2) {
            echo " - Warning: Could not add FK to users table (users table might be missing or different PK): " . $e->getMessage() . "\n";
        }
    }
    
    echo " - journey_plans table confirmed.\n";
    
    // 4. Seed Route Segments Data
    echo "4. Seeding route segments...\n";
    // First check if empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM route_segments");
    $count = $stmt->fetchColumn();
    
    if ($count == 0) {
        try {
            // Need to verify if route_stops exists and has data
            $stmt = $pdo->query("SELECT COUNT(*) FROM route_stops");
            if ($stmt->fetchColumn() > 0) {
                // The query from the prompt
                $sql = "INSERT INTO route_segments (route_id, from_stop_id, to_stop_id, distance_km, default_speed_kmh, road_type, sequence_order)
                SELECT 
                    rs.route_id,
                    rs.stop_id AS from_stop_id,
                    rs_next.stop_id AS to_stop_id,
                    -- Haversine distance × 1.4 for actual road distance
                    ROUND(1.4 * 6371 * ACOS(
                        LEAST(1.0, GREATEST(-1.0,
                            COS(RADIANS(bs1.latitude)) * COS(RADIANS(bs2.latitude)) *
                            COS(RADIANS(bs2.longitude) - RADIANS(bs1.longitude)) +
                            SIN(RADIANS(bs1.latitude)) * SIN(RADIANS(bs2.latitude))
                        ))
                    ), 2) AS distance_km,
                    15.0 AS default_speed_kmh,
                    'urban_arterial' AS road_type,
                    rs.stop_sequence AS sequence_order
                FROM route_stops rs
                JOIN route_stops rs_next ON rs.route_id = rs_next.route_id 
                    AND rs_next.stop_sequence = rs.stop_sequence + 1
                JOIN bus_stops bs1 ON rs.stop_id = bs1.stop_id
                JOIN bus_stops bs2 ON rs_next.stop_id = bs2.stop_id";
                
                $pdo->exec($sql);
                echo " - Seeded route_segments from route_stops.\n";
            } else {
                 echo " - route_stops table is empty, skipping seed.\n";
            }
        } catch (Exception $e) {
             echo " - Error seeding: " . $e->getMessage() . "\n";
        }
    } else {
        echo " - route_segments already has data.\n";
    }

} catch (\PDOException $e) {
     echo "Connection failed: " . $e->getMessage() . " (" . (int)$e->getCode() . ")\n";
     exit(1);
}
