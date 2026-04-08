<?php

/**
 * Helper Functions
 * Global utility functions for the application
 */

declare(strict_types=1);

if (!function_exists('config')) {
    /**
     * Get configuration value by key
     * 
     * @param string $key Dot notation key (e.g., 'database.host')
     * @param mixed $default Default value if key not found
     * @return mixed
     */
    function config(string $key, $default = null)
    {
        static $config = null;

        if ($config === null) {
            $config = require BASE_PATH . '/app/Config/config.php';
        }

        $keys = explode('.', $key);
        $value = $config;

        foreach ($keys as $k) {
            if (!isset($value[$k])) {
                return $default;
            }
            $value = $value[$k];
        }

        return $value;
    }
}

if (!function_exists('env')) {
    /**
     * Get environment variable value
     * 
     * @param string $key Environment variable key
     * @param mixed $default Default value if not found
     * @return mixed
     */
    function env(string $key, $default = null)
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? $default;

        if ($value === null) {
            return $default;
        }

        // Convert string booleans to actual booleans
        if (is_string($value)) {
            $lower = strtolower($value);
            if ($lower === 'true' || $lower === '(true)') {
                return true;
            }
            if ($lower === 'false' || $lower === '(false)') {
                return false;
            }
            if ($lower === 'null' || $lower === '(null)') {
                return null;
            }
        }

        return $value;
    }
}

if (!function_exists('db')) {
    /**
     * Get database connection
     * 
     * @return PDO
     */
    function db(): PDO
    {
        return App\Config\Database::getConnection();
    }
}
