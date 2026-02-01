<?php
/**
 * User Authentication API
 * Endpoints: register, login, verify-otp, resend-otp
 */

require_once __DIR__ . '/../../includes/Database.php';
require_once __DIR__ . '/../../includes/JWT.php';
require_once __DIR__ . '/../../includes/Response.php';
require_once __DIR__ . '/../../includes/Validator.php';
require_once __DIR__ . '/../../includes/OTP.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Support both query param (?action=) and path-based (/auth/user/login) routing
$action = $_GET['action'] ?? '';
if (empty($action)) {
    $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (preg_match('/\/auth\/user\/([\w-]+)/', $requestUri, $matches)) {
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
    case 'forgot-password':
        handleForgotPassword($db);
        break;
    case 'reset-password':
        handleResetPassword($db);
        break;
    default:
        Response::error('Invalid action', 400);
}

/**
 * Handle user registration
 */
function handleRegister(PDO $db): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::methodNotAllowed();
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $validator = new Validator($data);
    $validator->required(['username', 'email', 'password'])
              ->email('email')
              ->minLength('username', 3)
              ->maxLength('username', 50)
              ->minLength('password', 6);

    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    // Check if email already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$validator->get('email')]);
    if ($stmt->fetch()) {
        Response::error('Email already registered', 409);
    }

    // Check if username already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$validator->get('username')]);
    if ($stmt->fetch()) {
        Response::error('Username already taken', 409);
    }

    // Generate OTP
    $otp = OTP::generate();
    $otpExpiry = OTP::getExpiry();

    // Hash password
    $hashedPassword = password_hash($validator->get('password'), PASSWORD_DEFAULT);

    // Insert user - AUTO-VERIFIED FOR DEVELOPMENT
    $stmt = $db->prepare("
        INSERT INTO users (username, email, password, otp_code, otp_expires_at, is_verified)
        VALUES (?, ?, ?, ?, ?, TRUE)
    ");
    $stmt->execute([
        $validator->get('username'),
        $validator->get('email'),
        $hashedPassword,
        $otp,
        $otpExpiry
    ]);

    $userId = $db->lastInsertId();

    // Send OTP email (still log it for reference)
    OTP::sendEmail($validator->get('email'), $otp);

    // DEV MODE: Auto-generate token since user is auto-verified
    $user = [
        'id' => (int)$userId,
        'username' => $validator->get('username'),
        'email' => $validator->get('email'),
        'is_verified' => true
    ];
    $token = JWT::generate($user);

    Response::success([
        'user_id' => (int)$userId,
        'email' => $validator->get('email'),
        'token' => $token,
        'user' => $user,
        'requires_verification' => false
    ], 'Registration successful. You are now logged in.', 201);
}

/**
 * Handle user login
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

    // Find user
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$validator->get('email')]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($validator->get('password'), $user['password'])) {
        Response::error('Invalid email or password', 401);
    }

    // DEV MODE: Skip verification check (comment out this block to enable OTP)
    /*
    if (!$user['is_verified']) {
        // Generate new OTP for unverified users
        $otp = OTP::generate();
        $otpExpiry = OTP::getExpiry();

        $stmt = $db->prepare("UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?");
        $stmt->execute([$otp, $otpExpiry, $user['id']]);

        OTP::sendEmail($user['email'], $otp);

        Response::success([
            'user_id' => (int)$user['id'],
            'email' => $user['email'],
            'requires_verification' => true
        ], 'Please verify your email first');
    }
    */

    // Generate JWT token
    $token = JWT::generate([
        'user_id' => $user['id'],
        'user_type' => 'user',
        'email' => $user['email'],
        'username' => $user['username']
    ]);

    // Save session
    $stmt = $db->prepare("
        INSERT INTO user_sessions (user_type, user_id, token, expires_at)
        VALUES ('user', ?, ?, ?)
    ");
    $stmt->execute([
        $user['id'],
        $token,
        date('Y-m-d H:i:s', time() + JWT_EXPIRY)
    ]);

    Response::success([
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'average_rating' => (float)$user['average_rating']
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

    // Find user
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$validator->get('email')]);
    $user = $stmt->fetch();

    if (!$user) {
        Response::error('User not found', 404);
    }

    // Verify OTP
    if (!OTP::verify($validator->get('otp'), $user['otp_code'], $user['otp_expires_at'])) {
        Response::error('Invalid or expired OTP', 400);
    }

    // Mark user as verified
    $stmt = $db->prepare("
        UPDATE users
        SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL
        WHERE id = ?
    ");
    $stmt->execute([$user['id']]);

    // Generate JWT token
    $token = JWT::generate([
        'user_id' => $user['id'],
        'user_type' => 'user',
        'email' => $user['email'],
        'username' => $user['username']
    ]);

    // Save session
    $stmt = $db->prepare("
        INSERT INTO user_sessions (user_type, user_id, token, expires_at)
        VALUES ('user', ?, ?, ?)
    ");
    $stmt->execute([
        $user['id'],
        $token,
        date('Y-m-d H:i:s', time() + JWT_EXPIRY)
    ]);

    Response::success([
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'full_name' => $user['full_name']
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

    // Find user
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$validator->get('email')]);
    $user = $stmt->fetch();

    if (!$user) {
        Response::error('User not found', 404);
    }

    // Generate new OTP
    $otp = OTP::generate();
    $otpExpiry = OTP::getExpiry();

    // Update OTP
    $stmt = $db->prepare("UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?");
    $stmt->execute([$otp, $otpExpiry, $user['id']]);

    // Send OTP
    OTP::sendEmail($user['email'], $otp);

    Response::success([
        'email' => $user['email']
    ], 'OTP sent successfully');
}

/**
 * Handle forgot password
 */
function handleForgotPassword(PDO $db): void {
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

    // Find user
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$validator->get('email')]);
    $user = $stmt->fetch();

    if (!$user) {
        // Don't reveal if user exists
        Response::success(null, 'If an account exists, a reset code has been sent');
    }

    // Generate OTP for reset
    $otp = OTP::generate();
    $otpExpiry = OTP::getExpiry();

    $stmt = $db->prepare("UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?");
    $stmt->execute([$otp, $otpExpiry, $user['id']]);

    OTP::sendEmail($user['email'], $otp);

    Response::success(null, 'If an account exists, a reset code has been sent');
}

/**
 * Handle password reset
 */
function handleResetPassword(PDO $db): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Response::methodNotAllowed();
    }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $validator = new Validator($data);
    $validator->required(['email', 'otp', 'new_password'])
              ->email('email')
              ->length('otp', 6)
              ->minLength('new_password', 6);

    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    // Find user
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$validator->get('email')]);
    $user = $stmt->fetch();

    if (!$user) {
        Response::error('User not found', 404);
    }

    // Verify OTP
    if (!OTP::verify($validator->get('otp'), $user['otp_code'], $user['otp_expires_at'])) {
        Response::error('Invalid or expired OTP', 400);
    }

    // Update password
    $hashedPassword = password_hash($validator->get('new_password'), PASSWORD_DEFAULT);
    $stmt = $db->prepare("
        UPDATE users
        SET password = ?, otp_code = NULL, otp_expires_at = NULL
        WHERE id = ?
    ");
    $stmt->execute([$hashedPassword, $user['id']]);

    Response::success(null, 'Password reset successful');
}
