-- KANGO Smart Bus Navigation Database Schema
-- Version 1.0

CREATE DATABASE IF NOT EXISTS kango_bus;
USE kango_bus;

-- Users table (Passengers)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    average_rating DECIMAL(3,2) DEFAULT 5.00,
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6),
    otp_expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bus Crew table
CREATE TABLE crew (
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

-- Admin table
CREATE TABLE admins (
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

-- Routes table
CREATE TABLE routes (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bus Stops table
CREATE TABLE stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stop_name VARCHAR(100) NOT NULL,
    stop_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Route Stops (Junction table for routes and stops)
CREATE TABLE route_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    stop_id INT NOT NULL,
    stop_order INT NOT NULL,
    estimated_time_from_start INT DEFAULT 0,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    UNIQUE KEY unique_route_stop (route_id, stop_id)
);

-- Buses table
CREATE TABLE buses (
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
    FOREIGN KEY (current_stop_id) REFERENCES stops(id) ON DELETE SET NULL
);

-- Add foreign key for crew's assigned bus
ALTER TABLE crew ADD FOREIGN KEY (assigned_bus_id) REFERENCES buses(id) ON DELETE SET NULL;

-- Schedule table
CREATE TABLE schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    stop_id INT NOT NULL,
    arrival_time TIME NOT NULL,
    day_type ENUM('weekday', 'saturday', 'sunday', 'holiday') DEFAULT 'weekday',
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE
);

-- Trips table
CREATE TABLE trips (
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
    FOREIGN KEY (destination_stop_id) REFERENCES stops(id) ON DELETE SET NULL
);

-- Payments table
CREATE TABLE payments (
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wait Requests table
CREATE TABLE wait_requests (
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
    FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE
);

-- Emergency Alerts table
CREATE TABLE emergency_alerts (
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
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL
);

-- Emergency Contacts table
CREATE TABLE emergency_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Saved Locations table
CREATE TABLE saved_locations (
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

-- User Sessions table (for JWT token management)
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('user', 'crew', 'admin') NOT NULL,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table
CREATE TABLE analytics (
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

-- Crew Reports table
CREATE TABLE crew_reports (
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

-- Insert sample data

-- Sample Routes
INSERT INTO routes (route_number, route_name, start_point, end_point, total_stops, avg_time_minutes, frequency_minutes, color) VALUES
('R001', 'Downtown Express', 'Main Street Station', 'Harbor Terminal', 8, 35, 10, '#3b82f6'),
('R002', 'City Circle', 'Central Plaza', 'Central Plaza', 12, 45, 15, '#10b981'),
('R003', 'Harbor Line', 'Park Avenue', 'Harbor Terminal', 10, 40, 12, '#f59e0b'),
('R004', 'North Route', 'Main Street Station', 'North Terminal', 15, 55, 20, '#8b5cf6');

-- Sample Stops
INSERT INTO stops (stop_name, stop_code, latitude, longitude, address) VALUES
('Main Street Station', 'MSS001', 6.9271, 79.8612, '123 Main Street'),
('Park Avenue', 'PA001', 6.9285, 79.8625, '456 Park Avenue'),
('Central Plaza', 'CP001', 6.9295, 79.8640, '789 Central Plaza'),
('Business District', 'BD001', 6.9310, 79.8655, '101 Business Ave'),
('Harbor Terminal', 'HT001', 6.9325, 79.8670, '202 Harbor Road'),
('River Plaza', 'RP001', 6.9340, 79.8685, '303 River Street'),
('North Terminal', 'NT001', 6.9355, 79.8700, '404 North Road');

-- Sample Route Stops
INSERT INTO route_stops (route_id, stop_id, stop_order, estimated_time_from_start) VALUES
(1, 1, 1, 0), (1, 2, 2, 5), (1, 3, 3, 12), (1, 4, 4, 20), (1, 5, 5, 35),
(2, 3, 1, 0), (2, 4, 2, 8), (2, 5, 3, 18), (2, 6, 4, 28), (2, 7, 5, 45),
(3, 2, 1, 0), (3, 3, 2, 7), (3, 4, 3, 15), (3, 5, 4, 25), (3, 6, 5, 40);

-- Sample Buses
INSERT INTO buses (bus_number, route_id, capacity, current_passengers, status, current_stop_id) VALUES
('BUS-45', 1, 40, 12, 'active', 3),
('BUS-12', 2, 40, 28, 'active', 4),
('BUS-89', 3, 40, 35, 'active', 5),
('BUS-23', 4, 40, 0, 'inactive', NULL);

-- Sample Admin
INSERT INTO admins (email, password, full_name, is_super_admin) VALUES
('admin@kango.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Admin', TRUE);
-- Password: password

-- Sample Crew
INSERT INTO crew (full_name, email, password, nic, assigned_bus_id, is_verified) VALUES
('John Smith', 'john.smith@kango.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789V', 1, TRUE),
('Sarah Johnson', 'sarah.johnson@kango.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '987654321V', 2, TRUE),
('Mike Davis', 'mike.davis@kango.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '456789123V', 3, TRUE);
-- Password: password

-- Create indexes for better performance
CREATE INDEX idx_buses_status ON buses(status);
CREATE INDEX idx_buses_route ON buses(route_id);
CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_schedule_route ON schedule(route_id);
CREATE INDEX idx_wait_requests_bus ON wait_requests(bus_id);
CREATE INDEX idx_emergency_alerts_user ON emergency_alerts(user_id);
