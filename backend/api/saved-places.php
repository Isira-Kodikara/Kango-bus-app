<?php
require_once '../includes/Response.php';
require_once '../includes/Database.php';
require_once '../includes/JWT.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    Response::send(200, ['message' => 'OK']);
    exit;
}

$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
$token = str_replace('Bearer ', '', $authHeader);

$decoded = JWT::decode($token);
if (!$decoded) {
    Response::send(401, ['error' => 'Unauthorized']);
    exit;
}

$userId = $decoded['data']->id;
$db = Database::getInstance()->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare("SELECT * FROM saved_places WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $places = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::send(200, ['status' => 'success', 'data' => $places]);
    }
    catch (Exception $e) {
        Response::send(500, ['status' => 'error', 'message' => $e->getMessage()]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['name']) || !isset($data['address'])) {
        Response::send(400, ['status' => 'error', 'message' => 'Name and address are required']);
        exit;
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

        // Fetch the newly created place
        $stmt = $db->prepare("SELECT * FROM saved_places WHERE id = ?");
        $stmt->execute([$placeId]);
        $newPlace = $stmt->fetch(PDO::FETCH_ASSOC);

        Response::send(201, ['status' => 'success', 'data' => $newPlace]);
    }
    catch (Exception $e) {
        Response::send(500, ['status' => 'error', 'message' => $e->getMessage()]);
    }
}
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Support passing ID via query param or body
    $placeId = isset($_GET['id']) ? $_GET['id'] : (isset($data['id']) ? $data['id'] : null);

    if (!$placeId) {
        Response::send(400, ['status' => 'error', 'message' => 'Place ID is required']);
        exit;
    }

    try {
        $stmt = $db->prepare("DELETE FROM saved_places WHERE id = ? AND user_id = ?");
        $stmt->execute([$placeId, $userId]);

        if ($stmt->rowCount() > 0) {
            Response::send(200, ['status' => 'success', 'message' => 'Place deleted successfully']);
        }
        else {
            Response::send(404, ['status' => 'error', 'message' => 'Place not found or access denied']);
        }
    }
    catch (Exception $e) {
        Response::send(500, ['status' => 'error', 'message' => $e->getMessage()]);
    }
}
else {
    Response::send(405, ['status' => 'error', 'message' => 'Method not allowed']);
}
