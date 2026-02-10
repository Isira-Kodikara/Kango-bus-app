<?php

require_once __DIR__ . '/GeoUtils.php';

class WalkingDirectionsService {
    private $mapboxToken;
    private $walkingSpeedMps = 1.4; // Average walking speed: 1.4 m/s (approx 5 km/h)

    public function __construct() {
        // Load API key from environment variable
        $this->mapboxToken = getenv('MAPBOX_ACCESS_TOKEN');
        
        if (!$this->mapboxToken && file_exists(__DIR__ . '/../.env')) {
            // Environment variable configuration
            $envLines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($envLines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                $parts = explode('=', $line, 2);
                if (count($parts) === 2 && trim($parts[0]) === 'MAPBOX_ACCESS_TOKEN') {
                    $this->mapboxToken = trim($parts[1]);
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
            // Suppress warnings for file_get_contents
            $context = stream_context_create([
                'http' => ['ignore_errors' => true]
            ]);
            $response = @file_get_contents($requestUrl, false, $context);
            
            if ($response === false) {
                 // Check if it's a network issue or API error
                 $error = error_get_last();
                 error_log("Mapbox API request failed: " . ($error['message'] ?? 'Unknown error'));
                 throw new Exception("Failed to fetch from Mapbox API");
            }

            $data = json_decode($response, true);

            // Check for API errors in response body
            if (isset($data['code']) && $data['code'] !== 'Ok') {
                error_log("Mapbox API Error Code: " . $data['code'] . " - " . ($data['message'] ?? ''));
                throw new Exception("Mapbox API Error: " . ($data['message'] ?? $data['code']));
            }

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
                    // Ensure coordinates are [lat, lng] for frontend consistency if needed, 
                    // but Mapbox returns [lng, lat]. Let's keep [lng, lat] for GeoJSON compatibility
                    // The frontend UserHome.tsx expects [lat, lng] in some places, so we might need to flip.
                    // Checking UserHome.tsx: mocked path uses [lat, lng]. 
                    // Let's flip them here to match our app's convention of [lat, lng] for simple arrays
                    'coordinates' => array_map(function($coord) {
                        return [$coord[1], $coord[0]]; // Flip to [lat, lng]
                    }, $route['geometry']['coordinates']),
                    'steps' => $steps,
                    'source' => 'mapbox'
                ];
            }
        } catch (Exception $e) {
            error_log("WalkingDirectionsService Exception: " . $e->getMessage());
        }

        // Fallback to straight line if API fails
        return $this->getStraightLinePath($fromLat, $fromLng, $toLat, $toLng);
    }
