<?php

/**
 * Auth Service
 * Handles authentication logic for Super Admin
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Config\Database;
use App\Utils\JwtHelper;
use App\Platform\SuperAdmin\Services\AuditLogService;

use PDO;

class AuthService
{
    private PDO $db;
    private AuditLogService $auditLog;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->auditLog = new AuditLogService();
    }

    /**
     * Login Super Admin
     * 
     * @param string $email Email address
     * @param string $password Password
     * @return array Login result with token
     * @throws \Exception
     */
    public function login(string $email, string $password): array
    {
        // Find Super Admin by email
        $sql = "
            SELECT id, email, name, password_hash, is_active
            FROM platform_super_admins
            WHERE email = :email
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['email' => strtolower(trim($email))]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check if user exists
        if (!$user) {
            throw new \Exception('Invalid email or password', 401);
        }

        // Check if account is active
        if ($user['is_active'] != 1) {
            throw new \Exception('Account is suspended', 401);
        }

        // Verify password
        if (!password_verify($password, $user['password_hash'])) {
            // Log failed login attempt
            $this->auditLog->log(
                'LOGIN_FAILED',
                'AUTH',
                $user['id'], // Use user ID as entity_id
                $user['id'],
                null,
                ['email' => $email, 'reason' => 'Invalid password']
            );

            throw new \Exception('Invalid email or password', 401);
        }

        // Generate JWT token
        $token = JwtHelper::generate(
            $user['id'],
            $user['email'],
            'SUPER_ADMIN'
        );

        // Update last login
        $updateSql = "
            UPDATE platform_super_admins
            SET last_login_at = NOW()
            WHERE id = :id
        ";
        $stmt = $this->db->prepare($updateSql);
        $stmt->execute(['id' => $user['id']]);

        // Log successful login
        $this->auditLog->log(
            'LOGIN_SUCCESS',
            'AUTH',
            $user['id'], // Use user ID as entity_id
            $user['id'],
            null,
            ['email' => $email]
        );

        return [
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
            ],
        ];
    }

    /**
     * Logout Super Admin
     * 
     * @param int $userId Super Admin ID
     * @return bool Success status
     */
    public function logout(int $userId): bool
    {
        // Log logout action
        $this->auditLog->log(
            'LOGOUT',
            'AUTH',
            $userId, // Use user ID as entity_id
            $userId,
            null,
            null
        );

        return true;
    }
}
