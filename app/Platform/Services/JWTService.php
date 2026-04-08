<?php

/**
 * JWT Service
 * Handles JWT token generation and validation
 */

declare(strict_types=1);

namespace App\Platform\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTService
{
    /**
     * Generate JWT token for Super Admin
     */
    public static function generateToken(int $userId, string $email, string $role = 'SUPER_ADMIN'): string
    {
        $secret = config('jwt.secret');
        $expiry = config('jwt.expiry', 28800); // 8 hours default
        $algorithm = config('jwt.algorithm', 'HS256');

        $issuedAt = time();
        $expiresAt = $issuedAt + $expiry;

        $payload = [
            'user_id' => $userId,
            'email' => $email,
            'role' => $role,
            'iat' => $issuedAt,
            'exp' => $expiresAt,
        ];

        return JWT::encode($payload, $secret, $algorithm);
    }

    /**
     * Decode JWT token
     */
    public static function decode(string $token): object
    {
        $secret = config('jwt.secret');
        $algorithm = config('jwt.algorithm', 'HS256');

        return JWT::decode($token, new Key($secret, $algorithm));
    }

    /**
     * Validate token without throwing exceptions
     */
    public static function validate(string $token): bool
    {
        try {
            self::decode($token);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
