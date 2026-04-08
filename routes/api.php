<?php

/**
 * API Routes
 * Define all API endpoints here
 */

declare(strict_types=1);

use App\Core\Router;

$router = new Router();

// Health check endpoint (no authentication required)
$router->get('/api/health', 'App\Platform\Controllers\HealthController', 'check');

// Load Super Admin routes
$superAdminRoutes = require_once APP_PATH . '/Platform/SuperAdmin/routes.php';
$superAdminRoutes($router);

return $router;
