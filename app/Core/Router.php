<?php

/**
 * Router
 * Maps HTTP method + path to controller actions
 */

declare(strict_types=1);

namespace App\Core;

class Router
{
    private array $routes = [];
    private array $middlewares = [];

    /**
     * Register GET route
     */
    public function get(string $path, string $controller, string $method): self
    {
        $this->addRoute('GET', $path, $controller, $method);
        return $this;
    }

    /**
     * Register POST route
     */
    public function post(string $path, string $controller, string $method): self
    {
        $this->addRoute('POST', $path, $controller, $method);
        return $this;
    }

    /**
     * Register PUT route
     */
    public function put(string $path, string $controller, string $method): self
    {
        $this->addRoute('PUT', $path, $controller, $method);
        return $this;
    }

    /**
     * Register PATCH route
     */
    public function patch(string $path, string $controller, string $method): self
    {
        $this->addRoute('PATCH', $path, $controller, $method);
        return $this;
    }

    /**
     * Register DELETE route
     */
    public function delete(string $path, string $controller, string $method): self
    {
        $this->addRoute('DELETE', $path, $controller, $method);
        return $this;
    }

    /**
     * Add route to registry
     */
    private function addRoute(string $httpMethod, string $path, string $controller, string $method): void
    {
        $this->routes[] = [
            'method' => $httpMethod,
            'path' => $path,
            'controller' => $controller,
            'action' => $method,
            'middlewares' => [],
        ];
    }

    /**
     * Register middleware for last added route
     */
    public function middleware(array $middlewares): self
    {
        if (!empty($this->routes)) {
            $lastIndex = count($this->routes) - 1;
            $this->routes[$lastIndex]['middlewares'] = $middlewares;
        }

        return $this;
    }

    /**
     * Register global middleware
     */
    public function addGlobalMiddleware(string $middleware): void
    {
        $this->middlewares[] = $middleware;
    }

    /**
     * Dispatch request to appropriate controller
     */
    public function dispatch(): void
    {
        $request = new Request();
        $response = new Response();

        $httpMethod = $request->method();
        $uri = $request->path();

        // Find matching route
        $route = $this->matchRoute($httpMethod, $uri);

        if ($route === null) {
            $response->notFound([
                'code' => 'ROUTE_NOT_FOUND',
                'message' => 'The requested endpoint does not exist',
                'details' => []
            ]);
            return;
        }

        try {
            // Execute global middlewares
            foreach ($this->middlewares as $middlewareClass) {
                $middleware = new $middlewareClass();
                $middleware->handle($request, $response);
            }

            // Execute route-specific middlewares
            foreach ($route['middlewares'] as $middlewareClass) {
                $middleware = new $middlewareClass();
                $middleware->handle($request, $response);
            }

            // Instantiate controller and call action
            $controllerClass = $route['controller'];
            $action = $route['action'];
            $params = $route['params'];

            if (!class_exists($controllerClass)) {
                throw new \Exception("Controller {$controllerClass} not found");
            }

            $controller = new $controllerClass($request, $response);

            if (!method_exists($controller, $action)) {
                throw new \Exception("Method {$action} not found in {$controllerClass}");
            }

            // Call controller action with route parameters
            if (empty($params)) {
                // No parameters - call method directly
                $controller->$action();
            } else {
                // Has parameters - pass them as arguments
                call_user_func_array([$controller, $action], [$params]);
            }

        } catch (\Exception $e) {
            error_log('Router error: ' . $e->getMessage());
            $response->error([
                'code' => 'INTERNAL_SERVER_ERROR',
                'message' => config('app.debug') 
                    ? $e->getMessage() 
                    : 'An unexpected error occurred. Please try again later.',
                'details' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : []
            ], 500);
        }
    }

    /**
     * Match route based on HTTP method and URI
     */
    private function matchRoute(string $httpMethod, string $uri): ?array
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $httpMethod) {
                continue;
            }

            $pattern = $this->convertPathToRegex($route['path']);
            
            if (preg_match($pattern, $uri, $matches)) {
                // Extract route parameters
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                
                return [
                    'controller' => $route['controller'],
                    'action' => $route['action'],
                    'middlewares' => $route['middlewares'],
                    'params' => $params,
                ];
            }
        }

        return null;
    }

    /**
     * Convert route path to regex pattern
     * Supports {id}, {code}, etc. as named parameters
     */
    private function convertPathToRegex(string $path): string
    {
        // Escape forward slashes
        $pattern = str_replace('/', '\/', $path);
        
        // Convert {param} to named capture groups
        $pattern = preg_replace('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', '(?P<$1>[^\/]+)', $pattern);
        
        return '/^' . $pattern . '$/';
    }
}
