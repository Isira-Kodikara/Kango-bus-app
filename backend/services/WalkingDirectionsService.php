<?php
// backend/services/WalkingDirectionsService.php

class WalkingDirectionsService {
    private $apiKey;
    
    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }
    
    /**
     * Get walking directions from Mapbox API
     * Returns path coordinates, distance, duration, and turn-by-turn steps
     */
    public function getWalkingPath($fromLat, $fromLng, $toLat, $toLng) {
        $url = "https://api.mapbox.com/directions/v5/mapbox/walking/" .
               "$fromLng,$fromLat;$toLng,$toLat";
        
        // Query parameters
        $params = [
            'geometries' => 'geojson',
            'access_token' => $this->apiKey,
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
                            'duration' => $step['duration'] ?? 0
                        ];
                    }
                }

                return [
                    'distance_meters' => $route['distance'],
                    'duration_seconds' => $route['duration'],
                    // Mapbox returns [lng, lat]. We flip to [lat, lng] for frontend consistency
                    'coordinates' => array_map(function($coord) {
                        return [$coord[1], $coord[0]]; // [lat, lng]
                    }, $route['geometry']['coordinates']),
                    'steps' => $steps,
                    'source' => 'mapbox'
                ];
            }
        } catch (Exception $e) {
            error_log("WalkingDirectionsService Exception: " . $e->getMessage());
        }
        
        // Fallback if no route found
        return $this->getStraightLinePath($fromLat, $fromLng, $toLat, $toLng);
    }
    
    /**
     * Fallback: straight-line path if Mapbox API fails
     * Returns simple path with estimated walking time
     */
    public function getStraightLinePath($fromLat, $fromLng, $toLat, $toLng) {
        $distance = GeoUtils::haversineDistance($fromLat, $fromLng, $toLat, $toLng) * 1000; // meters
        $walkingSpeed = 1.4; // m/s
        
        return [
            'coordinates' => [
                [$fromLat, $fromLng],
                [$toLat, $toLng]
            ],
            'distance_meters' => $distance,
            'duration_seconds' => $distance / $walkingSpeed,
            'steps' => [
                [
                    'instruction' => 'Walk straight to destination',
                    'distance' => $distance
                ]
            ],
            'source' => 'fallback'
        ];
    }
}
