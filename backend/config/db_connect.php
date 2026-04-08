<?php
/**
 * Database Connection File
 * HMS Project - XAMPP Configuration
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'hms');

// Create connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if ($conn->connect_error) {
    // Log error for debugging
    error_log("Database Connection Failed: " . $conn->connect_error);
    
    // Return JSON error response
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'DB_CONNECTION_ERROR',
            'message' => 'Database connection failed. Please try again later.'
        ]
    ]);
    exit();
}

// Set charset to utf8mb4 for proper character support
$conn->set_charset("utf8mb4");

// Optional: Set timezone
date_default_timezone_set('Asia/Kolkata');

// Return connection for use in other files
return $conn;
