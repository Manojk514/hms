<?php
/**
 * Test Database Connection and Doctor Profile Update
 */

header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Database Connection & Update Test</h1>";
echo "<hr>";

// Test 1: Database Connection
echo "<h2>Test 1: Database Connection</h2>";
try {
    $conn = require_once '../../config/db_connect.php';
    echo "✅ <strong>SUCCESS:</strong> Database connected successfully<br>";
    echo "Connection Type: " . get_class($conn) . "<br>";
    echo "Character Set: " . $conn->character_set_name() . "<br>";
} catch (Exception $e) {
    echo "❌ <strong>ERROR:</strong> " . $e->getMessage() . "<br>";
    exit();
}

echo "<hr>";

// Test 2: Check if doctors table exists
echo "<h2>Test 2: Check Doctors Table</h2>";
$result = $conn->query("SHOW TABLES LIKE 'doctors'");
if ($result->num_rows > 0) {
    echo "✅ <strong>SUCCESS:</strong> 'doctors' table exists<br>";
} else {
    echo "❌ <strong>ERROR:</strong> 'doctors' table does NOT exist<br>";
    exit();
}

echo "<hr>";

// Test 3: Check table structure
echo "<h2>Test 3: Table Structure</h2>";
$result = $conn->query("DESCRIBE doctors");
echo "<table border='1' cellpadding='5' cellspacing='0'>";
echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>{$row['Field']}</td>";
    echo "<td>{$row['Type']}</td>";
    echo "<td>{$row['Null']}</td>";
    echo "<td>{$row['Key']}</td>";
    echo "<td>{$row['Default']}</td>";
    echo "</tr>";
}
echo "</table>";

echo "<hr>";

// Test 4: Check if DOC001 exists
echo "<h2>Test 4: Check if DOC001 Exists</h2>";
$stmt = $conn->prepare("SELECT * FROM doctors WHERE doctor_code = ?");
$doctorCode = 'DOC001';
$stmt->bind_param("s", $doctorCode);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $doctor = $result->fetch_assoc();
    echo "✅ <strong>SUCCESS:</strong> Doctor DOC001 found<br>";
    echo "<pre>";
    print_r($doctor);
    echo "</pre>";
} else {
    echo "❌ <strong>ERROR:</strong> Doctor DOC001 NOT found<br>";
    echo "<strong>Creating test doctor...</strong><br>";
    
    // Create test doctor
    $insertSql = "INSERT INTO doctors (doctor_code, doctor_name, email, password, specialization_id, qualification, experience, license_number, phone, address, status) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $insertStmt = $conn->prepare($insertSql);
    
    $name = "Dr. Test Doctor";
    $email = "doctor@hospital.com";
    $password = "password123";
    $specId = 5;
    $qual = "MBBS, MD";
    $exp = 10;
    $license = "MED12345";
    $phone = "9876543210";
    $address = "123 Test Street";
    $status = "active";
    
    $insertStmt->bind_param("ssssissssss", $doctorCode, $name, $email, $password, $specId, $qual, $exp, $license, $phone, $address, $status);
    
    if ($insertStmt->execute()) {
        echo "✅ Test doctor created successfully<br>";
    } else {
        echo "❌ Failed to create test doctor: " . $insertStmt->error . "<br>";
    }
    $insertStmt->close();
}
$stmt->close();

echo "<hr>";

// Test 5: Test UPDATE query
echo "<h2>Test 5: Test UPDATE Query</h2>";
$updateSql = "UPDATE doctors SET doctor_name = ?, qualification = ?, experience = ? WHERE doctor_code = ?";
$updateStmt = $conn->prepare($updateSql);

if (!$updateStmt) {
    echo "❌ <strong>ERROR:</strong> Failed to prepare statement: " . $conn->error . "<br>";
} else {
    $newName = "Dr. Updated Name " . date('H:i:s');
    $newQual = "MBBS, MD, Updated";
    $newExp = 15;
    
    $updateStmt->bind_param("ssis", $newName, $newQual, $newExp, $doctorCode);
    
    if ($updateStmt->execute()) {
        echo "✅ <strong>SUCCESS:</strong> Update executed<br>";
        echo "Affected Rows: " . $updateStmt->affected_rows . "<br>";
        
        if ($updateStmt->affected_rows > 0) {
            echo "✅ Database updated successfully<br>";
        } else {
            echo "⚠️ <strong>WARNING:</strong> No rows affected (data might be the same)<br>";
        }
    } else {
        echo "❌ <strong>ERROR:</strong> Update failed: " . $updateStmt->error . "<br>";
    }
    $updateStmt->close();
}

echo "<hr>";

// Test 6: Verify the update
echo "<h2>Test 6: Verify Update</h2>";
$verifyStmt = $conn->prepare("SELECT doctor_name, qualification, experience FROM doctors WHERE doctor_code = ?");
$verifyStmt->bind_param("s", $doctorCode);
$verifyStmt->execute();
$verifyResult = $verifyStmt->get_result();

if ($verifyResult->num_rows > 0) {
    $verifiedDoctor = $verifyResult->fetch_assoc();
    echo "✅ <strong>Current Data:</strong><br>";
    echo "<pre>";
    print_r($verifiedDoctor);
    echo "</pre>";
} else {
    echo "❌ <strong>ERROR:</strong> Could not verify update<br>";
}
$verifyStmt->close();

echo "<hr>";

// Test 7: Test the actual update_profile.php API
echo "<h2>Test 7: Test update_profile.php API</h2>";
echo "<form method='POST' action='update_profile.php' target='_blank'>";
echo "<input type='hidden' name='doctor_code' value='DOC001'>";
echo "<label>Doctor Name: <input type='text' name='doctor_name' value='Dr. API Test'></label><br><br>";
echo "<label>Qualification: <input type='text' name='qualification' value='MBBS, MD, API Test'></label><br><br>";
echo "<label>Experience: <input type='number' name='experience' value='20'></label><br><br>";
echo "<button type='submit'>Test API Update</button>";
echo "</form>";

echo "<hr>";

// Test 8: Check database configuration
echo "<h2>Test 8: Database Configuration</h2>";
echo "Database Name: " . $conn->query("SELECT DATABASE()")->fetch_row()[0] . "<br>";
echo "MySQL Version: " . $conn->server_info . "<br>";
echo "Connection Status: " . ($conn->ping() ? "Active" : "Inactive") . "<br>";

$conn->close();

echo "<hr>";
echo "<h2>✅ All Tests Completed</h2>";
echo "<p><a href='test_update_profile.html'>Go to Update Profile Test Page</a></p>";
?>

<style>
    body {
        font-family: Arial, sans-serif;
        padding: 20px;
        background: #f5f5f5;
    }
    h1 {
        color: #333;
        background: #667eea;
        color: white;
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
    table {
        background: white;
        border-collapse: collapse;
        width: 100%;
        margin: 10px 0;
    }
    th {
        background: #667eea;
        color: white;
        padding: 10px;
    }
    td {
        padding: 8px;
    }
    form {
        background: white;
        padding: 20px;
        border-radius: 5px;
        margin: 10px 0;
    }
    button {
        background: #667eea;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
    button:hover {
        background: #5568d3;
    }
</style>
