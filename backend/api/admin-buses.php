<?php
/**
 * Admin Bus Management API
 */

require_once __DIR__ . '/../../includes/Database.php';
require_once __DIR__ . '/../../includes/JWT.php';
require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/../../includes/Validator.php';

$db = Database::getInstance()->getConnection();

// Verify Admin Auth
$authUser = JWT::requireAuth();
if ($authUser['user_type'] !== 'admin') {
    Response::forbidden();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetBuses($db);
        break;
    case 'POST':
        handleCreateBus($db);
        break;
    case 'PUT':
        handleUpdateBus($db);
        break;
    case 'DELETE':
        handleDeleteBus($db);
        break;
    default:
        Response::methodNotAllowed();
}

function handleGetBuses(PDO $db): void {
    try {
        $stmt = $db->query("
            SELECT b.*, r.route_number, r.route_name 
            FROM buses b 
            LEFT JOIN routes r ON b.route_id = r.id 
            ORDER BY b.created_at DESC
        ");
        $buses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($buses);
    } catch (Exception $e) {
        Response::error('Failed to fetch buses: ' . $e->getMessage(), 500);
    }
}

function handleCreateBus(PDO $db): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $validator = new Validator($data);
    $validator->required(['plate_number', 'capacity'])
              ->maxLength('plate_number', 20);

    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO buses (plate_number, route_id, capacity, status)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['plate_number'],
            $data['route_id'] ?? null,
            $data['capacity'],
            $data['status'] ?? 'active'
        ]);
        
        Response::success(['id' => $db->lastInsertId()], 'Bus created successfully', 201);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            Response::error('Bus with this plate number already exists', 409);
        }
        Response::error('Failed to create bus: ' . $e->getMessage(), 500);
    }
}

function handleUpdateBus(PDO $db): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    if (!isset($data['id'])) {
        Response::error('Bus ID is required', 400);
    }

    try {
        $fields = [];
        $params = [];

        if (isset($data['plate_number'])) {
            $fields[] = "plate_number = ?";
            $params[] = $data['plate_number'];
        }
        if (isset($data['route_id'])) {
            $fields[] = "route_id = ?";
            $params[] = $data['route_id'];
        }
        if (isset($data['capacity'])) {
            $fields[] = "capacity = ?";
            $params[] = $data['capacity'];
        }
        if (isset($data['status'])) {
            $fields[] = "status = ?";
            $params[] = $data['status'];
        }

        if (empty($fields)) {
            Response::error('No fields to update', 400);
        }

        $params[] = $data['id'];
        $sql = "UPDATE buses SET " . implode(', ', $fields) . " WHERE id = ?";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            // Check if bus exists
            $check = $db->prepare("SELECT id FROM buses WHERE id = ?");
            $check->execute([$data['id']]);
            if (!$check->fetch()) {
                Response::error('Bus not found', 404);
            }
            // If exists but no rows affected, it means no changes were made
        }

        Response::success(null, 'Bus updated successfully');
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            Response::error('Bus plate number already in use', 409);
        }
        Response::error('Failed to update bus: ' . $e->getMessage(), 500);
    }
}

function handleDeleteBus(PDO $db): void {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        Response::error('Bus ID is required', 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM buses WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            Response::error('Bus not found', 404);
        }

        Response::success(null, 'Bus deleted successfully');
    } catch (Exception $e) {
        Response::error('Failed to delete bus: ' . $e->getMessage(), 500);
    }
}
