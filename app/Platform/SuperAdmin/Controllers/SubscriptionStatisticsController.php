<?php

/**
 * Subscription Statistics Controller
 * Handles subscription statistics API endpoints
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Platform\SuperAdmin\Services\SubscriptionStatisticsService;

class SubscriptionStatisticsController extends Controller
{
    private SubscriptionStatisticsService $statsService;

    public function __construct(Request $request, Response $response)
    {
        parent::__construct($request, $response);
        $this->statsService = new SubscriptionStatisticsService();
    }

    /**
     * Get subscription statistics
     * GET /api/platform/admin/subscriptions/statistics
     * 
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "total_subscriptions": 10,
     *     "active_subscriptions": 8,
     *     "monthly_revenue": 50000.00,
     *     "expiring_soon": 2,
     *     "plan_statistics": {
     *       "BASIC": {
     *         "plan_id": 1,
     *         "plan_name": "Basic Plan",
     *         "hospital_count": 3,
     *         "monthly_revenue": 15000.00
     *       }
     *     }
     *   }
     * }
     */
    public function index(): void
    {
        try {
            $statistics = $this->statsService->getStatistics();
            
            $this->response->success($statistics);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Handle exceptions
     * 
     * @param \Exception $e Exception
     */
    private function handleException(\Exception $e): void
    {
        error_log('SubscriptionStatisticsController Error: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());

        $this->response->serverError('An error occurred while processing your request');
    }
}
