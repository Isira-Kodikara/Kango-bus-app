<?php

class GeoUtils {
    /**
     * Calculate distance between two points using Haversine formula
     * Returns distance in kilometers
     */
    public static function haversineDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371; // Radius of earth in km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Get traffic multiplier based on time of day
     * Returns float multiplier (1.0 = normal speed)
     */
    public static function getTrafficMultiplier($timestamp = null) {
        if ($timestamp === null) {
            $timestamp = time();
        }

        $hour = (int)date('H', $timestamp);
        $dayOfWeek = (int)date('w', $timestamp); // 0 (Sunday) to 6 (Saturday)

        // Weekend has less traffic usually
        if ($dayOfWeek == 0 || $dayOfWeek == 6) {
            return 0.9;
        }

        // Peak hours: 7-9 AM and 5-7 PM
        if (($hour >= 7 && $hour < 9) || ($hour >= 17 && $hour < 19)) {
            return 0.7; // Slower speed (30% reduction)
        }

        // Late night: 11 PM - 5 AM
        if ($hour >= 23 || $hour < 5) {
            return 1.2; // Faster speed (20% increase)
        }

        // Normal hours
        return 1.0;
    }
}
