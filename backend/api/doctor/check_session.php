<?php
/**
 * Check Doctor Session API
 * Endpoint: GET /backend/api/doctor/check_session.php
 */

// Start session
session_start();

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Check if doctor is logged in
    if (isset($_SESSION['doctor_logged_in']) && $_SESSION['doctor_logged_in'] === true) {
        
        // Check session timeout (optional - 2 hours)
        $sessionTimeout = 7200; // 2 hours in seconds
        if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time']) > $sessionTimeout) {
            // Session expired
            session_destroy();
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'logged_in' => false,
                'message' => 'Session expired. Please login again.'
            ]);
            exit();
        }
        
        // Session is valid
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'logged_in' => true,
            'data' => [
                'doctor_id' => $_SESSION['doctor_id'] ?? null,
                'doctor_code' => $_SESSION['doctor_code'] ?? null,
                'doctor_name' => $_SESSION['doctor_name'] ?? null,
                'doctor_email' => $_SESSION['doctor_email'] ?? null,
                'session_duration' => isset($_SESSION['login_time']) ? (time() - $_SESSION['login_time']) : 0
            ]
        ]);
        
    } else {
        // Not logged in
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'logged_in' => false,
            'message' => 'Not logged in'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Session Check Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'logged_in' => false,
        'message' => 'An error occurred while checking session'
    ]);
}
