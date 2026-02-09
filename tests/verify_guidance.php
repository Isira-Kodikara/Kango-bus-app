<?php
// Mock request data
$_SERVER['REQUEST_METHOD'] = 'POST';
$request = [
    'user_id' => 1,
    'origin_lat' => 6.9147, // Borella Junction
    'origin_lng' => 79.8778,
    'destination_lat' => 6.9344, // Fort Railway Station
    'destination_lng' => 79.8428
];

// Mock php://input
function file_get_contents_mock($filename)
{
    global $request;
    if ($filename === 'php://input') {
        return json_encode($request);
    }
    return \file_get_contents($filename);
}

// Override file_get_contents
namespace {
    // Only override if not already defined (basic hack for CLI testing)
    if (!function_exists('file_get_contents_mock_wrapper')) {
        function file_get_contents($filename)
        {
            if ($filename === 'php://input') {
                global $request;
                return json_encode($request);
            }
            return \file_get_contents($filename);
        }
    }
}

// Include required files
require_once __DIR__ . '/../backend/api/check-guidance.php';
