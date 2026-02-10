<?php
// Removed config.php include as it is not needed for external HTTP requests

// configuration
$registerUrl = 'http://localhost:8001/api/auth/user/register';
$updateUrl = 'http://localhost:8001/api/auth/user/update-profile';

// Helper function to make requests using file_get_contents
function makeRequest($url, $method, $data = [], $token = null)
{
    echo "Requesting $url ($method)...\n";

    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n",
            'method' => $method,
            'content' => json_encode($data),
            'ignore_errors' => true // To fetch content even on failure (4xx, 5xx)
        ]
    ];

    if ($token) {
        $options['http']['header'] .= "Authorization: Bearer $token\r\n";
    }

    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);

    // Parse response headers to get status code
    $http_response_header = $http_response_header ?? [];
    $responseCode = 0;
    if (!empty($http_response_header)) {
        if (preg_match('#HTTP/[0-9\.]+\s+([0-9]+)#', $http_response_header[0], $matches)) {
            $responseCode = intval($matches[1]);
        }
    }

    if ($result === false) {
        return ['code' => 500, 'body' => ['error' => 'Connection failed'], 'raw' => ''];
    }

    $decoded = json_decode($result, true);
    if ($decoded === null) {
        return ['code' => $responseCode, 'body' => null, 'raw' => $result];
    }

    return ['code' => $responseCode, 'body' => $decoded, 'raw' => $result];
}

// 1. Register a test user
$random = rand(1000, 9999);
$testUser = [
    'username' => "testuser_$random",
    'email' => "test_$random@example.com",
    'password' => 'password123'
];

echo "1. Registering user " . $testUser['username'] . "...\n";
$regResponse = makeRequest($registerUrl, 'POST', $testUser);

if (($regResponse['code'] !== 201 && $regResponse['code'] !== 200) || $regResponse['body'] === null) {
    echo "Registration failed with code " . $regResponse['code'] . "\n";
    echo "Raw response:\n" . $regResponse['raw'] . "\n";
    if ($regResponse['body'])
        echo "Parsed body: " . json_encode($regResponse['body']) . "\n";
    exit(1);
}

$token = $regResponse['body']['data']['token'];
echo "Registration successful. Token received.\n\n";

// 2. Update Profile
$newUsername = "updated_user_$random";
echo "2. Updating username to $newUsername...\n";
$updateResponse = makeRequest($updateUrl, 'POST', ['username' => $newUsername], $token);

if ($updateResponse['code'] !== 200 || $updateResponse['body'] === null) {
    echo "Update failed with code " . $updateResponse['code'] . "\n";
    echo "Raw response:\n" . $updateResponse['raw'] . "\n";
    if ($updateResponse['body'])
        echo "Parsed body: " . json_encode($updateResponse['body']) . "\n";
    exit(1);
}

// 3. Verify Response
$updatedUser = $updateResponse['body']['data']['user'];
if ($updatedUser['username'] === $newUsername) {
    echo "SUCCESS: Username updated to " . $updatedUser['username'] . "\n";
    echo "New Token: " . substr($updateResponse['body']['data']['token'], 0, 20) . "...\n";
}
else {
    echo "FAILURE: Username mismatch. Expected $newUsername, got " . $updatedUser['username'] . "\n";
    exit(1);
}

echo "\nVerification Complete!\n";
