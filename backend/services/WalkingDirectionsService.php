<?php

require_once __DIR__ . '/GeoUtils.php';

class WalkingDirectionsService {
    private $mapboxToken;
    private $walkingSpeedMps = 1.4; // Average walking speed: 1.4 m/s (approx 5 km/h)

    public function __construct() {
        // Load API key from environment variable
        $this->mapboxToken = getenv('MAPBOX_ACCESS_TOKEN');
        
        if (!$this->mapboxToken && file_exists(__DIR__ . '/../.env')) {
            // Fallback: naive .env parser
            $envLines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($envLines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                list($name, $value) = explode('=', $line, 2);
                if (trim($name) === 'MAPBOX_ACCESS_TOKEN') {
                    $this->mapboxToken = trim($value);
                    break;
                }
            }
        }
    }

    /**
     * Get walking directions between two points using Mapbox Navigation API
     */
    public function getWalkingPath($fromLat, $fromLng, $toLat, $toLng) {
        if (empty($this->mapboxToken)) {
            error_log("WalkingDirectionsService: MAPBOX_ACCESS_TOKEN not set. Using straight line fallback.");
            return $this->getStraightLinePath($fromLat, $fromLng, $toLat, $toLng);
        }

        // Mapbox requires coordinates in "longitude,latitude" format
        $coordinates = "$fromLng,$fromLat;$toLng,$toLat";
        $url = "https://api.mapbox.com/directions/v5/mapbox/walking/{$coordinates}";
        
        // Query parameters
        $params = [
            'geometries' => 'geojson',
            'access_token' => $this->mapboxToken,
            'overview' => 'full',
            'steps' => 'true',
            'banner_instructions' => 'true'
        ];

        $requestUrl = $url . '?' . http_build_query($params);

        try {
            $response = @file_get_contents($requestUrl);
            
            if ($response === false) {
                throw new Exception("Failed to fetch from Mapbox API");
            }

            $data = json_decode($response, true);

            if (isset($data['routes']) && count($data['routes']) > 0) {
                $route = $data['routes'][0];
                
                // Extract steps if available
                $steps = [];
                if (isset($route['legs'][0]['steps'])) {
                    foreach ($route['legs'][0]['steps'] as $step) {
                        $steps[] = [
                            'instruction' => $step['maneuver']['instruction'],
                            'distance' => $step['distance'],
                            'duration' => $step['duration'],
                            'location' => $step['maneuver']['location'] // [lng, lat]
                        ];
                    }
                }

                return [
                    'distance_meters' => $route['distance'],
                    'duration_seconds' => $route['duration'],
                    'coordinates' => $route['geometry']['coordinates'], // [lng, lat] arrays
                    'steps' => $steps,
                    'source' => 'mapbox'
                ];
            }
        } catch (Exception $e) {
            error_log("Mapbox API Error: " . $e->getMessage());
        }

        // Fallback to straight line if API fails
        return $this->getStraightLinePath($fromLat, $fromLng, $toLat, $toLng);
    }

    /**
     * Fallback: Calculate straight line path
     */
    public function getStraightLinePath($fromLat, $fromLng, $toLat, $toLng) {
        $distanceKm = GeoUtils::haversineDistance($fromLat, $fromLng, $toLat, $toLng);
        $distanceMeters = $distanceKm * 1000;
        
        // Estimate time: distance / speed
        $durationSeconds = $distanceMeters / $this->walkingSpeedMps;

        return [
            'distance_meters' => round($distanceMeters),
            'duration_seconds' => round($durationSeconds),
            'coordinates' => [
                [$fromLng, $fromLat],
                [$toLng, $toLat]
            ],
            'source' => 'straight_line_fallback'
        ];
    }
}
