<?php

/**
 * Response
 * Standardizes JSON output
 */

declare(strict_types=1);

namespace App\Core;

class Response
{
    private bool $sent = false;

    /**
     * Send success response
     */
    public function success(array $data = [], int $statusCode = 200): void
    {
        $this->send([
            'success' => true,
            'data' => $data
        ], $statusCode);
    }

    /**
     * Send created response (201)
     */
    public function created(array $data = []): void
    {
        $this->success($data, 201);
    }

    /**
     * Send error response
     */
    public function error(array $error, int $statusCode = 400): void
    {
        $this->send([
            'success' => false,
            'error' => $error
        ], $statusCode);
    }

    /**
     * Send validation error response (400)
     */
    public function validationError(array $errors, string $message = 'Validation failed'): void
    {
        $this->error([
            'code' => 'VALIDATION_ERROR',
            'message' => $message,
            'details' => $errors
        ], 400);
    }

    /**
     * Send unauthorized response (401)
     */
    public function unauthorized(string $message = 'Unauthorized', string $code = 'UNAUTHORIZED'): void
    {
        $this->error([
            'code' => $code,
            'message' => $message,
            'details' => []
        ], 401);
    }

    /**
     * Send forbidden response (403)
     */
    public function forbidden(string $message = 'Forbidden', string $code = 'FORBIDDEN'): void
    {
        $this->error([
            'code' => $code,
            'message' => $message,
            'details' => []
        ], 403);
    }

    /**
     * Send not found response (404)
     */
    public function notFound(array $error = []): void
    {
        $defaultError = [
            'code' => 'NOT_FOUND',
            'message' => 'Resource not found',
            'details' => []
        ];

        $this->error(array_merge($defaultError, $error), 404);
    }

    /**
     * Send conflict response (409)
     */
    public function conflict(string $message, string $code = 'CONFLICT', array $details = []): void
    {
        $this->error([
            'code' => $code,
            'message' => $message,
            'details' => $details
        ], 409);
    }

    /**
     * Send unprocessable entity response (422)
     */
    public function unprocessable(string $message, string $code = 'BUSINESS_RULE_VIOLATION', array $details = []): void
    {
        $this->error([
            'code' => $code,
            'message' => $message,
            'details' => $details
        ], 422);
    }

    /**
     * Send too many requests response (429)
     */
    public function tooManyRequests(string $message = 'Rate limit exceeded', int $retryAfter = 60): void
    {
        header("Retry-After: {$retryAfter}");
        header("X-RateLimit-Limit: " . config('rate_limit.per_minute', 100));
        header("X-RateLimit-Remaining: 0");
        header("X-RateLimit-Reset: " . (time() + $retryAfter));

        $this->error([
            'code' => 'RATE_LIMIT_EXCEEDED',
            'message' => $message,
            'details' => [
                'retry_after' => $retryAfter
            ]
        ], 429);
    }

    /**
     * Send internal server error response (500)
     */
    public function serverError(string $message = 'An unexpected error occurred. Please try again later.'): void
    {
        $this->error([
            'code' => 'INTERNAL_SERVER_ERROR',
            'message' => $message,
            'details' => []
        ], 500);
    }

    /**
     * Send JSON response
     */
    private function send(array $data, int $statusCode): void
    {
        if ($this->sent) {
            return;
        }

        http_response_code($statusCode);
        header('Content-Type: application/json');
        
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        $this->sent = true;
        exit;
    }

    /**
     * Check if response has been sent
     */
    public function isSent(): bool
    {
        return $this->sent;
    }

    /**
     * Set custom header
     */
    public function header(string $name, string $value): self
    {
        if (!$this->sent) {
            header("{$name}: {$value}");
        }

        return $this;
    }

    /**
     * Set multiple headers
     */
    public function headers(array $headers): self
    {
        foreach ($headers as $name => $value) {
            $this->header($name, $value);
        }

        return $this;
    }

    /**
     * Send paginated response
     */
    public function paginated(array $items, int $total, int $page, int $perPage): void
    {
        $lastPage = (int)ceil($total / $perPage);

        $this->success([
            'items' => $items,
            'pagination' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => $lastPage,
                'from' => ($page - 1) * $perPage + 1,
                'to' => min($page * $perPage, $total),
            ]
        ]);
    }
}
