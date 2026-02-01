<?php
/**
 * Crew Authentication API
 * Endpoints: register, login, verify-otp
 */

require_once __DIR__ . '/../../includes/Database.php';
require_once __DIR__ . '/../../includes/JWT.php';
require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/../../includes/Validator.php';
require_once __DIR__ . '/../../includes/OTP.php';

$db = Database::getInstance()->getConnection();

// Support both query param (?action=) and path-based (/auth/crew/login) routing
$action = $_GET['action'] ?? '';
if (empty($action)) {
    $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('/\/auth\/crew\/([\w-]+)/', $requestUri, $matches)) {
        $action = $matches[1];
    }
}

switch ($action) {
    case 'register':
        handleRegister($db);
        break;
    case 'login':
        handleLogin($db);
        break;
    case 'verify-otp':
        handleVerifyOTP($db);
        break;
    case 'resend-otp':
        handleResendOTP($db);
        break;
    default:
        Response::error('Invalid action', 400);
}

/**
 * Handle crew registration
 */
function handleRegister(PDO $db): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::methodNotAllowed();
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $validator = new Validator($data);
    $validator->required(['full_name', 'email', 'password', 'nic', 'bus_id'])
              ->email('email')
              ->minLength('full_name', 3)
              ->minLength('password', 6)
              ->minLength('nic', 9);

    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    // Check if email already exists
    $stmt = $db->prepare("SELECT id FROM crew WHERE email = ?");
    $stmt->execute([$validator->get('email')]);
    if ($stmt->fetch()) {
        Response::error('Email already registered', 409);
    }

    // Check if NIC already exists
    $stmt = $db->prepare("SELECT id FROM crew WHERE nic = ?");
    $stmt->execute([$validator->get('nic')]);
    if ($stmt->fetch()) {
        Response::error('NIC already registered', 409);
    }

    // Verify bus exists
    $stmt = $db->prepare("SELECT id FROM buses WHERE bus_number = ? OR id = ?");
    $stmt->execute([$validator->get('bus_id'), $validator->get('bus_id')]);
    $bus = $stmt->fetch();
    if (!$bus) {
        Response::error('Invalid bus ID', 400);
    }

    // Generate OTP
    $otp = OTP::generate();
    $otpExpiry = OTP::getExpiry();

    // Hash password
    $hashedPassword = password_hash($validator->get('password'), PASSWORD_DEFAULT);

    // Insert crew member - AUTO-VERIFIED FOR DEVELOPMENT
    $stmt = $db->prepare("
        INSERT INTO crew (full_name, email, password, nic, assigned_bus_id, otp_code, otp_expires_at, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
    ");
    $stmt->execute([
        $validator->get('full_name'),
        $validator->get('email'),
        $hashedPassword,
        $validator->get('nic'),
        $bus['id'],
        $otp,
        $otpExpiry
    ]);

    $crewId = $db->lastInsertId();

    // Send OTP email (still log for reference)
    OTP::sendEmail($validator->get('email'), $otp);

    // DEV MODE: Auto-generate token since crew is auto-verified
    $token = JWT::generate([
        'user_id' => $crewId,
        'user_type' => 'crew',
        'email' => $validator->get('email'),
        'bus_id' => $bus['id']
    ]);

    Response::success([
        'crew_id' => (int)$crewId,
        'email' => $validator->get('email'),
        'token' => $token,
        'requires_verification' => false
    ], 'Registration successful. You are now logged in.', 201);
}

/**
 * Handle crew login
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

    // Find crew member with bus info
    $stmt = $db->prepare("
        SELECT c.*, b.bus_number, b.route_id, r.route_name
        FROM crew c
        LEFT JOIN buses b ON c.assigned_bus_id = b.id
        LEFT JOIN routes r ON b.route_id = r.id
        WHERE c.email = ?
    ");
    $stmt->execute([$validator->get('email')]);
    $crew = $stmt->fetch();

    if (!$crew || !password_verify($validator->get('password'), $crew['password'])) {
        Response::error('Invalid email or password', 401);
    }

    // DEV MODE: Skip verification check (comment out this block to enable OTP)
    /*
    if (!$crew['is_verified']) {
        // Generate new OTP
        $otp = OTP::generate();
        $otpExpiry = OTP::getExpiry();

        $stmt = $db->prepare("UPDATE crew SET otp_code = ?, otp_expires_at = ? WHERE id = ?");
        $stmt->execute([$otp, $otpExpiry, $crew['id']]);

        OTP::sendEmail($crew['email'], $otp);

        Response::success([
            'crew_id' => (int)$crew['id'],
            'email' => $crew['email'],
            'requires_verification' => true
        ], 'Please verify your email first');
    }
    */

    if (!$crew['is_active']) {
        Response::error('Your account has been deactivated. Contact admin.', 403);
    }

    // Generate JWT token
    $token = JWT::generate([
        'user_id' => $crew['id'],
        'user_type' => 'crew',
        'email' => $crew['email'],
        'bus_id' => $crew['assigned_bus_id']
    ]);

    // Save session
    $stmt = $db->prepare("
        INSERT INTO user_sessions (user_type, user_id, token, expires_at)
        VALUES ('crew', ?, ?, ?)
    ");
    $stmt->execute([
        $crew['id'],
        $token,
        date('Y-m-d H:i:s', time() + JWT_EXPIRY)
    ]);

    Response::success([
        'token' => $token,
        'crew' => [
            'id' => (int)$crew['id'],
            'full_name' => $crew['full_name'],
            'email' => $crew['email'],
            'nic' => $crew['nic'],
            'bus' => [
                'id' => (int)$crew['assigned_bus_id'],
                'bus_number' => $crew['bus_number'],
                'route_name' => $crew['route_name']
            ]
        ]
    ], 'Login successful');
}

/**
 * Handle OTP verification
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

    // Find crew member
    $stmt = $db->prepare("
        SELECT c.*, b.bus_number, r.route_name
        FROM crew c
        LEFT JOIN buses b ON c.assigned_bus_id = b.id
        LEFT JOIN routes r ON b.route_id = r.id
        WHERE c.email = ?
    ");
    $stmt->execute([$validator->get('email')]);
    $crew = $stmt->fetch();

    if (!$crew) {
        Response::error('Crew member not found', 404);
    }

    // Verify OTP
    if (!OTP::verify($validator->get('otp'), $crew['otp_code'], $crew['otp_expires_at'])) {
        Response::error('Invalid or expired OTP', 400);
    }

    // Mark as verified
    $stmt = $db->prepare("
        UPDATE crew
        SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL
        WHERE id = ?
    ");
    $stmt->execute([$crew['id']]);

    // Generate JWT token
    $token = JWT::generate([
        'user_id' => $crew['id'],
        'user_type' => 'crew',
        'email' => $crew['email'],
        'bus_id' => $crew['assigned_bus_id']
    ]);

    // Save session
    $stmt = $db->prepare("
        INSERT INTO user_sessions (user_type, user_id, token, expires_at)
        VALUES ('crew', ?, ?, ?)
    ");
    $stmt->execute([
        $crew['id'],
        $token,
        date('Y-m-d H:i:s', time() + JWT_EXPIRY)
    ]);

    Response::success([
        'token' => $token,
        'crew' => [
            'id' => (int)$crew['id'],
            'full_name' => $crew['full_name'],
            'email' => $crew['email'],
            'bus' => [
                'id' => (int)$crew['assigned_bus_id'],
                'bus_number' => $crew['bus_number'],
                'route_name' => $crew['route_name']
            ]
        ]
    ], 'Email verified successfully');
}

/**
 * Handle OTP resend
 */
function handleResendOTP(PDO $db): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::methodNotAllowed();
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $validator = new Validator($data);
    $validator->required(['email'])
              ->email('email');

    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    // Find crew member
    $stmt = $db->prepare("SELECT * FROM crew WHERE email = ?");
    $stmt->execute([$validator->get('email')]);
    $crew = $stmt->fetch();

    if (!$crew) {
        Response::error('Crew member not found', 404);
    }

    // Generate new OTP
    $otp = OTP::generate();
    $otpExpiry = OTP::getExpiry();

    $stmt = $db->prepare("UPDATE crew SET otp_code = ?, otp_expires_at = ? WHERE id = ?");
    $stmt->execute([$otp, $otpExpiry, $crew['id']]);

    OTP::sendEmail($crew['email'], $otp);

    Response::success([
        'email' => $crew['email']
    ], 'OTP sent successfully');
}
