<?php
/**
 * Reset All Doctor Passwords to doctor123
 */

header('Content-Type: text/html; charset=utf-8');

$host = 'localhost';
$dbname = 'hms';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h1>Reset Doctor Passwords</h1>";
    echo "<hr>";
    
    // Set all doctors to password: doctor123
    $newPassword = 'doctor123';
    
    $sql = "UPDATE doctors SET password = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$newPassword]);
    
    echo "<p style='color: green; font-size: 18px;'><strong>✅ SUCCESS!</strong></p>";
    echo "<p>All doctor passwords have been set to: <strong>doctor123</strong></p>";
    echo "<p>Affected rows: " . $stmt->rowCount() . "</p>";
    
    echo "<hr>";
    echo "<h2>Updated Doctors:</h2>";
    
    // Show all doctors
    $result = $pdo->query("SELECT doctor_code, doctor_name, email FROM doctors");
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
    echo "<tr style='background: #667eea; color: white;'>";
    echo "<th>Doctor Code</th><th>Name</th><th>Email</th><th>Password</th>";
    echo "</tr>";
    
    while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr>";
        echo "<td><strong>" . htmlspecialchars($row['doctor_code']) . "</strong></td>";
        echo "<td>" . htmlspecialchars($row['doctor_name']) . "</td>";
        echo "<td>" . htmlspecialchars($row['email']) . "</td>";
        echo "<td><strong>doctor123</strong></td>";
        echo "</tr>";
    }
    
    echo "</table>";
    
    echo "<hr>";
    echo "<h2>✅ You can now login with:</h2>";
    echo "<ul style='font-size: 16px;'>";
    echo "<li><strong>Email:</strong> (any email from above) OR <strong>Doctor Code:</strong> (any code from above)</li>";
    echo "<li><strong>Password:</strong> doctor123</li>";
    echo "</ul>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'><strong>Error:</strong> " . $e->getMessage() . "</p>";
}
?>

<style>
    body {
        font-family: Arial, sans-serif;
        padding: 20px;
        background: #f5f5f5;
    }
    h1 {
        color: #667eea;
    }
    table {
        background: white;
        margin: 20px 0;
    }
    th, td {
        padding: 12px;
        text-align: left;
    }
</style>
