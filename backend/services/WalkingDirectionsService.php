<?php

class WalkingDirectionsService
{
    private $apiKey;

    public function __construct($apiKey)
    {
        $this->apiKey = $apiKey;
    }

    /**
     * Get walking directions from OSRM API (Project OSRM)
     * Returns path coordinates, distance, duration, and turn-by-turn steps
     */
    public function getWalkingPath($fromLat, $fromLng, $toLat, $toLng)
    {
        // Use OSRM public API (or internal if hosted)
        // coordinates format: {longitude},{latitude};{longitude},{latitude}
        $url = "http://router.project-osrm.org/route/v1/foot/$fromLng,$fromLat;$toLng,$toLat?overview=full&geometries=geojson&steps=true";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        // Mock user agent to avoid being blocked if necessary
        curl_setopt($ch, CURLOPT_USERAGENT, 'KangoBusApp/1.0');

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        // curl_close moved to end or handled by PHP GC

        if ($httpCode !== 200 || $response === false) {
            return $this->getStraightLinePath($fromLat, $fromLng, $toLat, $toLng);
        }

        $result = json_decode($response, true);

        if (isset($result['code']) && $result['code'] === 'Ok' && !empty($result['routes'])) {
            $route = $result['routes'][0];

            // Extract turn-by-turn steps
            $steps = [];
            if (isset($route['legs'][0]['steps'])) {
                foreach ($route['legs'][0]['steps'] as $step) {
                    // OSRM steps are detailed
                    $instruction = $step['maneuver']['type'] . ' ' . ($step['maneuver']['modifier'] ?? '');
                    if (isset($step['name']) && $step['name']) {
                        $instruction .= ' onto ' . $step['name'];
                    }

                    $steps[] = [
                        'instruction' => $step['maneuver']['instruction'] ?? $instruction,
                        'distance' => $step['distance'] ?? 0
                    ];
                }
            }

            // OSRM returns [lng, lat], maintain this for frontend compatibility
            $coordinates = $route['geometry']['coordinates'];

            return [
                'coordinates' => $coordinates,
                'distance_meters' => $route['distance'],
                'duration_seconds' => $route['duration'],
                'steps' => $steps
            ];
        }

        return $this->getStraightLinePath($fromLat, $fromLng, $toLat, $toLng);
    }

    /**
     * Fallback: straight-line path if API fails
     */
    public function getStraightLinePath($fromLat, $fromLng, $toLat, $toLng)
    {
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
