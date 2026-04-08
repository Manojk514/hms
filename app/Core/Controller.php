<?php

/**
 * Controller
 * Base controller class for all controllers
 */

declare(strict_types=1);

namespace App\Core;

abstract class Controller
{
    protected Request $request;
    protected Response $response;

    public function __construct(Request $request, Response $response)
    {
        $this->request = $request;
        $this->response = $response;
    }

    /**
     * Get request instance
     */
    protected function request(): Request
    {
        return $this->request;
    }

    /**
     * Get response instance
     */
    protected function response(): Response
    {
        return $this->response;
    }

    /**
     * Validate request input
     */
    protected function validate(array $rules): array
    {
        $errors = $this->request->validate($rules);

        if (!empty($errors)) {
            $this->response->validationError($errors);
        }

        return $this->request->all();
    }

    /**
     * Get input value
     */
    protected function input(string $key, $default = null)
    {
        return $this->request->input($key, $default);
    }

    /**
     * Get query parameter
     */
    protected function query(string $key, $default = null)
    {
        return $this->request->query($key, $default);
    }

    /**
     * Get all input
     */
    protected function all(): array
    {
        return $this->request->all();
    }

    /**
     * Get pagination parameters
     */
    protected function getPaginationParams(): array
    {
        $page = max(1, (int)$this->query('page', 1));
        $perPage = max(1, min(
            (int)$this->query('per_page', config('pagination.default_per_page', 20)),
            config('pagination.max_per_page', 100)
        ));

        return [
            'page' => $page,
            'per_page' => $perPage,
            'offset' => ($page - 1) * $perPage,
        ];
    }

    /**
     * Get sort parameters
     */
    protected function getSortParams(array $allowedFields, string $defaultField = 'created_at'): array
    {
        $sortBy = $this->query('sort_by', $defaultField);
        $sortOrder = strtoupper($this->query('sort_order', 'DESC'));

        // Validate sort field
        if (!in_array($sortBy, $allowedFields)) {
            $sortBy = $defaultField;
        }

        // Validate sort order
        if (!in_array($sortOrder, ['ASC', 'DESC'])) {
            $sortOrder = 'DESC';
        }

        return [
            'sort_by' => $sortBy,
            'sort_order' => $sortOrder,
        ];
    }

    /**
     * Send success response
     */
    protected function success(array $data = [], int $statusCode = 200): void
    {
        $this->response->success($data, $statusCode);
    }

    /**
     * Send created response
     */
    protected function created(array $data = []): void
    {
        $this->response->created($data);
    }

    /**
     * Send error response
     */
    protected function error(array $error, int $statusCode = 400): void
    {
        $this->response->error($error, $statusCode);
    }

    /**
     * Send not found response
     */
    protected function notFound(string $message = 'Resource not found', string $code = 'NOT_FOUND'): void
    {
        $this->response->notFound([
            'code' => $code,
            'message' => $message,
            'details' => []
        ]);
    }

    /**
     * Send paginated response
     */
    protected function paginated(array $items, int $total, int $page, int $perPage): void
    {
        $this->response->paginated($items, $total, $page, $perPage);
    }
}
