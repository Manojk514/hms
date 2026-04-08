<?php

/**
 * Active Subscription Controller
 * Handles HTTP requests for active subscriptions
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Platform\SuperAdmin\Services\ActiveSubscriptionService;

class ActiveSubscriptionController extends Controller
{
    private ActiveSubscriptionService $subscriptionService;

    public function __construct(Request $request, Response $response)
    {
        parent::__construct($request, $response);
        $this->subscriptionService = new ActiveSubscriptionService();
    }

    /**
     * Get all active subscriptions
     * 
     * GET /api/platform/admin/subscriptions/active
     */
    public function list(): void
    {
        try {
            $subscriptions = $this->subscriptionService->getActiveSubscriptions();
            
            $this->response->success([
                'subscriptions' => $subscriptions,
                'total' => count($subscriptions)
            ]);
            
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
        error_log('ActiveSubscriptionController Error: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());

        $this->response->serverError('An error occurred while retrieving active subscriptions');
    }
}
