<?php

/**
 * Request
 * Abstracts HTTP request input safely
 */

declare(strict_types=1);

namespace App\Core;

class Request
{
    public ?int $userId = null;
    public ?array $user = null;
    public ?string $userRole = null;
    private array $queryParams;
    private array $bodyParams;
    private array $serverParams;
    private array $headers;
    private ?array $jsonBody = null;

    public function __construct()
    {
        $this->queryParams = $_GET;
        $this->serverParams = $_SERVER;
        $this->headers = $this->parseHeaders();
        
        // Parse JSON body for non-form requests
        if ($this->isJson()) {
            $this->jsonBody = $this->parseJsonBody();
        }
        
        // Handle POST and multipart PUT/PATCH requests
        if ($this->method() === 'POST') {
            $this->bodyParams = $_POST;
        } elseif (in_array($this->method(), ['PUT', 'PATCH']) && $this->isMultipart()) {
            // Parse multipart/form-data for PUT/PATCH requests
            $this->bodyParams = $this->parseMultipartFormData();
        } else {
            $this->bodyParams = $_POST;
        }
    }
    
    /**
     * Check if request is multipart/form-data
     */
    private function isMultipart(): bool
    {
        $contentType = $this->header('Content-Type') ?? '';
        return str_contains($contentType, 'multipart/form-data');
    }
    
    /**
     * Parse multipart/form-data for PUT/PATCH requests
     * PHP doesn't populate $_POST for PUT/PATCH, so we need to parse manually
     */
    private function parseMultipartFormData(): array
    {
        $data = [];
        
        // Get raw input
        $input = file_get_contents('php://input');
        
        if (empty($input)) {
            return $data;
        }
        
        // Get boundary from Content-Type header
        $contentType = $this->header('Content-Type') ?? '';
        preg_match('/boundary=(.*)$/', $contentType, $matches);
        
        if (empty($matches[1])) {
            return $data;
        }
        
        $boundary = $matches[1];
        
        // Split by boundary
        $parts = array_slice(explode('--' . $boundary, $input), 1);
        
        foreach ($parts as $part) {
            // Skip empty parts and closing boundary
            if (trim($part) === '--' || empty(trim($part))) {
                continue;
            }
            
            // Split headers and content
            $sections = explode("\r\n\r\n", $part, 2);
            
            if (count($sections) !== 2) {
                continue;
            }
            
            list($headers, $content) = $sections;
            
            // Parse Content-Disposition header
            if (preg_match('/name="([^"]+)"/', $headers, $nameMatch)) {
                $name = $nameMatch[1];
                
                // Check if it's a file
                if (preg_match('/filename="([^"]+)"/', $headers, $fileMatch)) {
                    // This is a file - it's already in $_FILES
                    continue;
                }
                
                // Regular form field - trim trailing \r\n
                $data[$name] = rtrim($content, "\r\n");
            }
        }
        
        return $data;
    }

    /**
     * Get HTTP method
     */
    public function method(): string
    {
        return strtoupper($this->serverParams['REQUEST_METHOD'] ?? 'GET');
    }

    /**
     * Get request path (without query string)
     */
    public function path(): string
    {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Extract base path from SCRIPT_NAME (e.g., /HMS/public)
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
        $basePath = str_replace('/index.php', '', $scriptName);
        
        // Strip base path from URI
        if (!empty($basePath) && strpos($uri, $basePath) === 0) {
            $uri = substr($uri, strlen($basePath));
        }

        // Ensure root is '/'
        return $uri === '' ? '/' : $uri;
    }


    /**
     * Get full URI with query string
     */
    public function uri(): string
    {
        return $this->serverParams['REQUEST_URI'] ?? '/';
    }

    /**
     * Check if request is JSON
     */
    public function isJson(): bool
    {
        $contentType = $this->header('Content-Type') ?? '';
        return str_contains($contentType, 'application/json');
    }

    /**
     * Get query parameter
     */
    public function query(string $key, $default = null)
    {
        return $this->queryParams[$key] ?? $default;
    }

    /**
     * Get all query parameters
     */
    public function allQuery(): array
    {
        return $this->queryParams;
    }

    /**
     * Get body parameter (POST or JSON)
     */
    public function input(string $key, $default = null)
    {
        // Check JSON body first
        if ($this->jsonBody !== null && isset($this->jsonBody[$key])) {
            return $this->jsonBody[$key];
        }
        
        // Fall back to POST data
        return $this->bodyParams[$key] ?? $default;
    }

    /**
     * Get all body parameters
     */
    public function all(): array
    {
        return $this->jsonBody ?? $this->bodyParams;
    }

    /**
     * Check if input key exists
     */
    public function has(string $key): bool
    {
        if ($this->jsonBody !== null) {
            return isset($this->jsonBody[$key]);
        }
        
        return isset($this->bodyParams[$key]);
    }

    /**
     * Get only specified keys from input
     */
    public function only(array $keys): array
    {
        $data = $this->all();
        return array_intersect_key($data, array_flip($keys));
    }

    /**
     * Get all except specified keys from input
     */
    public function except(array $keys): array
    {
        $data = $this->all();
        return array_diff_key($data, array_flip($keys));
    }

    /**
     * Get header value
     */
    public function header(string $key, $default = null)
    {
        $key = strtolower($key);
        return $this->headers[$key] ?? $default;
    }

    /**
     * Get all headers
     */
    public function headers(): array
    {
        return $this->headers;
    }

    /**
     * Get Authorization header
     */
    public function bearerToken(): ?string
    {
        $header = $this->header('Authorization');
        
        if ($header && preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
            return $matches[1];
        }
        
        return null;
    }

    /**
     * Get client IP address
     */
    public function ip(): string
    {
        $keys = [
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];

        foreach ($keys as $key) {
            if (isset($this->serverParams[$key])) {
                $ips = explode(',', $this->serverParams[$key]);
                return trim($ips[0]);
            }
        }

        return '0.0.0.0';
    }

    /**
     * Get user agent
     */
    public function userAgent(): string
    {
        return $this->serverParams['HTTP_USER_AGENT'] ?? '';
    }

    /**
     * Get uploaded file
     */
    public function file(string $key): ?array
    {
        return $_FILES[$key] ?? null;
    }

    /**
     * Check if file was uploaded
     */
    public function hasFile(string $key): bool
    {
        return isset($_FILES[$key]) && $_FILES[$key]['error'] === UPLOAD_ERR_OK;
    }

    /**
     * Parse request headers
     */
    private function parseHeaders(): array
    {
        $headers = [];
        
        foreach ($this->serverParams as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $headerKey = str_replace('_', '-', substr($key, 5));
                $headers[strtolower($headerKey)] = $value;
            }
        }
        
        // Add Content-Type if present
        if (isset($this->serverParams['CONTENT_TYPE'])) {
            $headers['content-type'] = $this->serverParams['CONTENT_TYPE'];
        }
        
        return $headers;
    }

    /**
     * Parse JSON body
     */
    private function parseJsonBody(): ?array
    {
        $input = file_get_contents('php://input');
        
        if (empty($input)) {
            return null;
        }
        
        $decoded = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }
        
        return $decoded;
    }

    /**
     * Validate input against rules
     */
    public function validate(array $rules): array
    {
        $errors = [];
        $data = $this->all();

        foreach ($rules as $field => $ruleSet) {
            $ruleList = is_string($ruleSet) ? explode('|', $ruleSet) : $ruleSet;
            $value = $data[$field] ?? null;

            foreach ($ruleList as $rule) {
                if ($rule === 'required' && empty($value)) {
                    $errors[$field][] = "{$field} is required";
                }
            }
        }

        return $errors;
    }
}
