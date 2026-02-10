<?php

require_once __DIR__ . '/GeoUtils.php';

class MapboxService
{
    private $mapboxToken;

    public function __construct()
    {
        $this->mapboxToken = getenv('MAPBOX_ACCESS_TOKEN');

        if (!$this->mapboxToken && file_exists(__DIR__ . '/../.env')) {
            $envLines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($envLines as $line) {
                if (strpos(trim($line), '#') === 0)
                    continue;
                list($name, $value) = explode('=', $line, 2);
                if (trim($name) === 'MAPBOX_ACCESS_TOKEN') {
                    $this->mapboxToken = trim($value);
                    break;
                }
            }
        }
    }

    /**
     * Get driving route geometry between a sequence of stops
     * @param array $stops Array of ['lat' => x, 'lng' => y]
     */
    public function getDrivingRoute($stops)
    {
        if (empty($this->mapboxToken)) {
            return null;
        }

        // Mapbox limits to 25 coordinates per request.
        // For simplicity in this demo, we'll take the first 25 stops.
        // In production, we'd chunk this.
        $stops = array_slice($stops, 0, 25);

        $coordinates = array_map(function ($stop) {
            return $stop['lng'] . ',' . $stop['lat'];
        }, $stops);

        $coordString = implode(';', $coordinates);
        $url = "https://api.mapbox.com/directions/v5/mapbox/driving/{$coordString}";

        $params = [
            'geometries' => 'geojson',
            'access_token' => $this->mapboxToken,
            'overview' => 'full'
        ];

        $requestUrl = $url . '?' . http_build_query($params);

        try {
            // Suppress warnings
            $context = stream_context_create([
                'http' => ['ignore_errors' => true]
            ]);
            $response = @file_get_contents($requestUrl, false, $context);

            if ($response === false) {
                return null;
            }

            $data = json_decode($response, true);

            if (isset($data['routes']) && count($data['routes']) > 0) {
                return $data['routes'][0]['geometry']['coordinates']; // [lng, lat] arrays
            }

        }
        catch (Exception $e) {
            error_log("Mapbox Driving Route Error: " . $e->getMessage());
        }

        return null;
    }
}
