<?php
/**
 * Debug Update Profile - Shows what's happening
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Debug Update Profile API</h1>";
echo "<hr>";

// Check request method
echo "<h2>1. Request Method</h2>";
echo "Method: " . $_SERVER['REQUEST_METHOD'] . "<br>";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo "⚠️ <strong>WARNING:</strong> This endpoint requires POST method<br>";
}

echo "<hr>";

// Check input data
echo "<h2>2. Input Data</h2>";
$input = file_get_contents('php://input');
echo "<strong>Raw Input:</strong><br>";
echo "<pre>" . htmlspecialchars($input) . "</pre>";

$data = json_decode($input, true);
echo "<strong>Decoded JSON:</strong><br>";
echo "<pre>";
print_r($data);
echo "</pre>";

if (json_last_error() !== JSON_ERROR_NONE) {
    echo "❌ <strong>JSON Error:</strong> " . json_last_error_msg() . "<br>";
}

echo "<hr>";

// Check database connection
echo "<h2>3. Database Connection</h2>";
try {
    $conn = require_once '../../config/db_connect.php';
    echo "✅ Database connected<br>";
} catch (Exception $e) {
    echo "❌ <strong>ERROR:</strong> " . $e->getMessage() . "<br>";
    exit();
}

echo "<hr>";

// Validate doctor_code
echo "<h2>4. Validate Doctor Code</h2>";
if (!isset($data['doctor_code']) || empty(trim($data['doctor_code']))) {
    echo "❌ <strong>ERROR:</strong> doctor_code is missing or empty<br>";
    exit();
}

$doctor_code = trim($data['doctor_code']);
echo "Doctor Code: " . htmlspecialchars($doctor_code) . "<br>";

// Check if doctor exists
$checkSql = "SELECT id, doctor_code, doctor_name FROM doctors WHERE doctor_code = ? LIMIT 1";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("s", $doctor_code);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows === 0) {
    echo "❌ <strong>ERROR:</strong> Doctor not found<br>";
    $checkStmt->close();
    exit();
} else {
    $existingDoctor = $checkResult->fetch_assoc();
    echo "✅ Doctor found: " . htmlspecialchars($existingDoctor['doctor_name']) . "<br>";
}
$checkStmt->close();

echo "<hr>";

// Build update query
echo "<h2>5. Build Update Query</h2>";
$updateFields = [];
$params = [];
$types = '';

$allowedFields = [
    'doctor_name' => 's',
    'qualification' => 's',
    'experience' => 'i',
    'license_number' => 's',
    'email' => 's',
    'phone' => 's',
    'address' => 's'
];

foreach ($allowedFields as $field => $type) {
    if (isset($data[$field])) {
        $updateFields[] = "$field = ?";
        $params[] = $data[$field];
        $types .= $type;
        echo "Field: <strong>$field</strong> = " . htmlspecialchars($data[$field]) . "<br>";
    }
}

if (empty($updateFields)) {
    echo "❌ <strong>ERROR:</strong> No fields to update<br>";
    exit();
}

$params[] = $doctor_code;
$types .= 's';

$sql = "UPDATE doctors SET " . implode(', ', $updateFields) . " WHERE doctor_code = ?";
echo "<br><strong>SQL Query:</strong><br>";
echo "<pre>" . htmlspecialchars($sql) . "</pre>";
echo "<strong>Parameters:</strong><br>";
echo "<pre>";
print_r($params);
echo "</pre>";
echo "<strong>Types:</strong> " . $types . "<br>";

echo "<hr>";

// Execute update
echo "<h2>6. Execute Update</h2>";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo "❌ <strong>ERROR:</strong> Failed to prepare statement: " . $conn->error . "<br>";
    exit();
}

$stmt->bind_param($types, ...$params);

if (!$stmt->execute()) {
    echo "❌ <strong>ERROR:</strong> Failed to execute: " . $stmt->error . "<br>";
    exit();
}

echo "✅ Query executed successfully<br>";
echo "Affected Rows: " . $stmt->affected_rows . "<br>";

if ($stmt->affected_rows === 0) {
    echo "⚠️ <strong>WARNING:</strong> No rows affected (data might be the same)<br>";
} else {
    echo "✅ <strong>SUCCESS:</strong> Database updated!<br>";
}

$stmt->close();

echo "<hr>";

// Verify update
echo "<h2>7. Verify Update</h2>";
$verifySql = "SELECT * FROM doctors WHERE doctor_code = ?";
$verifyStmt = $conn->prepare($verifySql);
$verifyStmt->bind_param("s", $doctor_code);
$verifyStmt->execute();
$verifyResult = $verifyStmt->get_result();

if ($verifyResult->num_rows > 0) {
    $updatedDoctor = $verifyResult->fetch_assoc();
    echo "<strong>Updated Doctor Data:</strong><br>";
    echo "<pre>";
    print_r($updatedDoctor);
    echo "</pre>";
}
$verifyStmt->close();

$conn->close();

echo "<hr>";
echo "<h2>✅ Debug Complete</h2>";
echo "<p><a href='test_update_profile.html'>Back to Test Page</a></p>";
?>

<style>
    body {
        font-family: Arial, sans-serif;
        padding: 20px;
        background: #f5f5f5;
    }
    h1 {
        color: white;
        background: #667eea;
        padding: 15px;
        border-radius: 5px;
    }
    h2 {
        color: #667eea;
        margin-top: 20px;
    }
    pre {
        background: #1e293b;
        color: #e2e8f0;
        padding: 15px;
        border-radius: 5px;
        overflow-x: auto;
    }
</style>
