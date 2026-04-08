<?php
/**
 * Test Login API
 * Direct test to see the actual error
 */

// Load environment
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
        putenv(trim($key) . '=' . trim($value));
    }
}

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== Testing Login API ===\n\n";

// Test 1: Check if table exists
try {
    require_once __DIR__ . '/app/Config/Database.php';
    $db = \App\Config\Database::getConnection();
    
    echo "1. Checking if platform_super_admins table exists...\n";
    $stmt = $db->query("SHOW TABLES LIKE 'platform_super_admins'");
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        echo "   ✓ Table exists\n\n";
        
        // Check if admin user exists
        echo "2. Checking if admin user exists...\n";
        $stmt = $db->prepare("SELECT id, email, name, is_active FROM platform_super_admins WHERE email = ?");
        $stmt->execute(['admin@platform.com']);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo "   ✓ Admin user found\n";
            echo "   - ID: " . $user['id'] . "\n";
            echo "   - Email: " . $user['email'] . "\n";
            echo "   - Name: " . $user['name'] . "\n";
            echo "   - Active: " . ($user['is_active'] ? 'Yes' : 'No') . "\n\n";
        } else {
            echo "   ✗ Admin user NOT found\n";
            echo "   Creating admin user...\n\n";
            
            // Create admin user
            $passwordHash = password_hash('admin123', PASSWORD_DEFAULT);
            $insertSql = "
                INSERT INTO platform_super_admins (email, name, password_hash, is_active, created_at)
                VALUES (?, ?, ?, 1, NOW())
            ";
            $stmt = $db->prepare($insertSql);
            $stmt->execute(['admin@platform.com', 'Super Admin', $passwordHash]);
            
            echo "   ✓ Admin user created successfully\n\n";
        }
        
    } else {
        echo "   ✗ Table does NOT exist\n";
        echo "   Creating table...\n\n";
        
        // Create table
        $createTableSql = "
            CREATE TABLE IF NOT EXISTS platform_super_admins (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_active TINYINT(1) DEFAULT 1,
                last_login_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
        
        $db->exec($createTableSql);
        echo "   ✓ Table created\n\n";
        
        // Create admin user
        echo "3. Creating admin user...\n";
        $passwordHash = password_hash('admin123', PASSWORD_DEFAULT);
        $insertSql = "
            INSERT INTO platform_super_admins (email, name, password_hash, is_active, created_at)
            VALUES (?, ?, ?, 1, NOW())
        ";
        $stmt = $db->prepare($insertSql);
        $stmt->execute(['admin@platform.com', 'Super Admin', $passwordHash]);
        
        echo "   ✓ Admin user created\n\n";
    }
    
    // Test 3: Test AuthService
    echo "3. Testing AuthService...\n";
    require_once __DIR__ . '/app/Platform/SuperAdmin/Services/AuthService.php';
    require_once __DIR__ . '/app/Platform/SuperAdmin/Services/AuditLogService.php';
    require_once __DIR__ . '/app/Utils/JwtHelper.php';
    
    $authService = new \App\Platform\SuperAdmin\Services\AuthService();
    
    try {
        $result = $authService->login('admin@platform.com', 'admin123');
        echo "   ✓ Login successful\n";
        echo "   - Token: " . substr($result['token'], 0, 50) . "...\n";
        echo "   - User: " . $result['user']['name'] . " (" . $result['user']['email'] . ")\n\n";
    } catch (\Exception $e) {
        echo "   ✗ Login failed: " . $e->getMessage() . "\n\n";
    }
    
    echo "=== All Tests Complete ===\n";
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
