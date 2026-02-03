-- KANGO Smart Bus Navigation - Sample Data
-- This file contains seed data for development and testing
-- Run this AFTER tables.sql

USE kango_bus;

-- =====================================================
-- ROUTES SAMPLE DATA
-- =====================================================

INSERT INTO routes (route_number, route_name, start_point, end_point, total_stops, avg_time_minutes, frequency_minutes, color) VALUES
('R001', 'Downtown Express', 'Main Street Station', 'Harbor Terminal', 8, 35, 10, '#3b82f6'),
('R002', 'City Circle', 'Central Plaza', 'Central Plaza', 12, 45, 15, '#10b981'),
('R003', 'Harbor Line', 'Park Avenue', 'Harbor Terminal', 10, 40, 12, '#f59e0b'),
('R004', 'North Route', 'Main Street Station', 'North Terminal', 15, 55, 20, '#8b5cf6');

-- =====================================================
-- STOPS SAMPLE DATA
-- =====================================================

INSERT INTO stops (stop_name, stop_code, latitude, longitude, address) VALUES
('Main Street Station', 'MSS001', 6.9271, 79.8612, '123 Main Street'),
('Park Avenue', 'PA001', 6.9285, 79.8625, '456 Park Avenue'),
('Central Plaza', 'CP001', 6.9295, 79.8640, '789 Central Plaza'),
('Business District', 'BD001', 6.9310, 79.8655, '101 Business Ave'),
('Harbor Terminal', 'HT001', 6.9325, 79.8670, '202 Harbor Road'),
('River Plaza', 'RP001', 6.9340, 79.8685, '303 River Street'),
('North Terminal', 'NT001', 6.9355, 79.8700, '404 North Road');

-- =====================================================
-- ROUTE STOPS SAMPLE DATA
-- =====================================================

INSERT INTO route_stops (route_id, stop_id, stop_order, estimated_time_from_start) VALUES
-- Route 1: Downtown Express
(1, 1, 1, 0), 
(1, 2, 2, 5), 
(1, 3, 3, 12), 
(1, 4, 4, 20), 
(1, 5, 5, 35),
-- Route 2: City Circle
(2, 3, 1, 0), 
(2, 4, 2, 8), 
(2, 5, 3, 18), 
(2, 6, 4, 28), 
(2, 7, 5, 45),
-- Route 3: Harbor Line
(3, 2, 1, 0), 
(3, 3, 2, 7), 
(3, 4, 3, 15), 
(3, 5, 4, 25), 
(3, 6, 5, 40);

-- =====================================================
-- BUSES SAMPLE DATA
-- =====================================================

INSERT INTO buses (bus_number, route_id, capacity, current_passengers, status, current_stop_id) VALUES
('BUS-45', 1, 40, 12, 'active', 3),
('BUS-12', 2, 40, 28, 'active', 4),
('BUS-89', 3, 40, 35, 'active', 5),
('BUS-23', 4, 40, 0, 'inactive', NULL);

-- =====================================================
-- ADMIN SAMPLE DATA
-- =====================================================

-- Default password: password
INSERT INTO admins (email, password, full_name, is_super_admin) VALUES
('admin@kango.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Admin', TRUE);

-- =====================================================
-- CREW SAMPLE DATA
-- =====================================================

-- Default password: password
INSERT INTO crew (full_name, email, password, nic, assigned_bus_id, is_verified) VALUES
('John Smith', 'john.smith@kango.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '123456789V', 1, TRUE),
('Sarah Johnson', 'sarah.johnson@kango.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '987654321V', 2, TRUE),
('Mike Davis', 'mike.davis@kango.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '456789123V', 3, TRUE);
