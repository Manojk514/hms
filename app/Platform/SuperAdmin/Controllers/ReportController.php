<?php

/**
 * Report Controller
 * Handles HTTP requests for reports
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Controllers;

use App\Core\Controller;
use App\Platform\SuperAdmin\Services\ReportService;
use App\Utils\Validator;

class ReportController extends Controller
{
    private ReportService $reportService;

    public function __construct($request, $response)
    {
        parent::__construct($request, $response);
        $this->reportService = new ReportService();
    }

    /**
     * Get revenue report by hospital
     * GET /api/platform/admin/reports/revenue
     */
    public function revenue(): void
    {
        try {
            // Get filter parameters
            $filters = [
                'date_from' => $this->query('date_from'),
                'date_to' => $this->query('date_to'),
                'status' => $this->query('status'),
                'city' => $this->query('city'),
                'state' => $this->query('state'),
            ];

            // Validate date filters
            $errors = $this->validateDateFilters($filters);
            if (!empty($errors)) {
                $this->response->validationError($errors);
                return;
            }

            // Validate status filter
            if (!empty($filters['status']) && !Validator::hospitalStatus($filters['status'])) {
                $this->response->validationError([
                    'status' => ['Invalid status value']
                ]);
                return;
            }

            $report = $this->reportService->getRevenueReport($filters);
            $this->response->success($report);

        } catch (\Exception $e) {
            error_log('Revenue report error: ' . $e->getMessage());
            $this->response->serverError(
                config('app.debug') ? $e->getMessage() : 'An unexpected error occurred. Please try again later.'
            );
        }
    }

    /**
     * Get subscription renewals due report
     * GET /api/platform/admin/reports/renewals
     */
    public function renewals(): void
    {
        try {
            // Get days threshold parameter
            $days = (int)$this->query('days', 30);

            // Validate days parameter
            if ($days < 1 || $days > 365) {
                $this->response->validationError([
                    'days' => ['Days must be between 1 and 365']
                ]);
                return;
            }

            $report = $this->reportService->getSubscriptionRenewalsReport($days);
            $this->response->success($report);

        } catch (\Exception $e) {
            error_log('Renewals report error: ' . $e->getMessage());
            $this->response->serverError(
                config('app.debug') ? $e->getMessage() : 'An unexpected error occurred. Please try again later.'
            );
        }
    }

    /**
     * Get system usage statistics report
     * GET /api/platform/admin/reports/usage
     */
    public function usage(): void
    {
        try {
            // Get filter parameters (for future use)
            $filters = [
                'date_from' => $this->query('date_from'),
                'date_to' => $this->query('date_to'),
            ];

            // Validate date filters
            $errors = $this->validateDateFilters($filters);
            if (!empty($errors)) {
                $this->response->validationError($errors);
                return;
            }

            $report = $this->reportService->getUsageReport($filters);
            $this->response->success($report);

        } catch (\Exception $e) {
            error_log('Usage report error: ' . $e->getMessage());
            $this->response->serverError(
                config('app.debug') ? $e->getMessage() : 'An unexpected error occurred. Please try again later.'
            );
        }
    }

    /**
     * Export revenue report to CSV
     * GET /api/platform/admin/reports/revenue/export
     * 
     * Query parameters:
     * - scope: 'current' or 'all' (default: 'all')
     * 
     * Returns CSV file download (no JSON response)
     */
    public function revenueExport(): void
    {
        try {
            // Get scope parameter
            $scope = $this->query('scope', 'all');
            
            // Validate scope
            if (!in_array($scope, ['current', 'all'])) {
                // For invalid scope, send error as plain text (not JSON)
                header('Content-Type: text/plain; charset=utf-8');
                http_response_code(400);
                echo "Invalid scope parameter. Use 'current' or 'all'.";
                exit;
            }
            
            // Import the export service
            require_once __DIR__ . '/../Services/RevenueExportService.php';
            $exportService = new \App\Platform\SuperAdmin\Services\RevenueExportService();
            
            // Determine mode based on scope
            $mode = $scope; // 'current' or 'all'
            
            // Get filters if scope is 'current'
            $filters = [];
            if ($scope === 'current') {
                $filters = [
                    'status' => $this->query('status', ''),
                    'plan' => $this->query('plan', ''),
                    'hospital_code' => $this->query('hospital_code', ''),
                    'hospital_name' => $this->query('hospital_name', '')
                ];
                
                // Remove empty filters
                $filters = array_filter($filters, function($value) {
                    return $value !== '';
                });
            }
            
            // Generate CSV content (may throw exception if no data)
            $csvContent = $exportService->generateRevenueCSV($mode, $filters);
            
            // Get filename
            $filename = $exportService->getFilename($mode);
            
            // Set headers for CSV download
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Cache-Control: no-cache, must-revalidate');
            header('Expires: 0');
            header('Pragma: public');
            header('Content-Length: ' . strlen($csvContent));
            
            // Output CSV content and exit
            echo $csvContent;
            exit;

        } catch (\Exception $e) {
            // Log error
            error_log('Revenue export error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            // Check if this is an empty data error
            $errorMessage = $e->getMessage();
            if (strpos($errorMessage, 'No data available') !== false) {
                // Send user-friendly error for empty data
                header('Content-Type: text/plain; charset=utf-8');
                http_response_code(404);
                echo $errorMessage;
            } else {
                // Send generic error for other issues
                header('Content-Type: text/plain; charset=utf-8');
                http_response_code(500);
                echo "An error occurred while generating the export. Please try again later.";
            }
            exit;
        }
    }

    /**
     * Validate date filters
     * 
     * @param array $filters Filter parameters
     * @return array Validation errors
     */
    private function validateDateFilters(array $filters): array
    {
        $errors = [];

        // Validate date_from
        if (!empty($filters['date_from']) && !Validator::date($filters['date_from'])) {
            $errors['date_from'][] = 'Invalid date format. Use YYYY-MM-DD';
        }

        // Validate date_to
        if (!empty($filters['date_to']) && !Validator::date($filters['date_to'])) {
            $errors['date_to'][] = 'Invalid date format. Use YYYY-MM-DD';
        }

        // Validate date range
        if (!empty($filters['date_from']) && !empty($filters['date_to'])) {
            if ($filters['date_from'] > $filters['date_to']) {
                $errors['date_from'][] = 'Start date must be before or equal to end date';
            }

            // Check if range is not too large (max 5 years)
            $dateFrom = new \DateTime($filters['date_from']);
            $dateTo = new \DateTime($filters['date_to']);
            $diff = $dateFrom->diff($dateTo);
            
            if ($diff->y > 5) {
                $errors['date_from'][] = 'Date range cannot exceed 5 years';
            }
        }

        return $errors;
    }
}
