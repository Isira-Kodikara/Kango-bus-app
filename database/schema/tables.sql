-- KANGO Smart Bus Navigation Database Schema
-- Version 1.0
-- This file contains all table definitions

CREATE DATABASE IF NOT EXISTS kango_bus;
USE kango_bus;

-- =====================================================
-- USER MANAGEMENT TABLES
-- =====================================================

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

-- =====================================================
-- ROUTE & STOP TABLES
-- =====================================================

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

-- =====================================================
-- BUS & FLEET TABLES
-- =====================================================

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

-- =====================================================
-- TRIP & PAYMENT TABLES
-- =====================================================

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

-- =====================================================
-- FEATURE TABLES
-- =====================================================

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

-- =====================================================
-- SESSION & ANALYTICS TABLES
-- =====================================================

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

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_buses_status ON buses(status);
CREATE INDEX idx_buses_route ON buses(route_id);
CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_schedule_route ON schedule(route_id);
CREATE INDEX idx_wait_requests_bus ON wait_requests(bus_id);
CREATE INDEX idx_emergency_alerts_user ON emergency_alerts(user_id);
