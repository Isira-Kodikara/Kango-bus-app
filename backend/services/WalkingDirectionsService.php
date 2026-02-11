<?php

class WalkingDirectionsService {
    private $apiKey;
    
    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }
    
    /**
     * Get walking directions from OpenRouteService API
     * Returns path coordinates, distance, duration, and turn-by-turn steps
     */
    public function getWalkingPath($fromLat, $fromLng, $toLat, $toLng) {
        $url = "https://api.openrouteservice.org/v2/directions/foot-walking";
        
        $data = [
            'coordinates' => [
                [(float)$fromLng, (float)$fromLat], // OpenRouteService uses [lng, lat]
                [(float)$toLng, (float)$toLat]
            ],
            'instructions' => true,
            'geometry' => true
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: ' . $this->apiKey,
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        // curl_close is deprecated in PHP 8.5+
        
        if ($httpCode !== 200 || $response === false) {
            return $this->getStraightLinePath($fromLat, $fromLng, $toLat, $toLng);
        }
        
        $result = json_decode($response, true);
        
        if (isset($result['features']) && !empty($result['features'])) {
            $feature = $result['features'][0];
            $route = $feature['properties'];
            
            // Extract turn-by-turn steps
            $steps = [];
            if (isset($route['segments'][0]['steps'])) {
                foreach ($route['segments'][0]['steps'] as $step) {
                    $steps[] = [
                        'instruction' => $step['instruction'] ?? 'Continue',
                        'distance' => $step['distance'] ?? 0
                    ];
                }
            }
            
            return [
                'coordinates' => $feature['geometry']['coordinates'],
                'distance_meters' => $route['summary']['distance'],
                'duration_seconds' => $route['summary']['duration'],
                'steps' => $steps
            ];
        }
        
        return $this->getStraightLinePath($fromLat, $fromLng, $toLat, $toLng);
    }
    
    /**
     * Fallback: straight-line path if API fails
     */
    public function getStraightLinePath($fromLat, $fromLng, $toLat, $toLng) {
        $distance = GeoUtils::haversineDistance($fromLat, $fromLng, $toLat, $toLng) * 1000;
        $walkingSpeed = 1.4; // m/s
        
        return [
            'coordinates' => [
                [$fromLng, $fromLat],
                [$toLng, $toLat]
            ],
            'distance_meters' => round($distance),
            'duration_seconds' => round($distance / $walkingSpeed),
            'steps' => [
                [
                    'instruction' => 'Walk straight to destination',
                    'distance' => $distance
                ]
            ]
        ];
    }
}
