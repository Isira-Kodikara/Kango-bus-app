<?php
/**
 * Admin Route Management API
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
        handleGetRoutes($db);
        break;
    case 'POST':
        handleCreateRoute($db);
        break;
    case 'PUT':
        handleUpdateRoute($db);
        break;
    case 'DELETE':
        handleDeleteRoute($db);
        break;
    default:
        Response::methodNotAllowed();
}

function handleGetRoutes(PDO $db): void {
    try {
        $stmt = $db->query("SELECT * FROM routes ORDER BY route_number ASC");
        $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($routes);
    } catch (Exception $e) {
        Response::error('Failed to fetch routes: ' . $e->getMessage(), 500);
    }
}

function handleCreateRoute(PDO $db): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $validator = new Validator($data);
    $validator->required(['route_number', 'start_point', 'end_point']);

    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO routes (route_number, route_name, start_point, end_point, avg_time_minutes, color)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $routeName = $data['route_name'] ?? ($data['start_point'] . ' - ' . $data['end_point']);
        
        $stmt->execute([
            $data['route_number'],
            $routeName,
            $data['start_point'],
            $data['end_point'],
            $data['avg_time_minutes'] ?? 0,
            $data['color'] ?? '#3b82f6'
        ]);
        
        Response::success(['id' => $db->lastInsertId()], 'Route created successfully', 201);
    } catch (Exception $e) {
        Response::error('Failed to create route: ' . $e->getMessage(), 500);
    }
}

function handleUpdateRoute(PDO $db): void {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    if (!isset($data['id'])) {
        Response::error('Route ID is required', 400);
    }

    try {
        $fields = [];
        $params = [];

        $allowedFields = ['route_number', 'route_name', 'start_point', 'end_point', 'avg_time_minutes', 'color', 'status'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (empty($fields)) {
            Response::error('No fields to update', 400);
        }

        $params[] = $data['id'];
        $sql = "UPDATE routes SET " . implode(', ', $fields) . " WHERE id = ?";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        Response::success(null, 'Route updated successfully');
    } catch (Exception $e) {
        Response::error('Failed to update route: ' . $e->getMessage(), 500);
    }
}

function handleDeleteRoute(PDO $db): void {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        Response::error('Route ID is required', 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM routes WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            Response::error('Route not found', 404);
        }

        Response::success(null, 'Route deleted successfully');
    } catch (Exception $e) {
        Response::error('Failed to delete route. It may have associated buses or trips.', 500);
    }
}
