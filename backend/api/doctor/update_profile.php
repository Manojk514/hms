<?php
/**
 * Update Doctor Profile API
 * Endpoint: POST /backend/api/doctor/update_profile.php
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

// Include database connection
$conn = require_once '../../config/db_connect.php';

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

// Validate required field: doctor_code
if (!isset($data['doctor_code']) || empty(trim($data['doctor_code']))) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'doctor_code is required'
    ]);
    $conn->close();
    exit();
}

$doctor_code = trim($data['doctor_code']);

// Check if doctor exists
try {
    $checkSql = "SELECT id FROM doctors WHERE doctor_code = ? LIMIT 1";
    $checkStmt = $conn->prepare($checkSql);
    
    if (!$checkStmt) {
        throw new Exception("Failed to prepare check statement: " . $conn->error);
    }
    
    $checkStmt->bind_param("s", $doctor_code);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Doctor with code ' . htmlspecialchars($doctor_code) . ' not found'
        ]);
        $checkStmt->close();
        $conn->close();
        exit();
    }
    
    $checkStmt->close();
    
} catch (Exception $e) {
    error_log("Check Doctor Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error occurred'
    ]);
    $conn->close();
    exit();
}

// Build dynamic UPDATE query based on provided fields
$updateFields = [];
$params = [];
$types = '';

// Updatable fields
$allowedFields = [
    'doctor_name' => 's',
    'specialization_id' => 'i',
    'qualification' => 's',
    'experience' => 'i',
    'license_number' => 's',
    'email' => 's',
    'phone' => 's',
    'emergency_contact' => 's',
    'address' => 's'
];

foreach ($allowedFields as $field => $type) {
    if (isset($data[$field])) {
        // Validate email format if email field is being updated
        if ($field === 'email' && !empty($data[$field])) {
            if (!filter_var($data[$field], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Invalid email format'
                ]);
                $conn->close();
                exit();
            }
        }
        
        // Validate experience is a positive number
        if ($field === 'experience' && isset($data[$field])) {
            if (!is_numeric($data[$field]) || $data[$field] < 0) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Experience must be a positive number'
                ]);
                $conn->close();
                exit();
            }
        }

        if ($field === 'specialization_id' && isset($data[$field])) {
            if (!is_numeric($data[$field]) || (int)$data[$field] <= 0) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Invalid specialization selected'
                ]);
                $conn->close();
                exit();
            }
        }
        
        // Validate phone number (basic validation)
        if (($field === 'phone' || $field === 'emergency_contact') && !empty($data[$field])) {
            if (!preg_match('/^[0-9+\-\s()]{10,15}$/', $data[$field])) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Invalid phone number format'
                ]);
                $conn->close();
                exit();
            }
        }
        
        $updateFields[] = "$field = ?";
        $params[] = $data[$field];
        $types .= $type;
    }
}

// Check if at least one field is being updated
if (empty($updateFields)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'No fields to update. Provide at least one field to update.'
    ]);
    $conn->close();
    exit();
}

// Add doctor_code to params for WHERE clause
$params[] = $doctor_code;
$types .= 's';

// Build and execute UPDATE query
try {
    $sql = "UPDATE doctors SET " . implode(', ', $updateFields) . " WHERE doctor_code = ?";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Failed to prepare update statement: " . $conn->error);
    }
    
    // Bind parameters dynamically
    $stmt->bind_param($types, ...$params);
    
    // Execute update
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute update: " . $stmt->error);
    }
    
    // Check if any rows were affected
    if ($stmt->affected_rows === 0) {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'No changes made. Data is already up to date.'
        ]);
    } else {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'message' => 'Doctor profile updated successfully',
            'updated_fields' => count($updateFields)
        ]);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    error_log("Update Doctor Profile Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'An error occurred while updating doctor profile'
    ]);
}

// Close connection
$conn->close();
