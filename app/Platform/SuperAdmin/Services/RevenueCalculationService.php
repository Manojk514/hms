<?php

/**
 * Revenue Calculation Service
 * Calculates estimated subscription revenue based on ACTIVE hospitals only
 * 
 * Rules:
 * - Revenue is estimated from subscription plans, not actual payments
 * - Only hospitals with status = 'ACTIVE' are included
 * - No hardcoded values
 * - NULL-safe calculations
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Config\Database;
use PDO;

class RevenueCalculationService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Get comprehensive revenue statistics
     * 
     * @return array Revenue statistics
     */
    public function getRevenueStatistics(): array
    {
        return [
            'total_revenue' => $this->getTotalRevenue(),
            'active_hospital_count' => $this->getActiveHospitalCount(),
            'average_revenue_per_hospital' => $this->getAverageRevenuePerHospital(),
            'top_performing_plan' => $this->getTopPerformingPlan(),
            'revenue_by_plan' => $this->getRevenueByPlan(),
            'monthly_revenue' => $this->getMonthlyRevenue(),
            'annual_revenue' => $this->getAnnualRevenue()
        ];
    }

    /**
     * Get total annual revenue from ACTIVE hospitals
     * 
     * @return float Total annual revenue
     */
    private function getTotalRevenue(): float
    {
        $sql = "
            SELECT 
                COALESCE(SUM(sp.price), 0) as total_revenue
            FROM hospitals h
            INNER JOIN subscription_plans sp ON h.subscription = sp.plan_name
            WHERE h.status = 'ACTIVE'
            AND h.deleted_at IS NULL
            AND sp.is_active = 1
        ";
        
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (float)($result['total_revenue'] ?? 0);
    }

    /**
     * Get count of ACTIVE hospitals with subscriptions
     * 
     * @return int Active hospital count
     */
    private function getActiveHospitalCount(): int
    {
        $sql = "
            SELECT 
                COUNT(*) as count
            FROM hospitals h
            INNER JOIN subscription_plans sp ON h.subscription = sp.plan_name
            WHERE h.status = 'ACTIVE'
            AND h.deleted_at IS NULL
            AND sp.is_active = 1
        ";
        
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int)($result['count'] ?? 0);
    }

    /**
     * Get average annual revenue per ACTIVE hospital
     * 
     * @return float Average revenue per hospital
     */
    private function getAverageRevenuePerHospital(): float
    {
        $totalRevenue = $this->getTotalRevenue();
        $activeCount = $this->getActiveHospitalCount();
        
        // NULL-safe division
        if ($activeCount === 0) {
            return 0.0;
        }
        
        return $totalRevenue / $activeCount;
    }

    /**
     * Get top performing subscription plan
     * Returns the plan contributing the highest total revenue
     * 
     * @return array|null Top performing plan details
     */
    private function getTopPerformingPlan(): ?array
    {
        $sql = "
            SELECT 
                sp.id,
                sp.plan_code,
                sp.plan_name,
                sp.price as plan_price,
                COUNT(h.id) as active_hospital_count,
                COALESCE(SUM(sp.price), 0) as total_revenue,
                COALESCE(AVG(sp.price), 0) as avg_revenue
            FROM subscription_plans sp
            INNER JOIN hospitals h ON sp.plan_name = h.subscription
            WHERE h.status = 'ACTIVE'
            AND h.deleted_at IS NULL
            AND sp.is_active = 1
            GROUP BY sp.id, sp.plan_code, sp.plan_name, sp.price
            ORDER BY total_revenue DESC
            LIMIT 1
        ";
        
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return null;
        }
        
        return [
            'plan_id' => (int)$result['id'],
            'plan_code' => $result['plan_code'],
            'plan_name' => $result['plan_name'],
            'plan_price' => (float)$result['plan_price'],
            'active_hospital_count' => (int)$result['active_hospital_count'],
            'total_revenue' => (float)$result['total_revenue'],
            'average_revenue' => (float)$result['avg_revenue']
        ];
    }

    /**
     * Get revenue breakdown by subscription plan
     * 
     * @return array Revenue by plan
     */
    private function getRevenueByPlan(): array
    {
        $sql = "
            SELECT 
                sp.id,
                sp.plan_code,
                sp.plan_name,
                sp.price as plan_price,
                sp.billing_cycle,
                COUNT(h.id) as active_hospital_count,
                COALESCE(SUM(sp.price), 0) as total_annual_revenue,
                COALESCE(SUM(
                    CASE 
                        WHEN sp.billing_cycle = 'MONTHLY' THEN sp.price
                        WHEN sp.billing_cycle = 'QUARTERLY' THEN sp.price / 3
                        WHEN sp.billing_cycle = 'SEMI_ANNUAL' THEN sp.price / 6
                        WHEN sp.billing_cycle = 'ANNUAL' THEN sp.price / 12
                        ELSE 0
                    END
                ), 0) as total_monthly_revenue
            FROM subscription_plans sp
            LEFT JOIN hospitals h ON sp.plan_name = h.subscription
                AND h.status = 'ACTIVE'
                AND h.deleted_at IS NULL
            WHERE sp.is_active = 1
            GROUP BY sp.id, sp.plan_code, sp.plan_name, sp.price, sp.billing_cycle
            ORDER BY total_annual_revenue DESC
        ";
        
        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $revenueByPlan = [];
        foreach ($results as $row) {
            $revenueByPlan[] = [
                'plan_id' => (int)$row['id'],
                'plan_code' => $row['plan_code'],
                'plan_name' => $row['plan_name'],
                'plan_price' => (float)$row['plan_price'],
                'billing_cycle' => $row['billing_cycle'],
                'active_hospital_count' => (int)$row['active_hospital_count'],
                'total_annual_revenue' => (float)$row['total_annual_revenue'],
                'total_monthly_revenue' => (float)$row['total_monthly_revenue'],
                'percentage_of_total' => $this->calculatePercentage(
                    (float)$row['total_annual_revenue'],
                    $this->getTotalRevenue()
                )
            ];
        }
        
        return $revenueByPlan;
    }

    /**
     * Get total monthly revenue from ACTIVE hospitals
     * 
     * @return float Total monthly revenue
     */
    private function getMonthlyRevenue(): float
    {
        $sql = "
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN sp.billing_cycle = 'MONTHLY' THEN sp.price
                        WHEN sp.billing_cycle = 'QUARTERLY' THEN sp.price / 3
                        WHEN sp.billing_cycle = 'SEMI_ANNUAL' THEN sp.price / 6
                        WHEN sp.billing_cycle = 'ANNUAL' THEN sp.price / 12
                        ELSE 0
                    END
                ), 0) as monthly_revenue
            FROM hospitals h
            INNER JOIN subscription_plans sp ON h.subscription = sp.plan_name
            WHERE h.status = 'ACTIVE'
            AND h.deleted_at IS NULL
            AND sp.is_active = 1
        ";
        
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (float)($result['monthly_revenue'] ?? 0);
    }

    /**
     * Get total annual revenue from ACTIVE hospitals
     * (Alias for getTotalRevenue for clarity)
     * 
     * @return float Total annual revenue
     */
    private function getAnnualRevenue(): float
    {
        return $this->getTotalRevenue();
    }

    /**
     * Calculate percentage (NULL-safe)
     * 
     * @param float $part Part value
     * @param float $total Total value
     * @return float Percentage
     */
    private function calculatePercentage(float $part, float $total): float
    {
        if ($total === 0.0) {
            return 0.0;
        }
        
        return ($part / $total) * 100;
    }

    /**
     * Get revenue trend over time (last 12 months)
     * Note: This is estimated based on current subscriptions
     * 
     * @return array Monthly revenue trend
     */
    public function getRevenueTrend(): array
    {
        // Since we don't have historical data, we'll return current monthly revenue
        // In a real system, this would query historical subscription data
        
        $monthlyRevenue = $this->getMonthlyRevenue();
        
        $trend = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = date('Y-m', strtotime("-$i months"));
            $trend[] = [
                'month' => $date,
                'revenue' => $monthlyRevenue, // Estimated
                'is_estimated' => true
            ];
        }
        
        return $trend;
    }

    /**
     * Get revenue summary for dashboard
     * 
     * @return array Revenue summary
     */
    public function getRevenueSummary(): array
    {
        $totalRevenue = $this->getTotalRevenue();
        $monthlyRevenue = $this->getMonthlyRevenue();
        $activeCount = $this->getActiveHospitalCount();
        $avgRevenue = $this->getAverageRevenuePerHospital();
        $topPlan = $this->getTopPerformingPlan();
        
        return [
            'total_annual_revenue' => $totalRevenue,
            'total_monthly_revenue' => $monthlyRevenue,
            'active_hospital_count' => $activeCount,
            'average_annual_revenue_per_hospital' => $avgRevenue,
            'average_monthly_revenue_per_hospital' => $activeCount > 0 ? $monthlyRevenue / $activeCount : 0,
            'top_performing_plan' => $topPlan,
            'formatted' => [
                'total_annual_revenue' => '₹' . number_format($totalRevenue, 2),
                'total_monthly_revenue' => '₹' . number_format($monthlyRevenue, 2),
                'average_annual_revenue_per_hospital' => '₹' . number_format($avgRevenue, 2),
                'average_monthly_revenue_per_hospital' => $activeCount > 0 
                    ? '₹' . number_format($monthlyRevenue / $activeCount, 2) 
                    : '₹0.00'
            ]
        ];
    }
}
