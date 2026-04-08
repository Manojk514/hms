<?php
/**
 * PASSWORD MIGRATION SCRIPT
 * 
 * This script converts ALL plain text passwords in the doctors table to bcrypt hashed passwords.
 * 
 * IMPORTANT: Run this script ONCE before deploying the secure password system.
 * 
 * WARNING: This script will modify the database. Make a backup first!
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Password Migration Script</h1>";
echo "<p><strong>WARNING:</strong> This will convert all plain text passwords to hashed format.</p>";
echo "<hr>";

// Include database connection
$conn = require_once 'backend/config/db_connect.php';

try {
    // Fetch all doctors
    $sql = "SELECT id, doctor_code, doctor_name, email, password FROM doctors";
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Failed to fetch doctors: " . $conn->error);
    }
    
    $total_doctors = $result->num_rows;
    $migrated_count = 0;
    $already_hashed_count = 0;
    $failed_count = 0;
    
    echo "<h2>Processing $total_doctors doctors...</h2>";
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>ID</th><th>Doctor Code</th><th>Name</th><th>Email</th><th>Status</th><th>Action</th>";
    echo "</tr>";
    
    while ($doctor = $result->fetch_assoc()) {
        $doctor_id = $doctor['id'];
        $doctor_code = $doctor['doctor_code'];
        $doctor_name = $doctor['doctor_name'];
        $email = $doctor['email'];
        $current_password = $doctor['password'];
        
        echo "<tr>";
        echo "<td>{$doctor_id}</td>";
        echo "<td>{$doctor_code}</td>";
        echo "<td>{$doctor_name}</td>";
        echo "<td>{$email}</td>";
        
        // Check if password is already hashed
        if (substr($current_password, 0, 4) === '$2y$') {
            echo "<td style='color: blue;'>Already Hashed</td>";
            echo "<td>No action needed</td>";
            $already_hashed_count++;
        } else {
            // Password is plain text - needs to be hashed
            echo "<td style='color: orange;'>Plain Text</td>";
            
            // Hash the password
            $hashed_password = password_hash($current_password, PASSWORD_DEFAULT);
            
            // Update database
            $updateSql = "UPDATE doctors SET password = ? WHERE id = ?";
            $stmt = $conn->prepare($updateSql);
            
            if (!$stmt) {
                echo "<td style='color: red;'>FAILED: " . $conn->error . "</td>";
                $failed_count++;
            } else {
                $stmt->bind_param("si", $hashed_password, $doctor_id);
                
                if ($stmt->execute()) {
                    echo "<td style='color: green;'>✅ MIGRATED</td>";
                    $migrated_count++;
                } else {
                    echo "<td style='color: red;'>FAILED: " . $stmt->error . "</td>";
                    $failed_count++;
                }
                
                $stmt->close();
            }
        }
        
        echo "</tr>";
    }
    
    echo "</table>";
    
    echo "<hr>";
    echo "<h2>Migration Summary</h2>";
    echo "<ul>";
    echo "<li><strong>Total Doctors:</strong> $total_doctors</li>";
    echo "<li><strong style='color: green;'>Migrated:</strong> $migrated_count</li>";
    echo "<li><strong style='color: blue;'>Already Hashed:</strong> $already_hashed_count</li>";
    echo "<li><strong style='color: red;'>Failed:</strong> $failed_count</li>";
    echo "</ul>";
    
    if ($failed_count > 0) {
        echo "<p style='color: red; font-weight: bold;'>⚠️ Some passwords failed to migrate. Check the errors above.</p>";
    } elseif ($migrated_count > 0) {
        echo "<p style='color: green; font-weight: bold;'>✅ All plain text passwords have been successfully migrated to hashed format!</p>";
        echo "<p><strong>Next Steps:</strong></p>";
        echo "<ol>";
        echo "<li>Test login with existing credentials</li>";
        echo "<li>Test change password functionality</li>";
        echo "<li>Delete this migration script for security</li>";
        echo "</ol>";
    } else {
        echo "<p style='color: blue; font-weight: bold;'>ℹ️ All passwords were already hashed. No migration needed.</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red; font-weight: bold;'>ERROR: " . $e->getMessage() . "</p>";
    error_log("Password Migration Error: " . $e->getMessage());
}

$conn->close();

echo "<hr>";
echo "<h3>Important Notes:</h3>";
echo "<ul>";
echo "<li>All passwords are now hashed using bcrypt (PASSWORD_DEFAULT)</li>";
echo "<li>Users can still login with their original passwords</li>";
echo "<li>The system now ONLY accepts hashed passwords</li>";
echo "<li>Plain text password comparison has been removed from login.php and change_password.php</li>";
echo "<li><strong>DELETE THIS SCRIPT after successful migration for security!</strong></li>";
echo "</ul>";
?>
