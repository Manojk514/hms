<?php

/**
 * Subscription Plan Controller
 * Handles subscription plan API endpoints
 * 
 * Read-only controller - no create/update/delete operations
 * Secured for Super Admin access only
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Platform\SuperAdmin\Services\SubscriptionPlanService;

class SubscriptionPlanController extends Controller
{
    private SubscriptionPlanService $planService;

    public function __construct(Request $request, Response $response)
    {
        parent::__construct($request, $response);
        $this->planService = new SubscriptionPlanService();
    }

    /**
     * Get all active subscription plans
     * GET /api/platform/admin/subscription-plans
     * 
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "plans": [
     *       {
     *         "id": 1,
     *         "code": "BASIC",
     *         "name": "Basic Plan",
     *         "description": "...",
     *         "pricing": {
     *           "amount": 10000.00,
     *           "currency": "INR",
     *           "billing_cycle": "ANNUAL",
     *           "formatted": "₹10,000.00/year"
     *         },
     *         "limits": {
     *           "max_users": 50,
     *           "max_patients": 1000,
     *           "storage_gb": 10
     *         },
     *         "features": {
     *           "is_featured": false,
     *           "display_order": 1
     *         },
     *         "modules": ["OPD", "IPD", "PHARMACY"],
     *         "metadata": {
     *           "created_at": "2024-01-01 00:00:00",
     *           "updated_at": null
     *         }
     *       }
     *     ],
     *     "count": 3
     *   }
     * }
     */
    public function index(): void
    {
        try {
            $plans = $this->planService->getAllActivePlans();
            
            $this->response->success([
                'plans' => $plans,
                'count' => count($plans)
            ]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get subscription plan by ID
     * GET /api/platform/admin/subscription-plans/{id}
     * 
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "plan": { ... }
     *   }
     * }
     */
    public function show(array $params): void
    {
        try {
            $planId = (int)$params['id'];
            
            $plan = $this->planService->getPlanById($planId);
            
            if (!$plan) {
                $this->response->notFound('Subscription plan not found');
                return;
            }
            
            $this->response->success(['plan' => $plan]);

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
        error_log('SubscriptionPlanController Error: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());

        $statusCode = $e->getCode();
        
        if ($statusCode === 404) {
            $this->response->notFound($e->getMessage());
        } elseif ($statusCode === 403) {
            $this->response->forbidden($e->getMessage());
        } elseif ($statusCode === 422) {
            $this->response->unprocessableEntity($e->getMessage());
        } else {
            $this->response->serverError('An error occurred while processing your request');
        }
    }

    /**
     * Create a new subscription plan
     * POST /api/platform/admin/plans
     * 
     * Request body:
     * {
     *   "plan_name": "Enterprise Plan",
     *   "description": "Full-featured plan for large hospitals",
     *   "price": 25000,
     *   "billing_cycle": "ANNUAL",
     *   "modules": ["OP", "LAB", "PHARMACY", "BILLING", "IPD"],
     *   "max_users": 100,
     *   "max_patients": 50000,
     *   "storage_gb": 50
     * }
     */
    public function create(): void
    {
        try {
            $data = $this->request->body();
            
            // Validate required fields
            if (empty($data['plan_name'])) {
                $this->response->validationError(
                    ['plan_name' => 'Plan name is required'],
                    'Validation failed'
                );
                return;
            }
            
            if (empty($data['price']) || $data['price'] <= 0) {
                $this->response->validationError(
                    ['price' => 'Valid price is required'],
                    'Validation failed'
                );
                return;
            }
            
            // Create plan
            $plan = $this->planService->createPlan($data);
            
            $this->response->created([
                'plan' => $plan,
                'message' => 'Subscription plan created successfully'
            ]);
            
        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Delete a subscription plan
     * DELETE /api/platform/admin/plans/{id}
     */
    public function delete(array $params): void
    {
        try {
            $planId = (int)$params['id'];
            
            $this->planService->deletePlan($planId);
            
            $this->response->success([
                'message' => 'Subscription plan deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }
}
