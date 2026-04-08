<?php
/**
 * Setup Super Admin Table and User
 */

// Database configuration
$host = 'localhost';
$dbname = 'hms_dev';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Super Admin Setup ===\n\n";
    
    // Check if table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'platform_super_admins'");
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        echo "1. Creating platform_super_admins table...\n";
        
        $createTableSql = "
            CREATE TABLE platform_super_admins (
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
        
        $pdo->exec($createTableSql);
        echo "   ✓ Table created successfully\n\n";
    } else {
        echo "1. Table already exists\n\n";
    }
    
    // Check if admin user exists
    echo "2. Checking for admin user...\n";
    $stmt = $pdo->prepare("SELECT id, email, name FROM platform_super_admins WHERE email = ?");
    $stmt->execute(['admin@platform.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "   ✓ Admin user already exists\n";
        echo "   - ID: " . $user['id'] . "\n";
        echo "   - Email: " . $user['email'] . "\n";
        echo "   - Name: " . $user['name'] . "\n\n";
        
        // Update password to ensure it's correct
        echo "3. Updating admin password...\n";
        $passwordHash = password_hash('admin123', PASSWORD_DEFAULT);
        $updateSql = "UPDATE platform_super_admins SET password_hash = ?, is_active = 1 WHERE email = ?";
        $stmt = $pdo->prepare($updateSql);
        $stmt->execute([$passwordHash, 'admin@platform.com']);
        echo "   ✓ Password updated\n\n";
        
    } else {
        echo "   - Admin user not found, creating...\n\n";
        
        echo "3. Creating admin user...\n";
        $passwordHash = password_hash('admin123', PASSWORD_DEFAULT);
        $insertSql = "
            INSERT INTO platform_super_admins (email, name, password_hash, is_active, created_at)
            VALUES (?, ?, ?, 1, NOW())
        ";
        $stmt = $pdo->prepare($insertSql);
        $stmt->execute(['admin@platform.com', 'Super Admin', $passwordHash]);
        
        echo "   ✓ Admin user created\n";
        echo "   - Email: admin@platform.com\n";
        echo "   - Password: admin123\n\n";
    }
    
    echo "=== Setup Complete ===\n";
    echo "\nYou can now login with:\n";
    echo "Email: admin@platform.com\n";
    echo "Password: admin123\n";
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
