<?php
/**
 * Quick System Check
 * Run this first to see if everything is set up correctly
 */

header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

$checks = [];
$allPassed = true;

// Check 1: PHP Version
$checks[] = [
    'name' => 'PHP Version',
    'status' => version_compare(PHP_VERSION, '7.0.0', '>='),
    'message' => 'PHP ' . PHP_VERSION,
    'required' => 'PHP 7.0 or higher'
];

// Check 2: MySQLi Extension
$checks[] = [
    'name' => 'MySQLi Extension',
    'status' => extension_loaded('mysqli'),
    'message' => extension_loaded('mysqli') ? 'Installed' : 'Not installed',
    'required' => 'Required for database'
];

// Check 3: Database Connection File
$dbConfigExists = file_exists('../../config/db_connect.php');
$checks[] = [
    'name' => 'Database Config File',
    'status' => $dbConfigExists,
    'message' => $dbConfigExists ? 'Found' : 'Missing',
    'required' => 'backend/config/db_connect.php'
];

// Check 4: Database Connection
$dbConnected = false;
$dbMessage = '';
if ($dbConfigExists) {
    try {
        $conn = require_once '../../config/db_connect.php';
        $dbConnected = true;
        $dbMessage = 'Connected to: ' . $conn->query("SELECT DATABASE()")->fetch_row()[0];
    } catch (Exception $e) {
        $dbMessage = 'Error: ' . $e->getMessage();
    }
}
$checks[] = [
    'name' => 'Database Connection',
    'status' => $dbConnected,
    'message' => $dbMessage,
    'required' => 'MySQL connection'
];

// Check 5: Doctors Table
$tableExists = false;
$tableMessage = '';
if ($dbConnected) {
    $result = $conn->query("SHOW TABLES LIKE 'doctors'");
    $tableExists = $result->num_rows > 0;
    $tableMessage = $tableExists ? 'Table exists' : 'Table missing';
}
$checks[] = [
    'name' => 'Doctors Table',
    'status' => $tableExists,
    'message' => $tableMessage,
    'required' => 'doctors table in database'
];

// Check 6: Test Doctor (DOC001)
$doctorExists = false;
$doctorMessage = '';
if ($tableExists) {
    $stmt = $conn->prepare("SELECT doctor_code, doctor_name FROM doctors WHERE doctor_code = 'DOC001'");
    $stmt->execute();
    $result = $stmt->get_result();
    $doctorExists = $result->num_rows > 0;
    if ($doctorExists) {
        $doctor = $result->fetch_assoc();
        $doctorMessage = 'Found: ' . $doctor['doctor_name'];
    } else {
        $doctorMessage = 'DOC001 not found';
    }
    $stmt->close();
}
$checks[] = [
    'name' => 'Test Doctor (DOC001)',
    'status' => $doctorExists,
    'message' => $doctorMessage,
    'required' => 'Test doctor for API testing'
];

// Check 7: Write Permission Test
$canUpdate = false;
$updateMessage = '';
if ($doctorExists) {
    $testUpdate = $conn->prepare("UPDATE doctors SET doctor_name = doctor_name WHERE doctor_code = 'DOC001'");
    $canUpdate = $testUpdate->execute();
    $updateMessage = $canUpdate ? 'Can update records' : 'Cannot update records';
    $testUpdate->close();
}
$checks[] = [
    'name' => 'Database Write Permission',
    'status' => $canUpdate,
    'message' => $updateMessage,
    'required' => 'UPDATE permission'
];

// Calculate overall status
foreach ($checks as $check) {
    if (!$check['status']) {
        $allPassed = false;
    }
}

if (isset($conn)) {
    $conn->close();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quick System Check</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: <?php echo $allPassed ? '#10b981' : '#ef4444'; ?>;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 18px;
            opacity: 0.9;
        }
        .checks {
            padding: 30px;
        }
        .check-item {
            display: flex;
            align-items: center;
            padding: 20px;
            margin-bottom: 15px;
            background: #f9fafb;
            border-radius: 10px;
            border-left: 4px solid #e5e7eb;
        }
        .check-item.pass {
            border-left-color: #10b981;
            background: #d1fae5;
        }
        .check-item.fail {
            border-left-color: #ef4444;
            background: #fee2e2;
        }
        .check-icon {
            font-size: 32px;
            margin-right: 20px;
            min-width: 40px;
            text-align: center;
        }
        .check-content {
            flex: 1;
        }
        .check-name {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .check-message {
            font-size: 14px;
            color: #6b7280;
        }
        .check-required {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 3px;
        }
        .actions {
            padding: 30px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 5px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .btn-success {
            background: #10b981;
        }
        .btn-success:hover {
            background: #059669;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><?php echo $allPassed ? '✅ All Checks Passed!' : '⚠️ Issues Found'; ?></h1>
            <p><?php echo $allPassed ? 'System is ready for testing' : 'Please fix the issues below'; ?></p>
        </div>
        
        <div class="checks">
            <?php foreach ($checks as $check): ?>
                <div class="check-item <?php echo $check['status'] ? 'pass' : 'fail'; ?>">
                    <div class="check-icon">
                        <?php echo $check['status'] ? '✅' : '❌'; ?>
                    </div>
                    <div class="check-content">
                        <div class="check-name"><?php echo $check['name']; ?></div>
                        <div class="check-message"><?php echo $check['message']; ?></div>
                        <div class="check-required">Required: <?php echo $check['required']; ?></div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
        
        <div class="actions">
            <?php if ($allPassed): ?>
                <h3 style="margin-bottom: 20px; color: #10b981;">🎉 Ready to Test!</h3>
                <a href="simple_test.html" class="btn btn-success">Start Testing →</a>
            <?php else: ?>
                <h3 style="margin-bottom: 20px; color: #ef4444;">Fix Issues First</h3>
                <a href="test_database_connection.php" class="btn">Run Full Diagnostic</a>
            <?php endif; ?>
            <a href="javascript:location.reload()" class="btn">🔄 Refresh Check</a>
        </div>
    </div>
</body>
</html>
