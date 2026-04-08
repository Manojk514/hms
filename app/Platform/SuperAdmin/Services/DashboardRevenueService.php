<?php

/**
 * Dashboard Revenue Service
 * Calculates revenue ONLY from hospital_subscriptions table
 * 
 * Architecture Rules:
 * - Revenue is calculated from hospital_subscriptions.amount (actual subscription amount)
 * - Only ACTIVE subscriptions are counted (status = 'ACTIVE', is_active = 1, not expired)
 * - Only hospitals with status = 'ACTIVE' are included
 * - Use SQL aggregation (SUM, COUNT, GROUP BY)
 * - NO mock values, NO hardcoded data
 * - NULL-safe calculations with COALESCE
 * - Clean JSON responses
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Config\Database;
use PDO;

class DashboardRevenueService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Get comprehensive dashboard revenue statistics
     * 
     * @return array Revenue statistics with all required metrics
     */
    public function getDashboardStatistics(): array
    {
        $stats = [
            'total_monthly_revenue' => $this->getTotalMonthlyRevenue(),
            'active_hospital_count' => $this->getActiveHospitalCount(),
            'average_revenue_per_hospital' => 0.0,
            'top_performing_plan' => $this->getTopPerformingPlan()
        ];

        // Calculate average (NULL-safe)
        if ($stats['active_hospital_count'] > 0) {
            $stats['average_revenue_per_hospital'] = 
                $stats['total_monthly_revenue'] / $stats['active_hospital_count'];
        }

        // Add formatted values
        $stats['formatted'] = [
            'total_monthly_revenue' => '₹' . number_format($stats['total_monthly_revenue'], 2),
            'average_revenue_per_hospital' => '₹' . number_format($stats['average_revenue_per_hospital'], 2)
        ];

        return $stats;
    }

    /**
     * Get total monthly revenue from ACTIVE hospital subscriptions
     * 
     * Calculation:
     * - Sum amount from hospital_subscriptions
     * - Convert to monthly based on billing_cycle
     * - Only ACTIVE subscriptions (status='ACTIVE', is_active=1, not expired)
     * - Only ACTIVE hospitals
     * 
     * @return float Total monthly revenue
     */
    private function getTotalMonthlyRevenue(): float
    {
        $sql = "
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN hs.billing_cycle = 'MONTHLY' THEN hs.amount
                        WHEN hs.billing_cycle = 'QUARTERLY' THEN hs.amount / 3
                        WHEN hs.billing_cycle = 'SEMI_ANNUAL' THEN hs.amount / 6
                        WHEN hs.billing_cycle = 'ANNUAL' THEN hs.amount / 12
                        ELSE 0
                    END
                ), 0) as total_monthly_revenue
            FROM hospital_subscriptions hs
            INNER JOIN hospitals h ON hs.hospital_id = h.id
            WHERE hs.status = 'ACTIVE'
            AND hs.is_active = 1
            AND (hs.end_date IS NULL OR hs.end_date >= CURDATE())
            AND h.status = 'ACTIVE'
            AND h.deleted_at IS NULL
        ";
        
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (float)($result['total_monthly_revenue'] ?? 0);
    }

    /**
     * Get count of ACTIVE hospitals with active subscriptions
     * 
     * @return int Active hospital count
     */
    private function getActiveHospitalCount(): int
    {
        $sql = "
            SELECT 
                COUNT(DISTINCT hs.hospital_id) as count
            FROM hospital_subscriptions hs
            INNER JOIN hospitals h ON hs.hospital_id = h.id
            WHERE hs.status = 'ACTIVE'
            AND hs.is_active = 1
            AND (hs.end_date IS NULL OR hs.end_date >= CURDATE())
            AND h.status = 'ACTIVE'
            AND h.deleted_at IS NULL
        ";
        
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int)($result['count'] ?? 0);
    }

    /**
     * Get average monthly revenue per ACTIVE hospital
     * 
     * @return float Average revenue per hospital
     */
    public function getAverageRevenuePerHospital(): float
    {
        $totalRevenue = $this->getTotalMonthlyRevenue();
        $activeCount = $this->getActiveHospitalCount();
        
        if ($activeCount === 0) {
            return 0.0;
        }
        
        return $totalRevenue / $activeCount;
    }

    /**
     * Get top performing subscription plan by total revenue
     * 
     * Returns the plan contributing the highest total revenue
     * from ACTIVE subscriptions only
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
                COUNT(DISTINCT hs.hospital_id) as active_hospital_count,
                COALESCE(SUM(hs.amount), 0) as total_revenue,
                COALESCE(SUM(
                    CASE 
                        WHEN hs.billing_cycle = 'MONTHLY' THEN hs.amount
                        WHEN hs.billing_cycle = 'QUARTERLY' THEN hs.amount / 3
                        WHEN hs.billing_cycle = 'SEMI_ANNUAL' THEN hs.amount / 6
                        WHEN hs.billing_cycle = 'ANNUAL' THEN hs.amount / 12
                        ELSE 0
                    END
                ), 0) as total_monthly_revenue
            FROM hospital_subscriptions hs
            INNER JOIN subscription_plans sp ON hs.plan_id = sp.id
            INNER JOIN hospitals h ON hs.hospital_id = h.id
            WHERE hs.status = 'ACTIVE'
            AND hs.is_active = 1
            AND (hs.end_date IS NULL OR hs.end_date >= CURDATE())
            AND h.status = 'ACTIVE'
            AND h.deleted_at IS NULL
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
            'total_monthly_revenue' => (float)$result['total_monthly_revenue']
        ];
    }

    /**
     * Get revenue breakdown by subscription plan
     * 
     * @return array Revenue by plan
     */
    public function getRevenueByPlan(): array
    {
        $sql = "
            SELECT 
                sp.id,
                sp.plan_code,
                sp.plan_name,
                sp.price as plan_price,
                COUNT(DISTINCT hs.hospital_id) as active_hospital_count,
                COALESCE(SUM(hs.amount), 0) as total_revenue,
                COALESCE(SUM(
                    CASE 
                        WHEN hs.billing_cycle = 'MONTHLY' THEN hs.amount
                        WHEN hs.billing_cycle = 'QUARTERLY' THEN hs.amount / 3
                        WHEN hs.billing_cycle = 'SEMI_ANNUAL' THEN hs.amount / 6
                        WHEN hs.billing_cycle = 'ANNUAL' THEN hs.amount / 12
                        ELSE 0
                    END
                ), 0) as total_monthly_revenue
            FROM subscription_plans sp
            LEFT JOIN hospital_subscriptions hs ON sp.id = hs.plan_id
                AND hs.status = 'ACTIVE'
                AND hs.is_active = 1
                AND (hs.end_date IS NULL OR hs.end_date >= CURDATE())
            LEFT JOIN hospitals h ON hs.hospital_id = h.id
                AND h.status = 'ACTIVE'
                AND h.deleted_at IS NULL
            WHERE sp.is_active = 1
            GROUP BY sp.id, sp.plan_code, sp.plan_name, sp.price
            ORDER BY total_revenue DESC
        ";
        
        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $totalRevenue = $this->getTotalMonthlyRevenue();
        
        $revenueByPlan = [];
        foreach ($results as $row) {
            $monthlyRevenue = (float)$row['total_monthly_revenue'];
            
            $revenueByPlan[] = [
                'plan_id' => (int)$row['id'],
                'plan_code' => $row['plan_code'],
                'plan_name' => $row['plan_name'],
                'plan_price' => (float)$row['plan_price'],
                'active_hospital_count' => (int)$row['active_hospital_count'],
                'total_revenue' => (float)$row['total_revenue'],
                'total_monthly_revenue' => $monthlyRevenue,
                'percentage_of_total' => $totalRevenue > 0 
                    ? ($monthlyRevenue / $totalRevenue) * 100 
                    : 0.0,
                'formatted' => [
                    'total_revenue' => '₹' . number_format((float)$row['total_revenue'], 2),
                    'total_monthly_revenue' => '₹' . number_format($monthlyRevenue, 2)
                ]
            ];
        }
        
        return $revenueByPlan;
    }

    /**
     * Get detailed hospital-wise revenue
     * 
     * @return array Hospital revenue details
     */
    public function getHospitalRevenueDetails(): array
    {
        $sql = "
            SELECT 
                h.id as hospital_id,
                h.code as hospital_code,
                h.name as hospital_name,
                h.status as hospital_status,
                sp.plan_name,
                hs.amount as subscription_amount,
                hs.billing_cycle,
                hs.start_date,
                hs.end_date,
                CASE 
                    WHEN hs.billing_cycle = 'MONTHLY' THEN hs.amount
                    WHEN hs.billing_cycle = 'QUARTERLY' THEN hs.amount / 3
                    WHEN hs.billing_cycle = 'SEMI_ANNUAL' THEN hs.amount / 6
                    WHEN hs.billing_cycle = 'ANNUAL' THEN hs.amount / 12
                    ELSE 0
                END as monthly_revenue
            FROM hospital_subscriptions hs
            INNER JOIN hospitals h ON hs.hospital_id = h.id
            INNER JOIN subscription_plans sp ON hs.plan_id = sp.id
            WHERE hs.status = 'ACTIVE'
            AND hs.is_active = 1
            AND (hs.end_date IS NULL OR hs.end_date >= CURDATE())
            AND h.status = 'ACTIVE'
            AND h.deleted_at IS NULL
            ORDER BY monthly_revenue DESC
        ";
        
        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $hospitalRevenue = [];
        foreach ($results as $row) {
            $hospitalRevenue[] = [
                'hospital_id' => (int)$row['hospital_id'],
                'hospital_code' => $row['hospital_code'],
                'hospital_name' => $row['hospital_name'],
                'hospital_status' => $row['hospital_status'],
                'plan_name' => $row['plan_name'],
                'subscription_amount' => (float)$row['subscription_amount'],
                'billing_cycle' => $row['billing_cycle'],
                'start_date' => $row['start_date'],
                'end_date' => $row['end_date'],
                'monthly_revenue' => (float)$row['monthly_revenue'],
                'formatted' => [
                    'subscription_amount' => '₹' . number_format((float)$row['subscription_amount'], 2),
                    'monthly_revenue' => '₹' . number_format((float)$row['monthly_revenue'], 2)
                ]
            ];
        }
        
        return $hospitalRevenue;
    }
}
