<?php
/**
 * List All Doctors in Database
 * This will show you the exact doctor_code values
 */

header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>All Doctors in Database</h1>";
echo "<hr>";

try {
    $conn = require_once '../../config/db_connect.php';
    
    // First, check what columns exist
    $columnsResult = $conn->query("DESCRIBE doctors");
    $columns = [];
    while ($col = $columnsResult->fetch_assoc()) {
        $columns[] = $col['Field'];
    }
    
    // Build SELECT query based on available columns
    $selectFields = ['id', 'doctor_code', 'doctor_name', 'email', 'specialization_id'];
    $availableFields = array_intersect($selectFields, $columns);
    
    $sql = "SELECT " . implode(', ', $availableFields) . " FROM doctors ORDER BY id";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        echo "<p><strong>Found " . $result->num_rows . " doctor(s)</strong></p>";
        echo "<table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse; width: 100%; background: white;'>";
        echo "<tr style='background: #667eea; color: white;'>";
        echo "<th>ID</th>";
        echo "<th>Doctor Code</th>";
        echo "<th>Doctor Name</th>";
        echo "<th>Email</th>";
        echo "<th>Specialization ID</th>";
        echo "<th>Action</th>";
        echo "</tr>";
        
        while ($row = $result->fetch_assoc()) {
            echo "<tr>";
            echo "<td>" . $row['id'] . "</td>";
            echo "<td><strong style='color: #667eea; font-size: 16px;'>" . htmlspecialchars($row['doctor_code']) . "</strong></td>";
            echo "<td>" . htmlspecialchars($row['doctor_name']) . "</td>";
            echo "<td>" . htmlspecialchars($row['email']) . "</td>";
            echo "<td>" . $row['specialization_id'] . "</td>";
            echo "<td><a href='get_profile.php?doctor_code=" . urlencode($row['doctor_code']) . "' target='_blank' style='background: #10b981; color: white; padding: 5px 10px; border-radius: 5px; text-decoration: none;'>View Profile</a></td>";
            echo "</tr>";
        }
        
        echo "</table>";
        
        echo "<hr>";
        echo "<h2>📋 Instructions:</h2>";
        echo "<ol style='font-size: 16px; line-height: 1.8;'>";
        echo "<li>Find <strong>Dr. Manoj Kunachi</strong> in the table above</li>";
        echo "<li>Look at the <strong style='color: #667eea;'>Doctor Code</strong> column (the blue text)</li>";
        echo "<li><strong>Copy that EXACT value</strong> (it might be 'doctor_code', 'DOC002', or something else)</li>";
        echo "<li>That's the value you need to use in your profile page!</li>";
        echo "</ol>";
        
    } else {
        echo "<p style='color: red;'><strong>❌ No doctors found in database!</strong></p>";
        echo "<p>You need to add doctors to the database first.</p>";
    }
    
    $conn->close();
    
} catch (Exception $e) {
    echo "<p style='color: red;'><strong>❌ Error:</strong> " . $e->getMessage() . "</p>";
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
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    th {
        padding: 12px;
    }
    td {
        padding: 10px;
    }
    tr:nth-child(even) {
        background: #f9f9f9;
    }
    a {
        color: #667eea;
        text-decoration: none;
        font-weight: bold;
    }
    a:hover {
        text-decoration: underline;
    }
</style>
