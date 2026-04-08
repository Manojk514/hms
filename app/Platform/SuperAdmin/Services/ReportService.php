<?php

/**
 * Report Service
 * Read-only reporting logic for platform-level metrics
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Config\Database;
use PDO;

class ReportService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Get revenue report by hospital
     * 
     * @param array $filters Filter criteria
     * @return array Revenue breakdown by hospital
     */
    public function getRevenueReport(array $filters): array
    {
        $sql = "
            SELECT 
                h.id,
                h.hospital_code,
                h.name,
                h.city,
                h.state,
                COUNT(DISTINCT hs.id) as subscription_count,
                SUM(CASE WHEN hs.payment_status = 'PAID' THEN hs.amount ELSE 0 END) as total_revenue,
                SUM(CASE WHEN hs.payment_status = 'PENDING' THEN hs.amount ELSE 0 END) as pending_revenue,
                MAX(hs.end_date) as last_subscription_end
            FROM hospitals h
            LEFT JOIN hospital_subscriptions hs ON h.id = hs.hospital_id
        ";

        $where = ['h.deleted_at IS NULL'];
        $params = [];

        // Date range filter
        if (!empty($filters['date_from'])) {
            $where[] = 'hs.created_at >= :date_from';
            $params['date_from'] = $filters['date_from'];
        }

        if (!empty($filters['date_to'])) {
            $where[] = 'hs.created_at <= :date_to';
            $params['date_to'] = $filters['date_to'] . ' 23:59:59';
        }

        // Status filter
        if (!empty($filters['status'])) {
            $where[] = 'h.status = :status';
            $params['status'] = $filters['status'];
        }

        // City filter
        if (!empty($filters['city'])) {
            $where[] = 'h.city LIKE :city';
            $params['city'] = '%' . $filters['city'] . '%';
        }

        // State filter
        if (!empty($filters['state'])) {
            $where[] = 'h.state LIKE :state';
            $params['state'] = '%' . $filters['state'] . '%';
        }

        $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' GROUP BY h.id, h.hospital_code, h.name, h.city, h.state';
        $sql .= ' ORDER BY total_revenue DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate totals
        $totalRevenue = 0;
        $totalPending = 0;
        foreach ($results as $row) {
            $totalRevenue += (float)$row['total_revenue'];
            $totalPending += (float)$row['pending_revenue'];
        }

        return [
            'hospitals' => $results,
            'summary' => [
                'total_hospitals' => count($results),
                'total_revenue' => $totalRevenue,
                'pending_revenue' => $totalPending,
            ],
        ];
    }

    /**
     * Get subscription renewals due report
     * 
     * @param int $daysThreshold Days until expiration
     * @return array Hospitals with expiring subscriptions
     */
    public function getSubscriptionRenewalsReport(int $daysThreshold = 30): array
    {
        $sql = "
            SELECT 
                h.id,
                h.hospital_code,
                h.name,
                h.email,
                h.phone,
                h.city,
                h.state,
                h.status,
                hs.end_date,
                hs.billing_cycle,
                hs.amount,
                hs.auto_renew,
                sp.name as plan_name,
                DATEDIFF(hs.end_date, CURDATE()) as days_remaining,
                CASE 
                    WHEN DATEDIFF(hs.end_date, CURDATE()) <= 7 THEN 'URGENT'
                    WHEN DATEDIFF(hs.end_date, CURDATE()) <= 15 THEN 'HIGH'
                    ELSE 'MEDIUM'
                END as urgency
            FROM hospitals h
            INNER JOIN hospital_subscriptions hs ON h.id = hs.hospital_id
            INNER JOIN subscription_plans sp ON hs.plan_id = sp.id
            WHERE h.deleted_at IS NULL
            AND hs.is_active = 1
            AND hs.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL :days DAY)
            ORDER BY hs.end_date ASC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['days' => $daysThreshold]);

        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Group by urgency
        $byUrgency = [
            'URGENT' => [],
            'HIGH' => [],
            'MEDIUM' => [],
        ];

        foreach ($results as $row) {
            $byUrgency[$row['urgency']][] = $row;
        }

        return [
            'subscriptions' => $results,
            'by_urgency' => $byUrgency,
            'summary' => [
                'total' => count($results),
                'urgent' => count($byUrgency['URGENT']),
                'high' => count($byUrgency['HIGH']),
                'medium' => count($byUrgency['MEDIUM']),
            ],
        ];
    }

    /**
     * Get system usage statistics report
     * 
     * @param array $filters Filter criteria
     * @return array System usage metrics
     */
    public function getUsageReport(array $filters): array
    {
        // Hospital statistics by status
        $hospitalStats = $this->getHospitalStatsByStatus();

        // Module adoption statistics
        $moduleStats = $this->getModuleAdoptionStats();

        // Subscription statistics by billing cycle
        $subscriptionStats = $this->getSubscriptionStatsByBillingCycle();

        // Revenue trends (last 12 months)
        $revenueTrends = $this->getRevenueTrends();

        // Growth metrics
        $growthMetrics = $this->getGrowthMetrics();

        return [
            'hospitals' => $hospitalStats,
            'modules' => $moduleStats,
            'subscriptions' => $subscriptionStats,
            'revenue_trends' => $revenueTrends,
            'growth' => $growthMetrics,
        ];
    }

    /**
     * Get hospital statistics by status
     * 
     * @return array Hospital counts by status
     */
    private function getHospitalStatsByStatus(): array
    {
        $sql = "
            SELECT 
                status,
                COUNT(*) as count
            FROM hospitals
            WHERE deleted_at IS NULL
            GROUP BY status
        ";

        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stats = [];
        foreach ($results as $row) {
            $stats[$row['status']] = (int)$row['count'];
        }

        return $stats;
    }

    /**
     * Get module adoption statistics
     * 
     * @return array Module usage by hospital
     */
    private function getModuleAdoptionStats(): array
    {
        $sql = "
            SELECT 
                module_code,
                COUNT(*) as enabled_count,
                (SELECT COUNT(*) FROM hospitals WHERE deleted_at IS NULL) as total_hospitals,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM hospitals WHERE deleted_at IS NULL), 2) as adoption_rate
            FROM hospital_modules
            WHERE is_enabled = 1
            GROUP BY module_code
            ORDER BY enabled_count DESC
        ";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get subscription statistics by billing cycle
     * 
     * @return array Subscription counts by billing cycle
     */
    private function getSubscriptionStatsByBillingCycle(): array
    {
        $sql = "
            SELECT 
                billing_cycle,
                COUNT(*) as count,
                SUM(amount) as total_value
            FROM hospital_subscriptions
            WHERE is_active = 1
            AND end_date >= CURDATE()
            GROUP BY billing_cycle
        ";

        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stats = [];
        foreach ($results as $row) {
            $stats[$row['billing_cycle']] = [
                'count' => (int)$row['count'],
                'total_value' => (float)$row['total_value'],
            ];
        }

        return $stats;
    }

    /**
     * Get revenue trends for last 12 months
     * 
     * @return array Monthly revenue data
     */
    private function getRevenueTrends(): array
    {
        $sql = "
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as subscription_count,
                SUM(CASE WHEN payment_status = 'PAID' THEN amount ELSE 0 END) as revenue
            FROM hospital_subscriptions
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        ";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get growth metrics
     * 
     * @return array Growth statistics
     */
    private function getGrowthMetrics(): array
    {
        // Hospitals created this month
        $thisMonthSql = "
            SELECT COUNT(*) as count
            FROM hospitals
            WHERE MONTH(created_at) = MONTH(CURDATE())
            AND YEAR(created_at) = YEAR(CURDATE())
            AND deleted_at IS NULL
        ";

        $stmt = $this->db->query($thisMonthSql);
        $thisMonth = $stmt->fetch(PDO::FETCH_ASSOC);

        // Hospitals created last month
        $lastMonthSql = "
            SELECT COUNT(*) as count
            FROM hospitals
            WHERE MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            AND deleted_at IS NULL
        ";

        $stmt = $this->db->query($lastMonthSql);
        $lastMonth = $stmt->fetch(PDO::FETCH_ASSOC);

        // Calculate growth rate
        $thisMonthCount = (int)$thisMonth['count'];
        $lastMonthCount = (int)$lastMonth['count'];
        $growthRate = $lastMonthCount > 0 
            ? round((($thisMonthCount - $lastMonthCount) / $lastMonthCount) * 100, 2)
            : 0;

        // Revenue growth
        $revenueThisMonthSql = "
            SELECT SUM(amount) as total
            FROM hospital_subscriptions
            WHERE payment_status = 'PAID'
            AND MONTH(created_at) = MONTH(CURDATE())
            AND YEAR(created_at) = YEAR(CURDATE())
        ";

        $stmt = $this->db->query($revenueThisMonthSql);
        $revenueThisMonth = $stmt->fetch(PDO::FETCH_ASSOC);

        $revenueLastMonthSql = "
            SELECT SUM(amount) as total
            FROM hospital_subscriptions
            WHERE payment_status = 'PAID'
            AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        ";

        $stmt = $this->db->query($revenueLastMonthSql);
        $revenueLastMonth = $stmt->fetch(PDO::FETCH_ASSOC);

        $revenueThisMonthTotal = (float)($revenueThisMonth['total'] ?? 0);
        $revenueLastMonthTotal = (float)($revenueLastMonth['total'] ?? 0);
        $revenueGrowthRate = $revenueLastMonthTotal > 0
            ? round((($revenueThisMonthTotal - $revenueLastMonthTotal) / $revenueLastMonthTotal) * 100, 2)
            : 0;

        return [
            'hospitals' => [
                'this_month' => $thisMonthCount,
                'last_month' => $lastMonthCount,
                'growth_rate' => $growthRate,
            ],
            'revenue' => [
                'this_month' => $revenueThisMonthTotal,
                'last_month' => $revenueLastMonthTotal,
                'growth_rate' => $revenueGrowthRate,
            ],
        ];
    }
}
