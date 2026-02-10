<?php

require_once __DIR__ . '/GeoUtils.php';

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
                [$fromLng, $fromLat], // OpenRouteService uses [lng, lat]
                [$toLng, $toLat]
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
        
        // Disable SSL verification for development environments if needed
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200 || $response === false) {
            // Log error if needed
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
            
            // Swap coordinates back to [lat, lng] for Leaflet if needed, or keep as [lng, lat] for GeoJSON
            // React Leaflet Polyline expects [lat, lng]
            $coords = [];
            if (isset($feature['geometry']['coordinates'])) {
                foreach ($feature['geometry']['coordinates'] as $coord) {
                    $coords[] = [$coord[1], $coord[0]]; // [lat, lng]
                }
            }
            
            return [
                'coordinates' => $coords,
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
                [$fromLat, $fromLng],
                [$toLat, $toLng]
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
