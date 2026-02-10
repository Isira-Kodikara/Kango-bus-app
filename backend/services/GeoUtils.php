<?php
// backend/services/GeoUtils.php

class GeoUtils {
    /**
     * Calculate distance between two points using Haversine formula
     * Returns distance in kilometers
     */
    public static function haversineDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371; // Earth's radius in km
        
        $latFrom = deg2rad($lat1);
        $lonFrom = deg2rad($lon1);
        $latTo = deg2rad($lat2);
        $lonTo = deg2rad($lon2);
        
        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;
        
        $angle = 2 * asin(sqrt(
            pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)
        ));
        
        return $earthRadius * $angle;
    }
    
    /**
     * Get traffic speed multiplier based on time of day
     * Returns multiplier: 0.7 for peak hours, 1.2 for late night, 1.0 otherwise
     */
    public static function getTrafficMultiplier($timestamp = null) {
        $hour = date('H', $timestamp ?? time());
        
        // Peak hours: 7-9 AM, 5-7 PM
        if (($hour >= 7 && $hour < 9) || ($hour >= 17 && $hour < 19)) {
            return 0.7; // 30% slower due to traffic
        }
        // Late night: 11 PM - 6 AM
        elseif ($hour >= 23 || $hour < 6) {
            return 1.2; // 20% faster, less traffic
        }
        // Off-peak
        return 1.0; // Normal speed
    }
    
    /**
     * Calculate bearing between two points
     * Returns bearing in radians
     */
    public static function calculateBearing($lat1, $lon1, $lat2, $lon2) {
        $lat1 = deg2rad($lat1);
        $lat2 = deg2rad($lat2);
        $lonDelta = deg2rad($lon2 - $lon1);
        
        $y = sin($lonDelta) * cos($lat2);
        $x = cos($lat1) * sin($lat2) - sin($lat1) * cos($lat2) * cos($lonDelta);
        
        return atan2($y, $x);
    }
}
