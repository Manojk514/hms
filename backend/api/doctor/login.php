<?php
/**
 * Doctor Login API
 * Endpoint: POST /backend/api/doctor/login.php
 */

// Start session
session_start();

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php_errors.log');

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
        'success' => false,
        'message' => 'Method not allowed. Use POST request.'
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
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit();
}

// Get POST data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Log the incoming request for debugging
error_log("Login attempt - Input: " . $input);

// Validate JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON format'
    ]);
    $conn->close();
    exit();
}

// Get credentials - accept both 'email' and 'email_or_code'
$email_or_code = isset($data['email_or_code']) ? trim($data['email_or_code']) : (isset($data['email']) ? trim($data['email']) : '');
$password = isset($data['password']) ? $data['password'] : '';

// Validate required fields
if (empty($email_or_code)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email or Doctor Code is required'
    ]);
    $conn->close();
    exit();
}

if (empty($password)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Password is required'
    ]);
    $conn->close();
    exit();
}

try {
    // Query to find doctor by email OR doctor_code
    $sql = "SELECT 
                id,
                doctor_code,
                doctor_name,
                email,
                password
            FROM doctors 
            WHERE email = ? OR doctor_code = ?
            LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }
    
    $stmt->bind_param("ss", $email_or_code, $email_or_code);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute query: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    // Check if doctor exists
    if ($result->num_rows === 0) {
        error_log("Login failed - Doctor not found: " . $email_or_code);
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid credentials'
        ]);
        $stmt->close();
        $conn->close();
        exit();
    }
    
    $doctor = $result->fetch_assoc();
    $stmt->close();
    
    error_log("Doctor found: " . $doctor['doctor_code'] . " - Checking password");
    
    // SECURITY: Verify password using ONLY password_verify() - NO plain text comparison
    $passwordValid = password_verify($password, $doctor['password']);
    error_log("Password verification result: " . ($passwordValid ? 'SUCCESS' : 'FAILED'));
    
    if (!$passwordValid) {
        error_log("Login failed - Invalid password for: " . $email_or_code);
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid credentials'
        ]);
        $conn->close();
        exit();
    }
    
    // Login successful - Create session
    $_SESSION['doctor_logged_in'] = true;
    $_SESSION['doctor_id'] = $doctor['id'];
    $_SESSION['doctor_code'] = $doctor['doctor_code'];
    $_SESSION['doctor_name'] = $doctor['doctor_name'];
    $_SESSION['doctor_email'] = $doctor['email'];
    $_SESSION['login_time'] = time();
    
    error_log("Login successful for: " . $doctor['doctor_code']);
    
    // Update last login time (optional - only if column exists)
    // Check if last_login column exists first
    $checkColumn = $conn->query("SHOW COLUMNS FROM doctors LIKE 'last_login'");
    if ($checkColumn && $checkColumn->num_rows > 0) {
        $updateSql = "UPDATE doctors SET last_login = NOW() WHERE id = ?";
        $updateStmt = $conn->prepare($updateSql);
        if ($updateStmt) {
            $updateStmt->bind_param("i", $doctor['id']);
            $updateStmt->execute();
            $updateStmt->close();
        }
    }
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'doctor_id' => $doctor['id'],
            'doctor_code' => $doctor['doctor_code'],
            'doctor_name' => $doctor['doctor_name'],
            'email' => $doctor['email'],
            'session_id' => session_id()
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Login Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred during login. Please try again.',
        'debug' => $e->getMessage()
    ]);
}

$conn->close();
