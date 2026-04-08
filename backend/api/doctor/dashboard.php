<?php
/**
 * Doctor Dashboard API
 * Endpoint: GET /backend/api/doctor/dashboard.php
 * Returns dashboard statistics for a doctor
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

// Get doctor_code from session or GET parameter
$doctor_code = null;

// First check GET parameter
if (isset($_GET['doctor_code']) && !empty($_GET['doctor_code'])) {
    $doctor_code = trim($_GET['doctor_code']);
}
// Then check session
elseif (isset($_SESSION['doctor_code']) && !empty($_SESSION['doctor_code'])) {
    $doctor_code = $_SESSION['doctor_code'];
}

// Validate doctor_code
if (empty($doctor_code)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Doctor code is required. Please login or provide doctor_code parameter.'
    ]);
    $conn->close();
    exit();
}

try {
    // First, get doctor_id from doctor_code
    $doctorSql = "SELECT id, doctor_name FROM doctors WHERE doctor_code = ? LIMIT 1";
    $doctorStmt = $conn->prepare($doctorSql);
    
    if (!$doctorStmt) {
        throw new Exception("Failed to prepare doctor query: " . $conn->error);
    }
    
    $doctorStmt->bind_param("s", $doctor_code);
    $doctorStmt->execute();
    $doctorResult = $doctorStmt->get_result();
    
    if ($doctorResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Doctor not found'
        ]);
        $doctorStmt->close();
        $conn->close();
        exit();
    }
    
    $doctor = $doctorResult->fetch_assoc();
    $doctor_id = $doctor['id'];
    $doctor_name = $doctor['doctor_name'];
    $doctorStmt->close();
    
    // Initialize statistics
    $stats = [
        'todayAppointments' => 0,
        'completedConsultations' => 0,
        'pendingFollowups' => 0,
        'totalPatients' => 0
    ];
    
    // 1. Today's Appointments
    $todayAppointmentsSql = "SELECT COUNT(*) as count 
                             FROM appointment 
                             WHERE doctor_id = ? 
                             AND appointment_date = CURDATE()";
    
    $stmt1 = $conn->prepare($todayAppointmentsSql);
    if (!$stmt1) {
        throw new Exception("Failed to prepare today's appointments query: " . $conn->error);
    }
    
    $stmt1->bind_param("i", $doctor_id);
    $stmt1->execute();
    $result1 = $stmt1->get_result();
    $row1 = $result1->fetch_assoc();
    $stats['todayAppointments'] = (int)$row1['count'];
    $stmt1->close();
    
    // 2. Completed Consultations
    $completedConsultationsSql = "SELECT COUNT(*) as count 
                                  FROM consultations 
                                  WHERE doctor_id = ?";
    
    $stmt2 = $conn->prepare($completedConsultationsSql);
    if (!$stmt2) {
        throw new Exception("Failed to prepare consultations query: " . $conn->error);
    }
    
    $stmt2->bind_param("i", $doctor_id);
    $stmt2->execute();
    $result2 = $stmt2->get_result();
    $row2 = $result2->fetch_assoc();
    $stats['completedConsultations'] = (int)$row2['count'];
    $stmt2->close();
    
    // 3. Pending Followups
    // Note: followups table doesn't have doctor_id, so we join through consultations
    $pendingFollowupsSql = "SELECT COUNT(*) as count 
                            FROM followups f
                            INNER JOIN consultations c ON f.consultation_id = c.id
                            WHERE c.doctor_id = ?
                            AND f.followup_date >= CURDATE()";
    
    $stmt3 = $conn->prepare($pendingFollowupsSql);
    if (!$stmt3) {
        throw new Exception("Failed to prepare followups query: " . $conn->error);
    }
    
    $stmt3->bind_param("i", $doctor_id);
    $stmt3->execute();
    $result3 = $stmt3->get_result();
    $row3 = $result3->fetch_assoc();
    $stats['pendingFollowups'] = (int)$row3['count'];
    $stmt3->close();
    
    // 4. Total Assigned Patients
    $totalPatientsSql = "SELECT COUNT(DISTINCT patient_id) as count 
                         FROM appointment 
                         WHERE doctor_id = ?";
    
    $stmt4 = $conn->prepare($totalPatientsSql);
    if (!$stmt4) {
        throw new Exception("Failed to prepare patients query: " . $conn->error);
    }
    
    $stmt4->bind_param("i", $doctor_id);
    $stmt4->execute();
    $result4 = $stmt4->get_result();
    $row4 = $result4->fetch_assoc();
    $stats['totalPatients'] = (int)$row4['count'];
    $stmt4->close();
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'doctor_code' => $doctor_code,
            'doctor_name' => $doctor_name,
            'statistics' => $stats
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Dashboard Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while fetching dashboard data.',
        'error' => $e->getMessage()
    ]);
}

$conn->close();
