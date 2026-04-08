<?php

/**
 * JWT Helper
 * Utility for JWT token creation and validation
 */

declare(strict_types=1);

namespace App\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

class JwtHelper
{
    /**
     * Generate JWT token
     * 
     * @param int $userId User ID
     * @param string $email User email
     * @param string $role User role (SUPER_ADMIN, HOSPITAL_ADMIN, etc.)
     * @param array $additionalClaims Optional additional claims
     * @return string JWT token
     */
    public static function generate(
        int $userId,
        string $email,
        string $role,
        array $additionalClaims = []
    ): string {
        $secret = config('jwt.secret');
        $expiry = config('jwt.expiry', 28800); // 8 hours
        $algorithm = config('jwt.algorithm', 'HS256');

        $issuedAt = time();
        $expiresAt = $issuedAt + $expiry;

        $payload = array_merge([
            'user_id' => $userId,
            'email' => $email,
            'role' => $role,
            'iat' => $issuedAt,
            'exp' => $expiresAt,
        ], $additionalClaims);

        return JWT::encode($payload, $secret, $algorithm);
    }

    /**
     * Decode and validate JWT token
     * 
     * @param string $token JWT token
     * @return object|null Decoded token or null if invalid
     */
    public static function decode(string $token): ?object
    {
        try {
            $secret = config('jwt.secret');
            $algorithm = config('jwt.algorithm', 'HS256');

            return JWT::decode($token, new Key($secret, $algorithm));
        } catch (\Exception $e) {
            error_log('JWT decode error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Validate token without decoding
     * 
     * @param string $token JWT token
     * @return bool True if valid, false otherwise
     */
    public static function validate(string $token): bool
    {
        return self::decode($token) !== null;
    }

    /**
     * Check if token is expired
     * 
     * @param string $token JWT token
     * @return bool True if expired, false otherwise
     */
    public static function isExpired(string $token): bool
    {
        try {
            $secret = config('jwt.secret');
            $algorithm = config('jwt.algorithm', 'HS256');
            
            JWT::decode($token, new Key($secret, $algorithm));
            return false;
        } catch (ExpiredException $e) {
            return true;
        } catch (\Exception $e) {
            return true;
        }
    }

    /**
     * Get token expiration time
     * 
     * @param string $token JWT token
     * @return int|null Unix timestamp or null if invalid
     */
    public static function getExpiration(string $token): ?int
    {
        $decoded = self::decode($token);
        return $decoded->exp ?? null;
    }

    /**
     * Get user ID from token
     * 
     * @param string $token JWT token
     * @return int|null User ID or null if invalid
     */
    public static function getUserId(string $token): ?int
    {
        $decoded = self::decode($token);
        return $decoded->user_id ?? null;
    }

    /**
     * Get user role from token
     * 
     * @param string $token JWT token
     * @return string|null User role or null if invalid
     */
    public static function getRole(string $token): ?string
    {
        $decoded = self::decode($token);
        return $decoded->role ?? null;
    }

    /**
     * Extract token from Authorization header
     * 
     * @param string $header Authorization header value
     * @return string|null Token or null if not found
     */
    public static function extractFromHeader(string $header): ?string
    {
        if (preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Generate token with custom expiry
     * 
     * @param int $userId User ID
     * @param string $email User email
     * @param string $role User role
     * @param int $expirySeconds Expiry in seconds
     * @return string JWT token
     */
    public static function generateWithExpiry(
        int $userId,
        string $email,
        string $role,
        int $expirySeconds
    ): string {
        $secret = config('jwt.secret');
        $algorithm = config('jwt.algorithm', 'HS256');

        $issuedAt = time();
        $expiresAt = $issuedAt + $expirySeconds;

        $payload = [
            'user_id' => $userId,
            'email' => $email,
            'role' => $role,
            'iat' => $issuedAt,
            'exp' => $expiresAt,
        ];

        return JWT::encode($payload, $secret, $algorithm);
    }
}
