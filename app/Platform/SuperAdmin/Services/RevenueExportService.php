<?php

/**
 * Revenue Export Service
 * Generates CSV exports for revenue reports
 * 
 * Rules:
 * - Generate CSV files (Excel-compatible)
 * - Fetch data from database (same logic as revenue report)
 * - No hardcoded values
 * - Proper CSV formatting and escaping
 * - No external Excel libraries
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Platform\SuperAdmin\Services\ActiveSubscriptionService;

class RevenueExportService
{
    private ActiveSubscriptionService $subscriptionService;

    public function __construct()
    {
        $this->subscriptionService = new ActiveSubscriptionService();
    }

    /**
     * Generate CSV export for revenue report
     * 
     * @param string $mode Export mode: 'current' (with filters) or 'all' (ignore filters)
     * @param array $filters Optional filters (status, plan, etc.)
     * @return string CSV content
     * @throws \Exception If no data available to export
     */
    public function generateRevenueCSV(string $mode = 'all', array $filters = []): string
    {
        // Fetch subscription data (same logic as revenue report)
        $subscriptions = $this->subscriptionService->getActiveSubscriptions();
        
        // Apply filters if mode is 'current'
        if ($mode === 'current' && !empty($filters)) {
            $subscriptions = $this->applyFilters($subscriptions, $filters);
        }
        
        // Validate that we have data to export
        if (empty($subscriptions)) {
            throw new \Exception('No data available to export. Please adjust your filters or add hospitals with active subscriptions.');
        }
        
        // Generate CSV content
        return $this->buildCSV($subscriptions);
    }

    /**
     * Apply filters to subscription data
     * 
     * @param array $subscriptions Subscription data
     * @param array $filters Filters to apply
     * @return array Filtered subscriptions
     */
    private function applyFilters(array $subscriptions, array $filters): array
    {
        $filtered = $subscriptions;
        
        // Filter by status
        if (!empty($filters['status'])) {
            $filtered = array_filter($filtered, function($sub) use ($filters) {
                return $sub['status'] === $filters['status'];
            });
        }
        
        // Filter by plan
        if (!empty($filters['plan'])) {
            $filtered = array_filter($filtered, function($sub) use ($filters) {
                return $sub['plan_name'] === $filters['plan'];
            });
        }
        
        // Filter by hospital code
        if (!empty($filters['hospital_code'])) {
            $filtered = array_filter($filtered, function($sub) use ($filters) {
                return stripos($sub['hospital_code'], $filters['hospital_code']) !== false;
            });
        }
        
        // Filter by hospital name
        if (!empty($filters['hospital_name'])) {
            $filtered = array_filter($filtered, function($sub) use ($filters) {
                return stripos($sub['hospital_name'], $filters['hospital_name']) !== false;
            });
        }
        
        return array_values($filtered); // Re-index array
    }

    /**
     * Build CSV content from subscription data
     * 
     * @param array $subscriptions Subscription data
     * @return string CSV content
     */
    private function buildCSV(array $subscriptions): string
    {
        // Start output buffering
        ob_start();
        $output = fopen('php://output', 'w');
        
        // Add BOM for Excel UTF-8 compatibility
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Write CSV header
        $headers = [
            'Hospital Name',
            'Hospital Code',
            'Subscription Plan',
            'Monthly Revenue',
            'YTD Revenue',
            'Status'
        ];
        fputcsv($output, $headers);
        
        // Write data rows
        foreach ($subscriptions as $subscription) {
            $row = [
                $this->escapeCsvValue($subscription['hospital_name']),
                $this->escapeCsvValue($subscription['hospital_code']),
                $this->escapeCsvValue($subscription['plan_name']),
                $this->formatCurrency($subscription['monthly_cost']),
                $this->formatCurrency($subscription['annual_cost']),
                $this->escapeCsvValue($subscription['status'])
            ];
            fputcsv($output, $row);
        }
        
        fclose($output);
        
        // Get CSV content
        $csvContent = ob_get_clean();
        
        return $csvContent;
    }

    /**
     * Escape CSV value to prevent formula injection
     * 
     * @param mixed $value Value to escape
     * @return string Escaped value
     */
    private function escapeCsvValue($value): string
    {
        if ($value === null) {
            return '';
        }
        
        $value = (string)$value;
        
        // Prevent CSV formula injection
        // If value starts with =, +, -, @, tab, or carriage return, prefix with single quote
        if (preg_match('/^[=+\-@\t\r]/', $value)) {
            $value = "'" . $value;
        }
        
        return $value;
    }

    /**
     * Format currency value for CSV
     * 
     * @param float $amount Amount to format
     * @return string Formatted amount
     */
    private function formatCurrency(float $amount): string
    {
        // Format as number with 2 decimal places
        // Don't include currency symbol to keep it Excel-friendly
        return number_format($amount, 2, '.', '');
    }

    /**
     * Get filename for CSV export
     * 
     * @param string $mode Export mode
     * @return string Filename
     */
    public function getFilename(string $mode = 'all'): string
    {
        $timestamp = date('Y-m-d_His');
        $modeLabel = $mode === 'current' ? 'filtered' : 'all';
        
        return "revenue_report_{$modeLabel}_{$timestamp}.csv";
    }

    /**
     * Get export statistics
     * 
     * @param string $mode Export mode
     * @param array $filters Optional filters
     * @return array Export statistics
     */
    public function getExportStatistics(string $mode = 'all', array $filters = []): array
    {
        $subscriptions = $this->subscriptionService->getActiveSubscriptions();
        
        if ($mode === 'current' && !empty($filters)) {
            $subscriptions = $this->applyFilters($subscriptions, $filters);
        }
        
        $totalMonthlyRevenue = 0;
        $totalAnnualRevenue = 0;
        
        foreach ($subscriptions as $subscription) {
            $totalMonthlyRevenue += $subscription['monthly_cost'];
            $totalAnnualRevenue += $subscription['annual_cost'];
        }
        
        return [
            'total_records' => count($subscriptions),
            'total_monthly_revenue' => $totalMonthlyRevenue,
            'total_annual_revenue' => $totalAnnualRevenue,
            'export_mode' => $mode,
            'filters_applied' => !empty($filters),
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}
