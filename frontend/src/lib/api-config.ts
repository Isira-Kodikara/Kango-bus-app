/**
 * API Configuration
 * Last Updated: Force Deploy Trigger
 */

// Priority: VITE_API_URL -> VITE_API_BASE_URL -> Domestic production check -> Localhost fallback
// Priority: VITE_API_URL -> VITE_API_BASE_URL -> Production URL (default)
const rawBaseUrl = import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    `https://kango-bus-app-production.up.railway.app`;


// Ensure base URL has /api suffix if not present
export const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

// Specific endpoints
export const ENDPOINTS = {
    TRIP_GUIDANCE: `${API_BASE_URL}/trip-guidance`,
    GET_LIVE_BUSES: `${API_BASE_URL}/get-live-buses`,
    GET_ROUTES: `${API_BASE_URL}/get-routes`,
    GET_STOPS: `${API_BASE_URL}/get-stops`,
    GET_ROUTE_DETAILS: `${API_BASE_URL}/get-route-details`,
    AUTH_USER: `${API_BASE_URL}/auth/user`,
    SAVED_PLACES: `${API_BASE_URL}/saved-places`,
};
