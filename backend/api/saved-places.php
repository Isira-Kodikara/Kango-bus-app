<?php
require_once __DIR__ . '/../includes/Response.php';
require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/JWT.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['message' => 'OK']);
    exit;
}

$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = str_replace('Bearer ', '', $authHeader);

$decoded = JWT::decode($token);
if (!$decoded) {
    Response::error('Unauthorized', 401);
}

$userId = $decoded['data']->id;
$db = Database::getInstance()->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("SELECT * FROM saved_places WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $places = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Cast numeric fields
        foreach ($places as &$place) {
            $place['id'] = (int) $place['id'];
            $place['user_id'] = (int) $place['user_id'];
            if ($place['latitude'] !== null) $place['latitude'] = (float) $place['latitude'];
            if ($place['longitude'] !== null) $place['longitude'] = (float) $place['longitude'];
        }

        Response::success($places, 'Saved places retrieved');
    } catch (Exception $e) {
        Response::error('Failed to fetch saved places: ' . $e->getMessage(), 500);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['name']) || !isset($data['address'])) {
        Response::error('Name and address are required', 400);
    }

    try {
        $stmt = $db->prepare("INSERT INTO saved_places (user_id, name, address, latitude, longitude, icon) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $userId,
            $data['name'],
            $data['address'],
            isset($data['latitude']) ? $data['latitude'] : null,
            isset($data['longitude']) ? $data['longitude'] : null,
            isset($data['icon']) ? $data['icon'] : 'map-pin'
        ]);

        $placeId = $db->lastInsertId();

        $stmt = $db->prepare("SELECT * FROM saved_places WHERE id = ?");
        $stmt->execute([$placeId]);
        $newPlace = $stmt->fetch(PDO::FETCH_ASSOC);

        // Cast numeric fields
        $newPlace['id'] = (int) $newPlace['id'];
        $newPlace['user_id'] = (int) $newPlace['user_id'];
        if ($newPlace['latitude'] !== null) $newPlace['latitude'] = (float) $newPlace['latitude'];
        if ($newPlace['longitude'] !== null) $newPlace['longitude'] = (float) $newPlace['longitude'];

        Response::success($newPlace, 'Place saved successfully', 201);
    } catch (Exception $e) {
        Response::error('Failed to save place: ' . $e->getMessage(), 500);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Support passing ID via query param or body
    $placeId = isset($_GET['id']) ? $_GET['id'] : (isset($data['id']) ? $data['id'] : null);

    if (!$placeId) {
        Response::error('Place ID is required', 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM saved_places WHERE id = ? AND user_id = ?");
        $stmt->execute([$placeId, $userId]);

        if ($stmt->rowCount() > 0) {
            Response::success(null, 'Place deleted successfully');
        } else {
            Response::error('Place not found or access denied', 404);
        }
    } catch (Exception $e) {
        Response::error('Failed to delete place: ' . $e->getMessage(), 500);
    }
}
else {
    Response::error('Method not allowed', 405);
}
