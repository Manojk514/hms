<?php

/**
 * Health Check Controller
 * Simple endpoint to verify API is running
 */

declare(strict_types=1);

namespace App\Platform\Controllers;

use App\Core\Controller;
use App\Config\Database;

class HealthController extends Controller
{
    /**
     * Health check endpoint
     * GET /api/health
     */
    public function check(): void
    {
        $dbStatus = Database::testConnection();

        $this->success([
            'status' => 'ok',
            'timestamp' => date('Y-m-d H:i:s'),
            'database' => $dbStatus ? 'connected' : 'disconnected',
            'environment' => config('app.env'),
        ]);
    }
}
