<?php
/**
 * OTP Helper Class
 */

require_once __DIR__ . '/../config/config.php';

class OTP {

    /**
     * Generate a random OTP
     */
    public static function generate(?int $length = null): string {
        $length = $length ?? OTP_LENGTH;
        $otp = '';
        for ($i = 0; $i < $length; $i++) {
            $otp .= random_int(0, 9);
        }
        return $otp;
    }

    /**
     * Get expiry datetime
     */
    public static function getExpiry(): string {
        return date('Y-m-d H:i:s', strtotime('+' . OTP_EXPIRY_MINUTES . ' minutes'));
    }

    /**
     * Check if OTP is expired
     */
    public static function isExpired(string $expiryTime): bool {
        return strtotime($expiryTime) < time();
    }

    /**
     * Verify OTP
     */
    public static function verify(string $inputOtp, string $storedOtp, string $expiryTime): bool {
        if (self::isExpired($expiryTime)) {
            return false;
        }
        return hash_equals($storedOtp, $inputOtp);
    }

    /**
     * Send OTP via email (mock implementation)
     * In production, integrate with actual email service
     */
    public static function sendEmail(string $email, string $otp): bool {
        // Mock implementation - always returns true
        // In production, use PHPMailer or similar library

        // Example with PHPMailer:
        /*
        use PHPMailer\PHPMailer\PHPMailer;

        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = MAIL_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = MAIL_USERNAME;
        $mail->Password = MAIL_PASSWORD;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = MAIL_PORT;

        $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
        $mail->addAddress($email);

        $mail->isHTML(true);
        $mail->Subject = 'Your KANGO Verification Code';
        $mail->Body = "
            <h2>KANGO Bus Navigation</h2>
            <p>Your verification code is:</p>
            <h1 style='color: #3b82f6; font-size: 32px;'>$otp</h1>
            <p>This code will expire in " . OTP_EXPIRY_MINUTES . " minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
        ";

        return $mail->send();
        */

        // For development, log the OTP
        error_log("OTP for $email: $otp");

        return true;
    }

    /**
     * Send OTP via SMS (mock implementation)
     */
    public static function sendSMS(string $phone, string $otp): bool {
        // Mock implementation
        // In production, integrate with SMS gateway (Twilio, etc.)

        error_log("OTP for $phone: $otp");

        return true;
    }
}
