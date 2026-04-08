<?php
/**
 * Change Doctor Password API
 * Endpoint: POST /backend/api/doctor/change_password.php
 * 
 * SECURITY: Uses session authentication - doctor_id is NOT accepted from frontend
 */

// Start session
session_start();

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed. Use POST request.'
    ]);
    exit();
}

// SECURITY: Verify user is logged in via session
if (!isset($_SESSION['doctor_logged_in']) || !$_SESSION['doctor_logged_in']) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized. Please login first.'
    ]);
    exit();
}

// SECURITY: Get doctor_id from session (NOT from frontend)
$doctor_id = $_SESSION['doctor_id'];

if (empty($doctor_id)) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid session. Please login again.'
    ]);
    exit();
}

// Include database connection
try {
    $conn = require_once '../../config/db_connect.php';
} catch (Exception $e) {
    error_log("Database connection error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed'
    ]);
    exit();
}

// Get POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid JSON format'
    ]);
    $conn->close();
    exit();
}

// Validate required fields
$current_password = isset($data['current_password']) ? $data['current_password'] : '';
$new_password = isset($data['new_password']) ? $data['new_password'] : '';
$confirm_password = isset($data['confirm_password']) ? $data['confirm_password'] : '';

// Check all fields are provided
if (empty($current_password)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Current password is required'
    ]);
    $conn->close();
    exit();
}

if (empty($new_password)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'New password is required'
    ]);
    $conn->close();
    exit();
}

if (empty($confirm_password)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Confirm password is required'
    ]);
    $conn->close();
    exit();
}

// Validate new password matches confirm password
if ($new_password !== $confirm_password) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'New password and confirm password do not match'
    ]);
    $conn->close();
    exit();
}

// Validate new password strength (minimum 6 characters)
if (strlen($new_password) < 6) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'New password must be at least 6 characters long'
    ]);
    $conn->close();
    exit();
}

try {
    // SERVICE LOGIC: Fetch doctor record
    $sql = "SELECT id, doctor_code, password FROM doctors WHERE id = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }
    
    $stmt->bind_param("i", $doctor_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute query: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    // Check if doctor exists
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Doctor not found'
        ]);
        $stmt->close();
        $conn->close();
        exit();
    }
    
    $doctor = $result->fetch_assoc();
    $stmt->close();
    
    error_log("Password change attempt for doctor ID: " . $doctor_id);
    
    // SERVICE LOGIC: Verify current password using ONLY password_verify() - NO plain text comparison
    $passwordValid = password_verify($current_password, $doctor['password']);
    error_log("Current password verification result: " . ($passwordValid ? 'SUCCESS' : 'FAILED'));
    
    if (!$passwordValid) {
        error_log("Password change failed - incorrect current password for doctor ID: " . $doctor_id);
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Current password is incorrect'
        ]);
        $conn->close();
        exit();
    }
    
    // SERVICE LOGIC: Hash new password using bcrypt
    $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    
    error_log("New password hashed successfully for doctor ID: " . $doctor_id);
    
    // REPOSITORY LOGIC: Update password in database
    $updateSql = "UPDATE doctors SET password = ? WHERE id = ?";
    $updateStmt = $conn->prepare($updateSql);
    
    if (!$updateStmt) {
        throw new Exception("Failed to prepare update statement: " . $conn->error);
    }
    
    $updateStmt->bind_param("si", $new_password_hash, $doctor_id);
    
    if (!$updateStmt->execute()) {
        throw new Exception("Failed to execute update: " . $updateStmt->error);
    }
    
    if ($updateStmt->affected_rows === 0) {
        throw new Exception("No rows affected during password update");
    }
    
    $updateStmt->close();
    
    error_log("Password changed successfully for doctor ID: " . $doctor_id . " (" . $doctor['doctor_code'] . ")");
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Password updated successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Change Password Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'An error occurred while changing password. Please try again.'
    ]);
}

$conn->close();
