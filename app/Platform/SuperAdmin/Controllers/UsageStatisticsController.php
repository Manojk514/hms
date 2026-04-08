<?php

/**
 * Usage Statistics Controller
 * Handles system usage statistics API endpoints
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Platform\SuperAdmin\Services\UsageStatisticsService;

class UsageStatisticsController extends Controller
{
    private UsageStatisticsService $usageService;

    public function __construct(Request $request, Response $response)
    {
        parent::__construct($request, $response);
        $this->usageService = new UsageStatisticsService();
    }

    /**
     * Get comprehensive usage statistics
     * GET /api/platform/admin/usage/statistics
     */
    public function statistics(): void
    {
        try {
            $statistics = $this->usageService->getUsageStatistics();
            
            $this->response->success([
                'statistics' => $statistics
            ]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get usage summary for dashboard
     * GET /api/platform/admin/usage/summary
     */
    public function summary(): void
    {
        try {
            $summary = $this->usageService->getUsageSummary();
            
            $this->response->success([
                'summary' => $summary
            ]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get detailed hospital usage
     * GET /api/platform/admin/usage/hospitals
     */
    public function hospitalDetails(): void
    {
        try {
            $details = $this->usageService->getHospitalUsageDetails();
            
            $this->response->success([
                'hospitals' => $details
            ]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get module adoption trend
     * GET /api/platform/admin/usage/adoption-trend
     */
    public function adoptionTrend(): void
    {
        try {
            $trend = $this->usageService->getModuleAdoptionTrend();
            
            $this->response->success([
                'trend' => $trend
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
        error_log('UsageStatisticsController Error: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());

        $this->response->serverError('An error occurred while calculating usage statistics');
    }
}
