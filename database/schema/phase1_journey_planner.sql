-- Phase 1: Journey Planner Tables

-- 1. route_segments table
-- Stores segments between consecutive bus stops
CREATE TABLE IF NOT EXISTS route_segments (
    segment_id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    from_stop_id INT NOT NULL,
    to_stop_id INT NOT NULL,
    distance_km DECIMAL(10, 3),
    default_speed_kmh INT DEFAULT 20, -- Default to residential speed
    road_type ENUM('urban_arterial', 'residential', 'highway', 'congested') DEFAULT 'residential',
    sequence_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (from_stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    FOREIGN KEY (to_stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    
    INDEX idx_route_segments (route_id, from_stop_id, to_stop_id)
);

-- 2. journey_plans table
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
