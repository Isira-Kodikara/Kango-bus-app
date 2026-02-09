/**
 * API Configuration
 * 
 * In development, this points to localhost:8000.
 * In production, it should be set via environment variable VITE_API_BASE_URL.
 */

// Detect if we are running in a production-like environment (Vercel, Railway, etc.)
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';

// Base URL for backend API
// Priority:
// 1. VITE_API_BASE_URL environment variable
// 2. Production guess based on window.location
// 3. Localhost fallback
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
    (isProduction
        ? `https://${window.location.hostname}/api` // Guessing standard subdirectory
        : 'http://localhost:8000/api');

// Specific endpoints
export const ENDPOINTS = {
    JOURNEY_PLANNER: `${API_BASE_URL}/journey-planner.php`,
    CHECK_GUIDANCE: `${API_BASE_URL}/check-guidance.php`,
    // Add other endpoints as needed
};
