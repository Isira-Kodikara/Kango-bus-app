<?php

$uris = [
    '/api/auth/user/update-profile',
    '/auth/user/update-profile',
    '/kango/api/auth/user/update-profile',
    '/api/auth/user/update-profile?foo=bar',
    '/api/auth/user/login',
    '/api/auth/user/register'
];

foreach ($uris as $uri) {
    echo "Testing URI: $uri\n";
    $requestUri = parse_url($uri, PHP_URL_PATH);
    $action = '';

    // Logic from user.php
    if (preg_match('/\/auth\/user\/([\w-]+)/', $requestUri, $matches)) {
        $action = $matches[1];
    }

    echo "  Action determined: '$action'\n";
    if ($action === 'update-profile') {
        echo "  MATCHES 'update-profile'\n";
    }
    else {
        echo "  NO MATCH\n";
    }
    echo "--------------------------\n";
}
