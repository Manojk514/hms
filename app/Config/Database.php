<?php

/**
 * Database Connection Manager
 * Singleton pattern for reusable PDO connection
 */

declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $connection = null;
    private static ?self $instance = null;

    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct()
    {
        // Singleton pattern
    }

    /**
     * Prevent cloning of the instance
     */
    private function __clone()
    {
        // Singleton pattern
    }

    /**
     * Get singleton instance
     */
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Get PDO connection (reusable across repositories)
     * 
     * @return PDO
     * @throws PDOException
     */
    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            self::$connection = self::createConnection();
        }

        return self::$connection;
    }

    /**
     * Create new PDO connection
     * 
     * @return PDO
     * @throws PDOException
     */
    private static function createConnection(): PDO
    {
        $config = require __DIR__ . '/config.php';
        $dbConfig = $config['database'];

        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $dbConfig['host'],
                $dbConfig['port'],
                $dbConfig['name'],
                $dbConfig['charset']
            );

            $connection = new PDO(
                $dsn,
                $dbConfig['user'],
                $dbConfig['pass'],
                $dbConfig['options']
            );

            // Set charset and collation
            $connection->exec("SET NAMES '{$dbConfig['charset']}' COLLATE '{$dbConfig['collation']}'");

            return $connection;

        } catch (PDOException $e) {
            // Log error without exposing credentials
            error_log('Database connection failed: ' . $e->getMessage());

            // Throw generic error to prevent credential leakage
            throw new PDOException(
                'Database connection failed. Please check your configuration.',
                (int)$e->getCode()
            );
        }
    }

    /**
     * Test database connection
     * 
     * @return bool
     */
    public static function testConnection(): bool
    {
        try {
            $connection = self::getConnection();
            $connection->query('SELECT 1');
            return true;
        } catch (PDOException $e) {
            error_log('Database connection test failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Close database connection
     */
    public static function closeConnection(): void
    {
        self::$connection = null;
    }

    /**
     * Begin transaction
     * 
     * @return bool
     */
    public static function beginTransaction(): bool
    {
        return self::getConnection()->beginTransaction();
    }

    /**
     * Commit transaction
     * 
     * @return bool
     */
    public static function commit(): bool
    {
        return self::getConnection()->commit();
    }

    /**
     * Rollback transaction
     * 
     * @return bool
     */
    public static function rollback(): bool
    {
        return self::getConnection()->rollBack();
    }

    /**
     * Check if in transaction
     * 
     * @return bool
     */
    public static function inTransaction(): bool
    {
        return self::getConnection()->inTransaction();
    }

    /**
     * Get last insert ID
     * 
     * @return string
     */
    public static function lastInsertId(): string
    {
        return self::getConnection()->lastInsertId();
    }
}
