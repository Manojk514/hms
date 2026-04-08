<?php
/**
 * Today's Appointment Schedule API
 * Endpoint: GET /backend/api/doctor/today_schedule.php
 * Returns today's appointment schedule for a doctor
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
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use GET request.'
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

// Get doctor_id from GET parameter or session
$doctor_id = null;

if (isset($_GET['doctor_id']) && !empty($_GET['doctor_id'])) {
    $doctor_id = intval($_GET['doctor_id']);
} elseif (isset($_SESSION['doctor_id']) && !empty($_SESSION['doctor_id'])) {
    $doctor_id = intval($_SESSION['doctor_id']);
}

// Validate doctor_id
if (empty($doctor_id)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Doctor ID is required. Please login or provide doctor_id parameter.'
    ]);
    $conn->close();
    exit();
}

try {
    // Query today's appointments with patient details
    $sql = "SELECT 
                a.id,
                a.appointment_time,
                a.status,
                p.patient_name,
                p.gender,
                p.age,
                p.patient_phone,
                a.chief_complaint
            FROM appointment a
            JOIN tblpatient p ON a.patient_id = p.id
            WHERE a.doctor_id = ?
            AND a.appointment_date = CURDATE()
            ORDER BY a.appointment_time ASC";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }
    
    $stmt->bind_param("i", $doctor_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute query: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    // Build appointments array
    $appointments = [];
    
    while ($row = $result->fetch_assoc()) {
        // Format time to 12-hour format with AM/PM
        $time = date('h:i A', strtotime($row['appointment_time']));
        
        $appointments[] = [
            'id' => (int)$row['id'],
            'time' => $time,
            'patient' => $row['patient_name'] ?? 'N/A',
            'age' => (int)$row['age'] ?? 0,
            'gender' => $row['gender'] ?? 'N/A',
            'phone' => $row['patient_phone'] ?? 'N/A',
            'complaint' => $row['chief_complaint'] ?? 'N/A',
            'status' => $row['status'] ?? 'PENDING'
        ];
    }
    
    $stmt->close();
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'doctor_id' => $doctor_id,
            'date' => date('Y-m-d'),
            'count' => count($appointments),
            'appointments' => $appointments
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Today Schedule Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while fetching today\'s schedule.',
        'error' => $e->getMessage()
    ]);
}

$conn->close();
