<?php

/**
 * Super Admin Authorization Middleware
 * Ensures user has SUPER_ADMIN role
 */

declare(strict_types=1);

namespace App\Platform\Middleware;

use App\Core\Middleware;
use App\Core\Request;
use App\Core\Response;

class SuperAdminMiddleware implements Middleware
{
    /**
     * Handle Super Admin authorization
     * 
     * Note: This middleware must run AFTER AuthMiddleware
     */
    public function handle(Request $request, Response $response): void
    {
        // Check if user was authenticated by AuthMiddleware
        if (!isset($request->userRole)) {
            $response->unauthorized('Authorization token is required', 'MISSING_TOKEN');
            return;
        }

        // Verify user has SUPER_ADMIN role
        if ($request->userRole !== 'SUPER_ADMIN') {
            $response->forbidden('You do not have permission to access this resource', 'INSUFFICIENT_PERMISSIONS');
            return;
        }

        // User is authorized as Super Admin
        // Request can proceed to controller
    }
}
