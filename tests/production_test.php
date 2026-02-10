<?php
// Production API Diagnostic Script (Robust cURL)

$baseUrl = "https://kango-bus-app-production.up.railway.app/api";

function test_endpoint($name, $url, $method = 'GET', $data = null)
{
    echo "Testing $name...\n";
    echo "URL: $url\n";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true); // Capture headers
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For testing
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            $jsonData = json_encode($data);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Content-Length: ' . strlen($jsonData)
            ]);
        }
    }

    $response = curl_exec($ch);

    if ($response === false) {
        $error = curl_error($ch);
        echo "Error: cURL failed - $error\n";
    }
    else {
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $body = substr($response, $headerSize);

        echo "Status: $httpCode\n";
        echo "Response Body:\n";

        $json = json_decode($body);
        if ($json) {
            echo json_encode($json, JSON_PRETTY_PRINT) . "\n";
        }
        else {
            // Truncate if too long (e.g. HTML error page)
            echo substr($body, 0, 500) . (strlen($body) > 500 ? "..." : "") . "\n";
        }
    }

    curl_close($ch);
    echo "\n---------------------------------------------------\n\n";
}

// 1. Route Details
test_endpoint("Route Details (Route 1)", "$baseUrl/get-route-details.php?route_id=1");

// 2. Live Buses
test_endpoint("Live Buses", "$baseUrl/get-live-buses.php");

// 3. Guidance Check
$guidanceData = [
    "origin_lat" => 6.9271,
    "origin_lng" => 79.8612,
    "destination_lat" => 6.9319,
    "destination_lng" => 79.8478
];
test_endpoint("Guidance Check", "$baseUrl/check-guidance.php", 'POST', $guidanceData);
