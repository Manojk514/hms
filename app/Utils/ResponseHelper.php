<?php

/**
 * Response Helper
 * Utility for standard JSON response formatting
 */

declare(strict_types=1);

namespace App\Utils;

class ResponseHelper
{
    /**
     * Format success response
     * 
     * @param array $data Response data
     * @param int $statusCode HTTP status code
     * @return array Formatted response
     */
    public static function success(array $data = [], int $statusCode = 200): array
    {
        http_response_code($statusCode);
        return [
            'success' => true,
            'data' => $data
        ];
    }

    /**
     * Format error response
     * 
     * @param string $code Error code
     * @param string $message Error message
     * @param array $details Error details
     * @param int $statusCode HTTP status code
     * @return array Formatted response
     */
    public static function error(
        string $code,
        string $message,
        array $details = [],
        int $statusCode = 400
    ): array {
        http_response_code($statusCode);
        return [
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details
            ]
        ];
    }

    /**
     * Format validation error response
     * 
     * @param array $errors Field-specific validation errors
     * @param string $message General error message
     * @return array Formatted response
     */
    public static function validationError(
        array $errors,
        string $message = 'Validation failed'
    ): array {
        return self::error('VALIDATION_ERROR', $message, $errors, 400);
    }

    /**
     * Format unauthorized response (401)
     * 
     * @param string $message Error message
     * @param string $code Error code
     * @return array Formatted response
     */
    public static function unauthorized(
        string $message = 'Unauthorized',
        string $code = 'UNAUTHORIZED'
    ): array {
        return self::error($code, $message, [], 401);
    }

    /**
     * Format forbidden response (403)
     * 
     * @param string $message Error message
     * @param string $code Error code
     * @return array Formatted response
     */
    public static function forbidden(
        string $message = 'Forbidden',
        string $code = 'FORBIDDEN'
    ): array {
        return self::error($code, $message, [], 403);
    }

    /**
     * Format not found response (404)
     * 
     * @param string $message Error message
     * @param string $code Error code
     * @return array Formatted response
     */
    public static function notFound(
        string $message = 'Resource not found',
        string $code = 'NOT_FOUND'
    ): array {
        return self::error($code, $message, [], 404);
    }

    /**
     * Format conflict response (409)
     * 
     * @param string $message Error message
     * @param string $code Error code
     * @param array $details Error details
     * @return array Formatted response
     */
    public static function conflict(
        string $message,
        string $code = 'CONFLICT',
        array $details = []
    ): array {
        return self::error($code, $message, $details, 409);
    }

    /**
     * Format unprocessable entity response (422)
     * 
     * @param string $message Error message
     * @param string $code Error code
     * @param array $details Error details
     * @return array Formatted response
     */
    public static function unprocessable(
        string $message,
        string $code = 'BUSINESS_RULE_VIOLATION',
        array $details = []
    ): array {
        return self::error($code, $message, $details, 422);
    }

    /**
     * Format rate limit exceeded response (429)
     * 
     * @param int $retryAfter Seconds until retry
     * @return array Formatted response
     */
    public static function rateLimitExceeded(int $retryAfter = 60): array
    {
        header("Retry-After: {$retryAfter}");
        header("X-RateLimit-Limit: " . config('rate_limit.per_minute', 100));
        header("X-RateLimit-Remaining: 0");
        header("X-RateLimit-Reset: " . (time() + $retryAfter));

        return self::error(
            'RATE_LIMIT_EXCEEDED',
            "Rate limit exceeded. Try again in {$retryAfter} seconds.",
            ['retry_after' => $retryAfter],
            429
        );
    }

    /**
     * Format server error response (500)
     * 
     * @param string $message Error message
     * @return array Formatted response
     */
    public static function serverError(
        string $message = 'An unexpected error occurred. Please try again later.'
    ): array {
        return self::error('INTERNAL_SERVER_ERROR', $message, [], 500);
    }

    /**
     * Format paginated response
     * 
     * @param array $items Data items
     * @param int $total Total count
     * @param int $page Current page
     * @param int $perPage Items per page
     * @return array Formatted response
     */
    public static function paginated(
        array $items,
        int $total,
        int $page,
        int $perPage
    ): array {
        $lastPage = (int)ceil($total / $perPage);
        $from = ($page - 1) * $perPage + 1;
        $to = min($page * $perPage, $total);

        return self::success([
            'items' => $items,
            'pagination' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => $lastPage,
                'from' => $total > 0 ? $from : 0,
                'to' => $total > 0 ? $to : 0,
            ]
        ]);
    }

    /**
     * Format created response (201)
     * 
     * @param array $data Created resource data
     * @return array Formatted response
     */
    public static function created(array $data = []): array
    {
        return self::success($data, 201);
    }

    /**
     * Send JSON response and exit
     * 
     * @param array $response Response array
     * @return void
     */
    public static function send(array $response): void
    {
        header('Content-Type: application/json');
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send success response and exit
     * 
     * @param array $data Response data
     * @param int $statusCode HTTP status code
     * @return void
     */
    public static function sendSuccess(array $data = [], int $statusCode = 200): void
    {
        self::send(self::success($data, $statusCode));
    }

    /**
     * Send error response and exit
     * 
     * @param string $code Error code
     * @param string $message Error message
     * @param array $details Error details
     * @param int $statusCode HTTP status code
     * @return void
     */
    public static function sendError(
        string $code,
        string $message,
        array $details = [],
        int $statusCode = 400
    ): void {
        self::send(self::error($code, $message, $details, $statusCode));
    }
}
