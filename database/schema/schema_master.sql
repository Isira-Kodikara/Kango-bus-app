-- KANGO Smart Bus Navigation - Master Database Schema
-- Consolidated on: 2026-02-11
-- Version: 2.0

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. USER MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    average_rating DECIMAL(3,2) DEFAULT 5.00,
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6),
    otp_expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crew (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nic VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20),
    assigned_bus_id INT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    otp_code VARCHAR(6),
    otp_expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_super_admin BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6),
    otp_expires_at DATETIME,
    confirm_code VARCHAR(10),
    confirm_expires_at DATETIME,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. ROUTES & STOPS
-- =====================================================

CREATE TABLE IF NOT EXISTS routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_number VARCHAR(20) NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    start_point VARCHAR(100),
    end_point VARCHAR(100),
    total_stops INT DEFAULT 0,
    avg_time_minutes INT,
    frequency_minutes INT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    osm_id BIGINT UNIQUE,
    operator VARCHAR(100),
    geometry LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_route_number (route_number)
);

CREATE TABLE IF NOT EXISTS stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stop_name VARCHAR(100) NOT NULL,
    stop_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    osm_id BIGINT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_stop_location (latitude, longitude)
);

CREATE TABLE IF NOT EXISTS route_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    stop_id INT NOT NULL,
    stop_order INT NOT NULL,
    estimated_time_from_start INT DEFAULT 0,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    UNIQUE KEY unique_route_stop (route_id, stop_id),
    INDEX idx_route_stop_order (route_id, stop_order)
);

-- =====================================================
-- 3. BUS & FLEET
-- =====================================================

CREATE TABLE IF NOT EXISTS buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    route_id INT,
    capacity INT DEFAULT 40,
    current_passengers INT DEFAULT 0,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    current_stop_id INT,
    status ENUM('active', 'inactive', 'maintenance', 'out_of_service') DEFAULT 'inactive',
    is_live_tracking BOOLEAN DEFAULT FALSE,
    last_location_update TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
    FOREIGN KEY (current_stop_id) REFERENCES stops(id) ON DELETE SET NULL,
    INDEX idx_buses_status (status),
    INDEX idx_buses_route (route_id)
);

ALTER TABLE crew ADD CONSTRAINT fk_crew_bus FOREIGN KEY (assigned_bus_id) REFERENCES buses(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    stop_id INT NOT NULL,
    arrival_time TIME NOT NULL,
    day_type ENUM('weekday', 'saturday', 'sunday', 'holiday') DEFAULT 'weekday',
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    INDEX idx_schedule_route (route_id)
);

-- =====================================================
-- 4. TRIPS & PAYMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bus_id INT NOT NULL,
    route_id INT,
    boarding_stop_id INT,
    destination_stop_id INT,
    destination_name VARCHAR(100),
    status ENUM('pending', 'boarded', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    boarded_at DATETIME,
    completed_at DATETIME,
    fare DECIMAL(10, 2),
    rating INT,
    rating_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
    FOREIGN KEY (boarding_stop_id) REFERENCES stops(id) ON DELETE SET NULL,
    FOREIGN KEY (destination_stop_id) REFERENCES stops(id) ON DELETE SET NULL,
    INDEX idx_trips_user (user_id),
    INDEX idx_trips_status (status)
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('card', 'wallet', 'cash') DEFAULT 'card',
    card_last_four VARCHAR(4),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payments_user (user_id)
);

-- =====================================================
-- 5. FEATURES & ALERTS
-- =====================================================

CREATE TABLE IF NOT EXISTS wait_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bus_id INT NOT NULL,
    stop_id INT NOT NULL,
    time_remaining INT DEFAULT 10,
    status ENUM('active', 'extended', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    INDEX idx_wait_requests_bus (bus_id)
);

CREATE TABLE IF NOT EXISTS emergency_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    trip_id INT,
    bus_id INT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    alert_type ENUM('emergency', 'safety', 'medical') DEFAULT 'emergency',
    status ENUM('sent', 'acknowledged', 'resolved') DEFAULT 'sent',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL,
    INDEX idx_emergency_alerts_user (user_id)
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    address VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_type ENUM('home', 'work', 'other') DEFAULT 'other',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Note: Redundant saved_places table kept for compatibility with Phase 1 components
CREATE TABLE IF NOT EXISTS saved_places (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    icon VARCHAR(50) DEFAULT 'map-pin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 6. SESSION & ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('user', 'crew', 'admin') NOT NULL,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_trips INT DEFAULT 0,
    total_passengers INT DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    average_rating DECIMAL(3, 2),
    peak_hour_start TIME,
    peak_hour_end TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date)
);

CREATE TABLE IF NOT EXISTS crew_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crew_id INT NOT NULL,
    bus_id INT NOT NULL,
    report_type ENUM('traffic', 'delay', 'maintenance', 'accident', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'acknowledged', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (crew_id) REFERENCES crew(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

-- =====================================================
-- 7. JOURNEY PLANNING (Phase 1)
-- =====================================================

CREATE TABLE IF NOT EXISTS route_segments (
    segment_id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    from_stop_id INT NOT NULL,
    to_stop_id INT NOT NULL,
    distance_km DECIMAL(10, 3),
    default_speed_kmh INT DEFAULT 20,
    road_type ENUM('urban_arterial', 'residential', 'highway', 'congested') DEFAULT 'residential',
    sequence_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (from_stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    FOREIGN KEY (to_stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    INDEX idx_route_sequence (route_id, sequence_order)
);

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

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 8. DATA SEEDING (Optional - Route Segments)
-- =====================================================
-- Insert initial route segments data logic...
