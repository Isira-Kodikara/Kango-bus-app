-- KANGO Journey Planner Rebuild Database Setup


-- Create Route segments table
CREATE TABLE IF NOT EXISTS route_segments (
    segment_id INT PRIMARY KEY AUTO_INCREMENT,
    route_id INT NOT NULL,
    from_stop_id INT NOT NULL,
    to_stop_id INT NOT NULL,
    distance_km DECIMAL(5,2) NOT NULL,
    default_speed_kmh DECIMAL(4,1) NOT NULL DEFAULT 15.0,
    road_type ENUM('urban_arterial', 'residential', 'highway', 'congested') DEFAULT 'urban_arterial',
    sequence_order INT NOT NULL,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (from_stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    FOREIGN KEY (to_stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    INDEX idx_route (route_id, sequence_order)
);

-- Create Journey plans table
CREATE TABLE IF NOT EXISTS journey_plans (
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
);

-- Seed Route Segments Data
INSERT INTO route_segments (route_id, from_stop_id, to_stop_id, distance_km, default_speed_kmh, road_type, sequence_order)
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
    rs.stop_order AS sequence_order
FROM route_stops rs
JOIN route_stops rs_next ON rs.route_id = rs_next.route_id 
    AND rs_next.stop_order = rs.stop_order + 1
JOIN stops bs1 ON rs.stop_id = bs1.id
JOIN stops bs2 ON rs_next.stop_id = bs2.id;
