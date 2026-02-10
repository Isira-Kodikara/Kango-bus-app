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
               "$fromLng,$fromLat;$toLng,$toLat" .
               "?geometries=geojson&steps=true&banner_instructions=true&" .
               "access_token=" . $this->apiKey;
        
        $response = @file_get_contents($url);
        
        if ($response === false) {
            // API call failed, use fallback
            return $this->getStraightLinePath($fromLat, $fromLng, $toLat, $toLng);
        }
        
        $result = json_decode($response, true);
        
        if (isset($result['routes']) && !empty($result['routes'])) {
            $route = $result['routes'][0];
            
            // Extract turn-by-turn steps
            $steps = [];
            if (isset($route['legs'][0]['steps'])) {
                foreach ($route['legs'][0]['steps'] as $step) {
                    $steps[] = [
                        'instruction' => $step['maneuver']['instruction'] ?? 'Continue',
                        'distance' => $step['distance'] ?? 0
                    ];
                }
            }
            
            return [
                'coordinates' => $route['geometry']['coordinates'], // [lng, lat] format
                'distance_meters' => $route['distance'],
                'duration_seconds' => $route['duration'],
                'steps' => $steps
            ];
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
                [$fromLng, $fromLat],
                [$toLng, $toLat]
            ],
            'distance_meters' => $distance,
            'duration_seconds' => $distance / $walkingSpeed,
            'steps' => [
                [
                    'instruction' => 'Walk straight to destination',
                    'distance' => $distance
                ]
            ]
        ];
    }
}
