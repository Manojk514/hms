<?php

/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard statistics
 * 
 * Returns clean JSON responses with revenue data from hospital_subscriptions
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Controllers;

use App\Core\Controller;
use App\Platform\SuperAdmin\Services\DashboardRevenueService;

class DashboardController extends Controller
{
    private DashboardRevenueService $revenueService;

    public function __construct($request, $response)
    {
        parent::__construct($request, $response);
        $this->revenueService = new DashboardRevenueService();
    }

    /**
     * Get dashboard statistics
     * GET /api/platform/admin/dashboard/statistics
     * 
     * Returns:
     * - total_monthly_revenue: Total monthly revenue from all active subscriptions
     * - active_hospital_count: Count of hospitals with active subscriptions
     * - average_revenue_per_hospital: Average monthly revenue per hospital
     * - top_performing_plan: Plan generating highest revenue
     */
    public function statistics(): void
    {
        try {
            $statistics = $this->revenueService->getDashboardStatistics();
            
            $this->response->success([
                'statistics' => $statistics
            ]);

        } catch (\Exception $e) {
            error_log('Dashboard statistics error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            $this->response->serverError(
                config('app.debug') ? $e->getMessage() : 'An unexpected error occurred. Please try again later.'
            );
        }
    }

    /**
     * Get revenue breakdown by plan
     * GET /api/platform/admin/dashboard/revenue-by-plan
     * 
     * Returns revenue statistics grouped by subscription plan
     */
    public function revenueByPlan(): void
    {
        try {
            $revenueByPlan = $this->revenueService->getRevenueByPlan();
            
            $this->response->success([
                'revenue_by_plan' => $revenueByPlan
            ]);

        } catch (\Exception $e) {
            error_log('Revenue by plan error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            $this->response->serverError(
                config('app.debug') ? $e->getMessage() : 'An unexpected error occurred. Please try again later.'
            );
        }
    }

    /**
     * Get hospital-wise revenue details
     * GET /api/platform/admin/dashboard/hospital-revenue
     * 
     * Returns detailed revenue information for each hospital
     */
    public function hospitalRevenue(): void
    {
        try {
            $hospitalRevenue = $this->revenueService->getHospitalRevenueDetails();
            
            $this->response->success([
                'hospital_revenue' => $hospitalRevenue,
                'total_hospitals' => count($hospitalRevenue)
            ]);

        } catch (\Exception $e) {
            error_log('Hospital revenue error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            $this->response->serverError(
                config('app.debug') ? $e->getMessage() : 'An unexpected error occurred. Please try again later.'
            );
        }
    }
}
