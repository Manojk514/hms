<?php
/**
 * Direct Login Test Script
 * Tests login functionality without frontend
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Direct Login Test</h2>";

// Include database connection
$conn = require_once 'backend/config/db_connect.php';

echo "<h3>1. Database Connection</h3>";
echo "✅ Connected to database: " . DB_NAME . "<br><br>";

// Test credentials
$test_credentials = [
    ['email' => 'manoj123@hospital.com', 'password' => 'doctor123'],
    ['doctor_code' => 'DOC001', 'password' => 'doctor123'],
    ['email' => 'priya.patel@hospital.com', 'password' => 'doctor123'],
    ['doctor_code' => 'DOC002', 'password' => 'doctor123']
];

echo "<h3>2. Testing Login Credentials</h3>";

foreach ($test_credentials as $cred) {
    $identifier = isset($cred['email']) ? $cred['email'] : $cred['doctor_code'];
    $password = $cred['password'];
    
    echo "<div style='border: 1px solid #ccc; padding: 10px; margin: 10px 0;'>";
    echo "<strong>Testing: $identifier</strong><br>";
    
    // Query database
    $sql = "SELECT id, doctor_code, doctor_name, email, password 
            FROM doctors 
            WHERE email = ? OR doctor_code = ? 
            LIMIT 1";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $identifier, $identifier);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo "❌ Doctor not found in database<br>";
    } else {
        $doctor = $result->fetch_assoc();
        echo "✅ Doctor found: " . $doctor['doctor_name'] . " (" . $doctor['doctor_code'] . ")<br>";
        echo "Email: " . $doctor['email'] . "<br>";
        echo "Password in DB: " . substr($doctor['password'], 0, 20) . "...<br>";
        
        // Test password
        $passwordValid = false;
        if (substr($doctor['password'], 0, 4) === '$2y$') {
            $passwordValid = password_verify($password, $doctor['password']);
            echo "Password type: Hashed (bcrypt)<br>";
        } else {
            $passwordValid = ($password === $doctor['password']);
            echo "Password type: Plain text<br>";
        }
        
        if ($passwordValid) {
            echo "✅ <strong style='color: green;'>Password matches! Login would succeed.</strong><br>";
        } else {
            echo "❌ <strong style='color: red;'>Password does NOT match! Login would fail.</strong><br>";
        }
    }
    
    echo "</div>";
    $stmt->close();
}

echo "<h3>3. All Doctors in Database</h3>";
$sql = "SELECT id, doctor_code, doctor_name, email, 
        SUBSTRING(password, 1, 20) as pwd_preview 
        FROM doctors";
$result = $conn->query($sql);

echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
echo "<tr><th>ID</th><th>Code</th><th>Name</th><th>Email</th><th>Password Preview</th></tr>";

while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>" . $row['id'] . "</td>";
    echo "<td>" . $row['doctor_code'] . "</td>";
    echo "<td>" . $row['doctor_name'] . "</td>";
    echo "<td>" . $row['email'] . "</td>";
    echo "<td>" . $row['pwd_preview'] . "...</td>";
    echo "</tr>";
}

echo "</table>";

$conn->close();

echo "<br><h3>4. Test Login API</h3>";
echo "<p>Now test the actual login API at: <a href='backend/api/doctor/test_login.html' target='_blank'>backend/api/doctor/test_login.html</a></p>";
?>
