<?php
/**
 * Get Doctor Specializations API
 * Endpoint: GET /backend/api/doctor/get_specializations.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use GET request.'
    ]);
    exit();
}

$conn = require_once '../../config/db_connect.php';

try {
    $sql = "SELECT id, specialization FROM doctorspecialization ORDER BY specialization ASC";
    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Failed to fetch specializations: " . $conn->error);
    }

    $specializations = [];

    while ($row = $result->fetch_assoc()) {
        $specializations[] = [
            'id' => (int)$row['id'],
            'name' => $row['specialization']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $specializations
    ]);
} catch (Exception $e) {
    error_log("Get Specializations Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load specializations'
    ]);
}

$conn->close();
