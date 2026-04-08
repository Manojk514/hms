<?php
/**
 * Test Database Connection
 * Access: http://localhost/HMS/backend/test_connection.php
 */

header('Content-Type: application/json');

// Include database connection
$conn = require_once 'config/db_connect.php';

// If we reach here, connection was successful
echo json_encode([
    'success' => true,
    'message' => 'Database connected successfully',
    'database' => 'hms',
    'host' => 'localhost',
    'charset' => $conn->character_set_name()
]);

$conn->close();
