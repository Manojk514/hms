<?php

/**
 * Authentication Middleware
 * Validates JWT token and authenticates Super Admin
 */

declare(strict_types=1);

namespace App\Platform\Middleware;

use App\Core\Middleware;
use App\Core\Request;
use App\Core\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use App\Config\Database;
use PDO;

class AuthMiddleware implements Middleware
{
    /**
     * Handle authentication
     */
    public function handle(Request $request, Response $response): void
    {
        // Step 1: Check Authorization header presence
        $token = $request->bearerToken();

        if ($token === null) {
            $response->unauthorized('Authorization token is required', 'MISSING_TOKEN');
            return;
        }

        // Step 2: Validate JWT token
        try {
            $decoded = $this->decodeToken($token);
        } catch (ExpiredException $e) {
            $response->unauthorized('Token has expired. Please log in again.', 'TOKEN_EXPIRED');
            return;
        } catch (SignatureInvalidException $e) {
            $response->unauthorized('Invalid authorization token format', 'INVALID_TOKEN');
            return;
        } catch (\Exception $e) {
            error_log('JWT decode error: ' . $e->getMessage());
            $response->unauthorized('Invalid authorization token format', 'INVALID_TOKEN');
            return;
        }

        // Step 3: Validate token claims
        if (!$this->validateClaims($decoded)) {
            $response->unauthorized('Invalid authorization token format', 'INVALID_TOKEN');
            return;
        }

        // Step 4: Verify user exists and is active
        $user = $this->getUserById((int)$decoded->user_id);

        if ($user === null) {
            $response->unauthorized('Invalid authorization token format', 'INVALID_TOKEN');
            return;
        }

        if ($user['is_active'] != 1) {
            $response->forbidden('Your account has been suspended. Contact support.', 'ACCOUNT_SUSPENDED');
            return;
        }

        // Step 5: Attach user to request for use in controllers
        $request->user = $user;
        $request->userId = $user['id'];
        $request->userRole = $decoded->role;
    }

    /**
     * Decode JWT token
     */
    private function decodeToken(string $token): object
    {
        $secret = config('jwt.secret');
        $algorithm = config('jwt.algorithm', 'HS256');

        return JWT::decode($token, new Key($secret, $algorithm));
    }

    /**
     * Validate token claims
     */
    private function validateClaims(object $decoded): bool
    {
        // Check required claims exist
        if (!isset($decoded->user_id) || !isset($decoded->role) || !isset($decoded->exp)) {
            return false;
        }

        // Check expiration (already handled by JWT library, but double-check)
        if ($decoded->exp < time()) {
            return false;
        }

        return true;
    }

    /**
     * Get user by ID from database
     */
    private function getUserById(int $userId): ?array
    {
        try {
            $db = Database::getConnection();
            
            $stmt = $db->prepare('
                SELECT id, email, name, is_active, last_login_at
                FROM platform_super_admins
                WHERE id = :id
                LIMIT 1
            ');
            
            $stmt->execute(['id' => $userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            return $user ?: null;

        } catch (\PDOException $e) {
            error_log('Database error in AuthMiddleware: ' . $e->getMessage());
            return null;
        }
    }
}
