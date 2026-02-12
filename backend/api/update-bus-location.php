<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Response.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->bus_id) ||
    !isset($data->latitude) ||
    !isset($data->longitude)
) {
    Response::error("Incomplete data. bus_id, latitude, and longitude are required.", 400);
}

// Optional: Verify Crew Token here (skipped for MVP simplicity, relying on frontend to send valid bus_id)
// In production, extract user_id from token, check if user is crew assigned to this bus.

try {
    $db = Database::getInstance()->getConnection();

    $query = "UPDATE buses SET 
                latitude = :lat, 
                longitude = :lng, 
                heading = :heading,
                last_updated = NOW()";

    $params = [
        ':lat' => $data->latitude,
        ':lng' => $data->longitude,
        ':heading' => isset($data->heading) ? $data->heading : 0,
        ':bus_id' => $data->bus_id
    ];

    if (isset($data->current_passengers)) {
        $query .= ", current_passengers = :passengers";
        $params[':passengers'] = $data->current_passengers;
    }

    $query .= " WHERE id = :bus_id";

    $stmt = $db->prepare($query);

    if ($stmt->execute($params)) {
        if ($stmt->rowCount() > 0) {
            Response::success(null, "Bus location updated.");
        } else {
            // Bus ID might be wrong or no change
            // Check if bus exists
            $check = $db->prepare("SELECT id FROM buses WHERE id = ?");
            $check->execute([$data->bus_id]);
            if ($check->rowCount() > 0) {
                Response::success(null, "Bus location updated (no change in values).");
            } else {
                Response::error("Bus not found.", 404);
            }
        }
    } else {
        Response::error("Unable to update bus location.", 500);
    }
} catch (Exception $e) {
    Response::error("Database error: " . $e->getMessage(), 500);
}
