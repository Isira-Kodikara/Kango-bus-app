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
// 1. VITE_API_BASE_URL environment variable (stripped of trailing slash)
// 2. Production guess based on window.location
// 3. Localhost fallback
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ||
    (isProduction
        ? `https://${window.location.hostname}/api` // Guessing standard subdirectory
        : 'http://localhost:8000/api');

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '');

// Specific endpoints
export const ENDPOINTS = {
    TRIP_GUIDANCE: `${API_BASE_URL}/trip-guidance.php`,
};
