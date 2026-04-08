<?php

/**
 * Dashboard Service
 * Read-only aggregation logic for platform-level metrics
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Config\Database;
use PDO;

class DashboardService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Get dashboard statistics
     * 
     * @return array Dashboard data
     */
    public function getDashboardStats(): array
    {
        return [
            'hospitals' => $this->getHospitalStats(),
            'revenue' => $this->getRevenueStats(),
            'subscriptions' => $this->getSubscriptionStats(),
            'modules' => $this->getModuleStats(),
            'recent_activities' => $this->getRecentActivities(),
        ];
    }

    /**
     * Get hospital statistics
     * 
     * @return array Hospital counts by status
     */
    private function getHospitalStats(): array
    {
        $sql = "
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending
            FROM hospitals
            WHERE deleted_at IS NULL
        ";

        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'total' => (int)$result['total'],
            'active' => (int)$result['active'],
            'inactive' => (int)$result['inactive'],
            'pending' => (int)$result['pending'],
        ];
    }

    /**
     * Get revenue statistics
     * 
     * @return array Revenue metrics
     */
    private function getRevenueStats(): array
    {
        // Monthly Recurring Revenue (MRR)
        $mrrSql = "
            SELECT 
                SUM(
                    CASE 
                        WHEN billing_cycle = 'MONTHLY' THEN amount
                        WHEN billing_cycle = 'ANNUAL' THEN amount / 12
                        ELSE 0
                    END
                ) as mrr
            FROM hospital_subscriptions
            WHERE is_active = 1
            AND end_date >= CURDATE()
            AND payment_status = 'PAID'
        ";

        $stmt = $this->db->query($mrrSql);
        $mrrResult = $stmt->fetch(PDO::FETCH_ASSOC);

        // Total revenue this month
        $monthlyRevenueSql = "
            SELECT SUM(amount) as total
            FROM hospital_subscriptions
            WHERE payment_status = 'PAID'
            AND MONTH(created_at) = MONTH(CURDATE())
            AND YEAR(created_at) = YEAR(CURDATE())
        ";

        $stmt = $this->db->query($monthlyRevenueSql);
        $monthlyResult = $stmt->fetch(PDO::FETCH_ASSOC);

        // Total revenue all time
        $totalRevenueSql = "
            SELECT SUM(amount) as total
            FROM hospital_subscriptions
            WHERE payment_status = 'PAID'
        ";

        $stmt = $this->db->query($totalRevenueSql);
        $totalResult = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'mrr' => (float)($mrrResult['mrr'] ?? 0),
            'this_month' => (float)($monthlyResult['total'] ?? 0),
            'total' => (float)($totalResult['total'] ?? 0),
        ];
    }

    /**
     * Get subscription statistics
     * 
     * @return array Subscription metrics
     */
    private function getSubscriptionStats(): array
    {
        // Active subscriptions
        $activeSql = "
            SELECT COUNT(DISTINCT hospital_id) as total
            FROM hospital_subscriptions
            WHERE is_active = 1
            AND end_date >= CURDATE()
        ";

        $stmt = $this->db->query($activeSql);
        $activeResult = $stmt->fetch(PDO::FETCH_ASSOC);

        // Expiring soon (next 30 days)
        $expiringSql = "
            SELECT COUNT(DISTINCT hospital_id) as total
            FROM hospital_subscriptions
            WHERE is_active = 1
            AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        ";

        $stmt = $this->db->query($expiringSql);
        $expiringResult = $stmt->fetch(PDO::FETCH_ASSOC);

        // Expired subscriptions
        $expiredSql = "
            SELECT COUNT(DISTINCT hospital_id) as total
            FROM hospital_subscriptions hs1
            WHERE NOT EXISTS (
                SELECT 1 FROM hospital_subscriptions hs2
                WHERE hs2.hospital_id = hs1.hospital_id
                AND hs2.is_active = 1
                AND hs2.end_date >= CURDATE()
            )
            AND EXISTS (
                SELECT 1 FROM hospitals h
                WHERE h.id = hs1.hospital_id
                AND h.deleted_at IS NULL
            )
        ";

        $stmt = $this->db->query($expiredSql);
        $expiredResult = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'active' => (int)$activeResult['total'],
            'expiring_soon' => (int)$expiringResult['total'],
            'expired' => (int)$expiredResult['total'],
        ];
    }

    /**
     * Get module adoption statistics
     * 
     * @return array Module usage metrics
     */
    private function getModuleStats(): array
    {
        // TODO: Fix this query to match actual database schema
        // The table has module_id instead of module_code
        return [];
        
        /*
        $sql = "
            SELECT 
                module_code,
                COUNT(*) as hospital_count
            FROM hospital_modules
            WHERE is_enabled = 1
            GROUP BY module_code
            ORDER BY hospital_count DESC
        ";

        $stmt = $this->db->query($sql);
        $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = [];
        foreach ($modules as $module) {
            $result[$module['module_code']] = (int)$module['hospital_count'];
        }

        return $result;
        */
    }

    /**
     * Get recent activities from audit log
     * 
     * @param int $limit Number of activities to return
     * @return array Recent activities
     */
    private function getRecentActivities(int $limit = 10): array
    {
        $sql = "
            SELECT 
                al.action_type as action,
                al.entity_type as resource_type,
                al.entity_id as resource_id,
                al.created_at,
                sa.name as actor_name,
                h.name as hospital_name,
                h.hospital_code
            FROM platform_audit_logs al
            LEFT JOIN platform_super_admins sa ON al.actor_id = sa.id
            LEFT JOIN hospitals h ON al.entity_id = h.id AND al.entity_type = 'HOSPITAL'
            WHERE al.actor_type = 'SUPER_ADMIN'
            AND al.action_type NOT IN ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT')
            ORDER BY al.created_at DESC
            LIMIT :limit
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format activities
        return array_map(function ($activity) {
            return [
                'action' => $activity['action'],
                'description' => $this->formatActivityDescription($activity),
                'actor' => $activity['actor_name'],
                'timestamp' => $activity['created_at'],
            ];
        }, $activities);
    }

    /**
     * Format activity description
     * 
     * @param array $activity Activity data
     * @return string Formatted description
     */
    private function formatActivityDescription(array $activity): string
    {
        $action = $activity['action'];
        $hospitalName = $activity['hospital_name'] ?? 'Unknown Hospital';

        return match ($action) {
            'HOSPITAL_CREATED' => "Created hospital '{$hospitalName}'",
            'HOSPITAL_UPDATED' => "Updated hospital '{$hospitalName}'",
            'HOSPITAL_STATUS_CHANGED' => "Changed status of '{$hospitalName}'",
            'HOSPITAL_DELETED' => "Deleted hospital '{$hospitalName}'",
            'SUBSCRIPTION_CREATED' => "Created subscription for '{$hospitalName}'",
            'MODULE_ENABLED' => "Enabled module for '{$hospitalName}'",
            'MODULE_DISABLED' => "Disabled module for '{$hospitalName}'",
            'MODULES_BULK_UPDATED' => "Updated modules for '{$hospitalName}'",
            default => $action,
        };
    }

    /**
     * Get hospital-wise statistics
     * 
     * @param int $limit Number of hospitals to return
     * @return array Hospital statistics
     */
    public function getHospitalWiseStats(int $limit = 10): array
    {
        $sql = "
            SELECT 
                h.id,
                h.hospital_code,
                h.name,
                h.status,
                h.created_at,
                COUNT(DISTINCT hm.module_code) as enabled_modules,
                hs.end_date as subscription_end_date,
                sp.name as plan_name
            FROM hospitals h
            LEFT JOIN hospital_modules hm ON h.id = hm.hospital_id AND hm.is_enabled = 1
            LEFT JOIN hospital_subscriptions hs ON h.id = hs.hospital_id 
                AND hs.is_active = 1 
                AND hs.end_date >= CURDATE()
            LEFT JOIN subscription_plans sp ON hs.plan_id = sp.id
            WHERE h.deleted_at IS NULL
            GROUP BY h.id, h.hospital_code, h.name, h.status, h.created_at, hs.end_date, sp.name
            ORDER BY h.created_at DESC
            LIMIT :limit
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
