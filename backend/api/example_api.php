<?php
/**
 * Example API File
 * Shows how to use db_connect.php
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in production

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Include database connection
$conn = require_once '../config/db_connect.php';

// Example: Get all doctors
try {
    $sql = "SELECT id, name, specialization FROM doctors WHERE status = 'active' LIMIT 10";
    $result = $conn->query($sql);
    
    if ($result) {
        $doctors = [];
        while ($row = $result->fetch_assoc()) {
            $doctors[] = $row;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $doctors
        ]);
    } else {
        throw new Exception($conn->error);
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'QUERY_ERROR',
            'message' => 'Failed to fetch data'
        ]
    ]);
}

// Close connection
$conn->close();
