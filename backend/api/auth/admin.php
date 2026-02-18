<?php
/**
 * Admin Authentication API
 * Endpoints: login, verify-otp, confirm, register
 */

require_once __DIR__ . '/../../includes/Database.php';
require_once __DIR__ . '/../../includes/JWT.php';
require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/../../includes/Validator.php';
require_once __DIR__ . '/../../includes/OTP.php';

$db = Database::getInstance()->getConnection();

// Support both query param (?action=) and path-based (/auth/admin/login) routing
$action = $_GET['action'] ?? '';
if (empty($action)) {
    $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('/\/auth\/admin\/([\w-]+)/', $requestUri, $matches)) {
        $action = $matches[1];
    }
}

switch ($action) {
    case 'login':
        handleLogin($db);
        break;
    case 'verify-otp':
        handleVerifyOTP($db);
        break;
    case 'confirm':
        handleSecondaryConfirm($db);
        break;
    case 'register':
        handleRegister($db);
        break;
    case 'pending-crew':
        handleGetPendingCrew($db);
        break;
    case 'approve-crew':
        handleApproveCrew($db);
        break;
    case 'analytics':
        handleGetAnalytics($db);
        break;
    default:
        Response::error('Invalid action', 400);
}

/**
 * Get pending crew members (Admin only)
 */
function handleGetPendingCrew(PDO $db): void {
    $authUser = JWT::requireAuth();
    if ($authUser['user_type'] !== 'admin') {
        Response::forbidden();
    }

    $stmt = $db->query("
        SELECT id, full_name, email, nic, assigned_bus_id, created_at 
        FROM crew 
        WHERE is_active = FALSE 
        ORDER BY created_at DESC
    ");
    $pending = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::success($pending, 'Pending crew members retrieved');
}

/**
 * Get analytics data (Admin only)
 */
function handleGetAnalytics(PDO $db): void {
    $authUser = JWT::requireAuth();
    if ($authUser['user_type'] !== 'admin') {
        Response::forbidden();
    }

    try {
        // Total Trips
        $stmt = $db->query("SELECT COUNT(*) as count FROM trips");
        $totalTrips = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

        // Total Passengers (using trips count as proxy for now, or sum of passengers if available)
        // If we want total registered users:
        //$stmt = $db->query("SELECT COUNT(*) as count FROM users");
        //$totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Let's use trips as passengers for traffic
        $totalPassengers = $totalTrips;

        // Avg Rating
        $stmt = $db->query("SELECT AVG(rating) as avg FROM trips WHERE rating IS NOT NULL");
        $avgRating = $stmt->fetch(PDO::FETCH_ASSOC)['avg'];

        // Peak Hour
        $stmt = $db->query("
            SELECT HOUR(created_at) as hour, COUNT(*) as count 
            FROM trips 
            GROUP BY hour 
            ORDER BY count DESC 
            LIMIT 1
        ");
        $peakHourData = $stmt->fetch(PDO::FETCH_ASSOC);
        $peakHour = $peakHourData ? str_pad($peakHourData['hour'], 2, '0', STR_PAD_LEFT) . ':00' : '--';

        Response::success([
            'totalTrips' => (int)$totalTrips,
            'totalPassengers' => (int)$totalPassengers,
            'avgRating' => $avgRating ? round((float)$avgRating, 1) : 5.0,
            'peakHour' => $peakHour
        ], 'Analytics retrieved');
    } catch (Exception $e) {
        Response::error('Failed to calculate analytics: ' . $e->getMessage(), 500);
    }
}

/**
 * Approve a crew member (Admin only)
 */
function handleApproveCrew(PDO $db): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::methodNotAllowed();
    }

    $authUser = JWT::requireAuth();
    if ($authUser['user_type'] !== 'admin') {
        Response::forbidden();
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    if (!isset($data['crew_id'])) {
        Response::error('Crew ID is required', 400);
    }

    $stmt = $db->prepare("UPDATE crew SET is_active = TRUE WHERE id = ?");
    $stmt->execute([$data['crew_id']]);

    if ($stmt->rowCount() === 0) {
        Response::error('Crew member not found or already active', 404);
    }

    Response::success(null, 'Crew member approved successfully');
}

/**
 * Handle admin login (Step 1: Email & Password)
 */
function handleLogin(PDO $db): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::methodNotAllowed();
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $validator = new Validator($data);
    $validator->required(['email', 'password'])
              ->email('email');

    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    // Find admin
    $stmt = $db->prepare("SELECT * FROM admins WHERE email = ?");
    $stmt->execute([$validator->get('email')]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($validator->get('password'), $admin['password'])) {
        Response::error('Invalid email or password', 401);
    }

    // DEV MODE: Skip OTP verification - directly generate token
    $token = JWT::generate([
        'user_id' => $admin['id'],
        'user_type' => 'admin',
        'email' => $admin['email'],
        'is_super_admin' => (bool)$admin['is_super_admin']
    ]);

    // Update last login
    $stmt = $db->prepare("UPDATE admins SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$admin['id']]);

    Response::success([
        'admin_id' => (int)$admin['id'],
        'email' => $admin['email'],
        'full_name' => $admin['full_name'],
        'is_super_admin' => (bool)$admin['is_super_admin'],
        'token' => $token
    ], 'Login successful');

    /* ORIGINAL CODE - OTP VERIFICATION
    // Generate OTP for two-factor authentication
    $otp = OTP::generate();
    $otpExpiry = OTP::getExpiry();

    $stmt = $db->prepare("UPDATE admins SET otp_code = ?, otp_expires_at = ? WHERE id = ?");
    $stmt->execute([$otp, $otpExpiry, $admin['id']]);

    // Send OTP email
    OTP::sendEmail($admin['email'], $otp);

    Response::success([
        'admin_id' => (int)$admin['id'],
        'email' => $admin['email'],
        'step' => 'otp_verification'
    ], 'OTP sent to your email');
    */
}

/**
 * Handle OTP verification (Step 2)
 */
function handleVerifyOTP(PDO $db): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::methodNotAllowed();
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $validator = new Validator($data);
    $validator->required(['email', 'otp'])
              ->email('email')
              ->length('otp', 6);

    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    // Find admin
    $stmt = $db->prepare("SELECT * FROM admins WHERE email = ?");
    $stmt->execute([$validator->get('email')]);
    $admin = $stmt->fetch();

    if (!$admin) {
        Response::error('Admin not found', 404);
    }

    // Verify OTP
    if (!OTP::verify($validator->get('otp'), $admin['otp_code'], $admin['otp_expires_at'])) {
        Response::error('Invalid or expired OTP', 400);
    }

    // Generate secondary confirmation code
    $confirmCode = strtoupper(substr(md5(uniqid()), 0, 8));
    $confirmExpiry = date('Y-m-d H:i:s', strtotime('+5 minutes'));

    $stmt = $db->prepare("
        UPDATE admins
        SET otp_code = NULL, otp_expires_at = NULL, confirm_code = ?, confirm_expires_at = ?
        WHERE id = ?
    ");
    $stmt->execute([$confirmCode, $confirmExpiry, $admin['id']]);

    Response::success([
        'admin_id' => (int)$admin['id'],
        'email' => $admin['email'],
        'step' => 'secondary_confirmation',
        'confirm_code' => $confirmCode // In production, send this via a different channel
    ], 'OTP verified. Enter confirmation code.');
}

/**
 * Handle secondary confirmation (Step 3)
 */
function handleSecondaryConfirm(PDO $db): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::methodNotAllowed();
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $validator = new Validator($data);
    $validator->required(['email', 'confirm_code'])
              ->email('email');

    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    // Find admin
    $stmt = $db->prepare("SELECT * FROM admins WHERE email = ?");
    $stmt->execute([$validator->get('email')]);
    $admin = $stmt->fetch();

    if (!$admin) {
        Response::error('Admin not found', 404);
    }

    // Verify confirmation code
    if (!$admin['confirm_code'] ||
        strtoupper($validator->get('confirm_code')) !== $admin['confirm_code'] ||
        strtotime($admin['confirm_expires_at']) < time()) {
        Response::error('Invalid or expired confirmation code', 400);
    }

    // Clear confirmation code
    $stmt = $db->prepare("
        UPDATE admins
        SET confirm_code = NULL, confirm_expires_at = NULL, last_login = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$admin['id']]);

    // Generate JWT token
    $token = JWT::generate([
        'user_id' => $admin['id'],
        'user_type' => 'admin',
        'email' => $admin['email'],
        'is_super_admin' => (bool)$admin['is_super_admin']
    ]);

    // Save session
    $stmt = $db->prepare("
        INSERT INTO user_sessions (user_type, user_id, token, expires_at)
        VALUES ('admin', ?, ?, ?)
    ");
    $stmt->execute([
        $admin['id'],
        $token,
        date('Y-m-d H:i:s', time() + JWT_EXPIRY)
    ]);

    Response::success([
        'token' => $token,
        'admin' => [
            'id' => (int)$admin['id'],
            'email' => $admin['email'],
            'full_name' => $admin['full_name'],
            'is_super_admin' => (bool)$admin['is_super_admin']
        ]
    ], 'Login successful');
}

/**
 * Handle admin registration (only by super admin)
 */
function handleRegister(PDO $db): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::methodNotAllowed();
    }

    // Require authentication
    $authUser = JWT::requireAuth();

    // Only super admins can create new admins
    if ($authUser['user_type'] !== 'admin' || !$authUser['is_super_admin']) {
        Response::forbidden('Only super admins can create new admins');
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $validator = new Validator($data);
    $validator->required(['email', 'password', 'full_name'])
              ->email('email')
              ->minLength('password', 8)
              ->minLength('full_name', 3);

    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    // Check if email already exists
    $stmt = $db->prepare("SELECT id FROM admins WHERE email = ?");
    $stmt->execute([$validator->get('email')]);
    if ($stmt->fetch()) {
        Response::error('Email already registered', 409);
    }

    // Hash password
    $hashedPassword = password_hash($validator->get('password'), PASSWORD_DEFAULT);

    // Insert admin
    $stmt = $db->prepare("
        INSERT INTO admins (email, password, full_name, is_super_admin)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([
        $validator->get('email'),
        $hashedPassword,
        $validator->get('full_name'),
        $validator->get('is_super_admin', false) ? 1 : 0
    ]);

    $adminId = $db->lastInsertId();

    Response::success([
        'admin_id' => (int)$adminId,
        'email' => $validator->get('email'),
        'full_name' => $validator->get('full_name')
    ], 'Admin created successfully', 201);
}
