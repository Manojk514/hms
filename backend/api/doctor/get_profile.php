<?php
/**
 * Get Doctor Profile API
 * Endpoint: /backend/api/doctor/get_profile.php?doctor_code=DOC001
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Include database connection
$conn = require_once '../../config/db_connect.php';

// Check if doctor_code parameter is provided
if (!isset($_GET['doctor_code']) || empty(trim($_GET['doctor_code']))) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'MISSING_PARAMETER',
            'message' => 'doctor_code parameter is required'
        ]
    ]);
    $conn->close();
    exit();
}

$doctor_code = trim($_GET['doctor_code']);

try {
    // Prepare SQL statement to prevent SQL injection
    $sql = "SELECT 
                d.id,
                d.doctor_code,
                d.doctor_name,
                d.specialization_id,
                ds.specialization AS specialization_name,
                d.qualification,
                d.experience,
                d.license_number,
                d.email,
                d.phone,
                d.emergency_contact,
                d.address
            FROM doctors d
            LEFT JOIN doctorspecialization ds ON d.specialization_id = ds.id
            WHERE d.doctor_code = ? 
            LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }
    
    // Bind parameter
    $stmt->bind_param("s", $doctor_code);
    
    // Execute query
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute query: " . $stmt->error);
    }
    
    // Get result
    $result = $stmt->get_result();
    
    // Check if doctor exists
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 'DOCTOR_NOT_FOUND',
                'message' => 'Doctor with code ' . htmlspecialchars($doctor_code) . ' not found'
            ]
        ]);
        $stmt->close();
        $conn->close();
        exit();
    }
    
    // Fetch doctor data
    $doctor = $result->fetch_assoc();
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => (int)$doctor['id'],
            'doctor_code' => $doctor['doctor_code'],
            'doctor_name' => $doctor['doctor_name'],
            'specialization_id' => (int)$doctor['specialization_id'],
            'specialization_name' => $doctor['specialization_name'],
            'qualification' => $doctor['qualification'],
            'experience' => (int)$doctor['experience'],
            'license_number' => $doctor['license_number'],
            'email' => $doctor['email'],
            'phone' => $doctor['phone'],
            'emergency_contact' => $doctor['emergency_contact'],
            'address' => $doctor['address']
        ]
    ]);
    
    // Close statement
    $stmt->close();
    
} catch (Exception $e) {
    // Log error
    error_log("Get Doctor Profile Error: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'SERVER_ERROR',
            'message' => 'An error occurred while fetching doctor profile'
        ]
    ]);
}

// Close connection
$conn->close();
