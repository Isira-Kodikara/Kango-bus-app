-- Phase 1: Journey Planner Database Schema
-- File: journey_planning_phase1.sql

-- =====================================================
-- 1. route_segments table
-- =====================================================
-- Stores segments between consecutive bus stops
CREATE TABLE IF NOT EXISTS route_segments (
    segment_id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    from_stop_id INT NOT NULL,
    to_stop_id INT NOT NULL,
    distance_km DECIMAL(10, 3),
    default_speed_kmh INT DEFAULT 20, -- Default residential speed
    road_type ENUM('urban_arterial', 'residential', 'highway', 'congested') DEFAULT 'residential',
    sequence_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (from_stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    FOREIGN KEY (to_stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    
    -- Optimize for graph building
    INDEX idx_route_sequence (route_id, sequence_order)
);

-- =====================================================
-- 2. journey_plans table
-- =====================================================
-- Stores user journey requests
CREATE TABLE IF NOT EXISTS journey_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    origin_lat DECIMAL(10, 8) NOT NULL,
    origin_lng DECIMAL(11, 8) NOT NULL,
    destination_lat DECIMAL(10, 8) NOT NULL,
    destination_lng DECIMAL(11, 8) NOT NULL,
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
    FOREIGN KEY (boarding_stop_id) REFERENCES stops(id) ON DELETE SET NULL,
    FOREIGN KEY (alighting_stop_id) REFERENCES stops(id) ON DELETE SET NULL,
    FOREIGN KEY (selected_route_id) REFERENCES routes(id) ON DELETE SET NULL
);

-- =====================================================
-- 3. Data Seeding for route_segments
-- =====================================================
-- Populate segments from existing route_stops data
-- Calculates distance using Haversine formula
-- Assigns default speeds based on distance/road type approximation (refined later if needed)

INSERT INTO route_segments (route_id, from_stop_id, to_stop_id, sequence_order, distance_km, default_speed_kmh, road_type)
SELECT 
    t1.route_id,
    t1.stop_id as from_stop_id,
    t2.stop_id as to_stop_id,
    t1.stop_order as sequence_order,
    -- Haversine Formula for Distance in KM
    (6371 * acos(
        cos(radians(s1.latitude)) * cos(radians(s2.latitude)) * 
        cos(radians(s2.longitude) - radians(s1.longitude)) + 
        sin(radians(s1.latitude)) * sin(radians(s2.latitude))
    )) as distance_km,
    -- Simple logic to assign speed/type based on distance (Example logic)
    -- Longer segments > 2km assumed to be arterial/highway, shorter are residential
    CASE 
        WHEN (6371 * acos(cos(radians(s1.latitude)) * cos(radians(s2.latitude)) * cos(radians(s2.longitude) - radians(s1.longitude)) + sin(radians(s1.latitude)) * sin(radians(s2.latitude)))) > 2 THEN 35 -- Highway speed
        WHEN (6371 * acos(cos(radians(s1.latitude)) * cos(radians(s2.latitude)) * cos(radians(s2.longitude) - radians(s1.longitude)) + sin(radians(s1.latitude)) * sin(radians(s2.latitude)))) > 1 THEN 25 -- Arterial speed
        ELSE 20 -- Residential/Congested
    END as default_speed_kmh,
    CASE 
        WHEN (6371 * acos(cos(radians(s1.latitude)) * cos(radians(s2.latitude)) * cos(radians(s2.longitude) - radians(s1.longitude)) + sin(radians(s1.latitude)) * sin(radians(s2.latitude)))) > 2 THEN 'highway'
        WHEN (6371 * acos(cos(radians(s1.latitude)) * cos(radians(s2.latitude)) * cos(radians(s2.longitude) - radians(s1.longitude)) + sin(radians(s1.latitude)) * sin(radians(s2.latitude)))) > 1 THEN 'urban_arterial'
        ELSE 'residential'
    END as road_type
FROM route_stops t1
JOIN route_stops t2 ON t1.route_id = t2.route_id AND t2.stop_order = t1.stop_order + 1
JOIN stops s1 ON t1.stop_id = s1.id
JOIN stops s2 ON t2.stop_id = s2.id
-- Avoid duplicates if run multiple times
WHERE NOT EXISTS (
    SELECT 1 FROM route_segments rs 
    WHERE rs.route_id = t1.route_id 
    AND rs.from_stop_id = t1.stop_id 
    AND rs.to_stop_id = t2.stop_id
);

-- Verify the seed
-- SELECT count(*) as segments_created FROM route_segments;
