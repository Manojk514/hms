<?php

/**
 * Revenue Controller
 * Handles revenue calculation and statistics API endpoints
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Controllers;

use App\Core\Controller;
use App\Core\Request;
use App\Core\Response;
use App\Platform\SuperAdmin\Services\RevenueCalculationService;
use App\Platform\SuperAdmin\Services\RevenueExportService;

class RevenueController extends Controller
{
    private RevenueCalculationService $revenueService;
    private RevenueExportService $exportService;

    public function __construct(Request $request, Response $response)
    {
        parent::__construct($request, $response);
        $this->revenueService = new RevenueCalculationService();
        $this->exportService = new RevenueExportService();
    }

    /**
     * Get comprehensive revenue statistics
     * GET /api/platform/admin/revenue/statistics
     */
    public function statistics(): void
    {
        try {
            $statistics = $this->revenueService->getRevenueStatistics();
            
            $this->response->success([
                'statistics' => $statistics
            ]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get revenue summary for dashboard
     * GET /api/platform/admin/revenue/summary
     */
    public function summary(): void
    {
        try {
            $summary = $this->revenueService->getRevenueSummary();
            
            $this->response->success([
                'summary' => $summary
            ]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get revenue trend over time
     * GET /api/platform/admin/revenue/trend
     */
    public function trend(): void
    {
        try {
            $trend = $this->revenueService->getRevenueTrend();
            
            $this->response->success([
                'trend' => $trend
            ]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Export revenue report to CSV
     * GET /api/platform/admin/revenue/export
     * 
     * Query parameters:
     * - mode: 'current' (with filters) or 'all' (default, ignore filters)
     * - status: Filter by status (optional)
     * - plan: Filter by plan name (optional)
     * - hospital_code: Filter by hospital code (optional)
     * - hospital_name: Filter by hospital name (optional)
     */
    public function export(): void
    {
        try {
            // Get export mode from query parameter
            $mode = $this->request->getQuery('mode', 'all');
            
            // Validate mode
            if (!in_array($mode, ['current', 'all'])) {
                $mode = 'all';
            }
            
            // Get filters from query parameters
            $filters = [];
            if ($mode === 'current') {
                $filters = [
                    'status' => $this->request->getQuery('status', ''),
                    'plan' => $this->request->getQuery('plan', ''),
                    'hospital_code' => $this->request->getQuery('hospital_code', ''),
                    'hospital_name' => $this->request->getQuery('hospital_name', '')
                ];
                
                // Remove empty filters
                $filters = array_filter($filters, function($value) {
                    return $value !== '';
                });
            }
            
            // Generate CSV content
            $csvContent = $this->exportService->generateRevenueCSV($mode, $filters);
            
            // Get filename
            $filename = $this->exportService->getFilename($mode);
            
            // Set headers for CSV download
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Cache-Control: no-cache, must-revalidate');
            header('Expires: 0');
            header('Pragma: public');
            
            // Output CSV content
            echo $csvContent;
            exit;

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get export statistics (for preview before download)
     * GET /api/platform/admin/revenue/export-stats
     */
    public function exportStats(): void
    {
        try {
            $mode = $this->request->getQuery('mode', 'all');
            
            if (!in_array($mode, ['current', 'all'])) {
                $mode = 'all';
            }
            
            $filters = [];
            if ($mode === 'current') {
                $filters = [
                    'status' => $this->request->getQuery('status', ''),
                    'plan' => $this->request->getQuery('plan', ''),
                    'hospital_code' => $this->request->getQuery('hospital_code', ''),
                    'hospital_name' => $this->request->getQuery('hospital_name', '')
                ];
                
                $filters = array_filter($filters, function($value) {
                    return $value !== '';
                });
            }
            
            $stats = $this->exportService->getExportStatistics($mode, $filters);
            
            $this->response->success([
                'statistics' => $stats
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
        error_log('RevenueController Error: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());

        $this->response->serverError('An error occurred while calculating revenue');
    }
}
