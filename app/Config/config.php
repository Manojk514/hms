<?php

/**
 * Application Configuration
 * Environment-based configuration loader
 */

declare(strict_types=1);

return [
    'app' => [
        'name' => $_ENV['APP_NAME'] ?? 'Hospital Management System',
        'env' => $_ENV['APP_ENV'] ?? 'production',
        'debug' => $_ENV['APP_ENV'] === 'development',
        'timezone' => $_ENV['APP_TIMEZONE'] ?? 'UTC',
        'url' => $_ENV['APP_URL'] ?? 'http://localhost',
    ],

    'database' => [
        'host' => $_ENV['DB_HOST'] ?? 'localhost',
        'port' => (int)($_ENV['DB_PORT'] ?? 3306),
        'name' => $_ENV['DB_NAME'] ?? '',
        'user' => $_ENV['DB_USER'] ?? '',
        'pass' => $_ENV['DB_PASS'] ?? '',
        'charset' => $_ENV['DB_CHARSET'] ?? 'utf8mb4',
        'collation' => $_ENV['DB_COLLATION'] ?? 'utf8mb4_unicode_ci',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
        ],
    ],

    'jwt' => [
        'secret' => $_ENV['JWT_SECRET'] ?? '',
        'expiry' => (int)($_ENV['JWT_EXPIRY'] ?? 28800), // 8 hours in seconds
        'algorithm' => 'HS256',
    ],

    'cors' => [
        'allowed_origins' => !empty($_ENV['CORS_ALLOWED_ORIGINS']) 
            ? explode(',', $_ENV['CORS_ALLOWED_ORIGINS']) 
            : [],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization'],
        'allow_credentials' => true,
    ],

    'upload' => [
        'max_size' => (int)($_ENV['UPLOAD_MAX_SIZE'] ?? 2097152), // 2MB in bytes
        'allowed_types' => ['image/jpeg', 'image/png'],
        'allowed_extensions' => ['jpg', 'jpeg', 'png'],
        'path' => $_ENV['UPLOAD_PATH'] ?? '/storage/uploads',
    ],

    'rate_limit' => [
        'per_minute' => (int)($_ENV['RATE_LIMIT_PER_MINUTE'] ?? 100),
        'per_hour' => (int)($_ENV['RATE_LIMIT_PER_HOUR'] ?? 1000),
    ],

    'logging' => [
        'path' => $_ENV['LOG_PATH'] ?? '/storage/logs',
        'level' => $_ENV['LOG_LEVEL'] ?? 'error',
        'max_files' => (int)($_ENV['LOG_MAX_FILES'] ?? 30),
    ],

    'security' => [
        'password_cost' => 12,
        'max_login_attempts' => 5,
        'lockout_duration' => 900, // 15 minutes in seconds
        'mfa_enabled' => filter_var($_ENV['MFA_ENABLED'] ?? false, FILTER_VALIDATE_BOOLEAN),
    ],

    'pagination' => [
        'default_per_page' => 20,
        'max_per_page' => 100,
    ],
];
