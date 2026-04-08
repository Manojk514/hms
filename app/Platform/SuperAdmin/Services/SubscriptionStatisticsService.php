<?php

/**
 * Subscription Statistics Service
 * Business logic for subscription statistics and metrics
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Platform\SuperAdmin\Repositories\SubscriptionRepository;
use App\Config\Database;
use PDO;

class SubscriptionStatisticsService
{
    private PDO $db;
    private SubscriptionRepository $subscriptionRepo;

    public function __construct()
    {
        $this->db = Database::getConnection();
        $this->subscriptionRepo = new SubscriptionRepository();
    }

    /**
     * Get subscription statistics
     * 
     * @return array Statistics data
     */
    public function getStatistics(): array
    {
        return [
            'total_subscriptions' => $this->getTotalHospitalsWithSubscription(),
            'active_subscriptions' => $this->getActiveHospitalsWithSubscription(),
            'monthly_revenue' => $this->getMonthlyRevenueFromHospitals(),
            'expiring_soon' => $this->getExpiringSoon(30),
            'plan_statistics' => $this->getPlanStatisticsFromHospitals()
        ];
    }

    /**
     * Get total number of hospitals (all hospitals with subscriptions assigned)
     * 
     * @return int Total hospitals with subscriptions
     */
    private function getTotalHospitalsWithSubscription(): int
    {
        $sql = "
            SELECT COUNT(*) as total
            FROM hospitals
            WHERE deleted_at IS NULL
            AND subscription IS NOT NULL
            AND subscription != ''
        ";
        
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int)$result['total'];
    }

    /**
     * Get number of ACTIVE hospitals with subscriptions
     * 
     * @return int Active hospitals
     */
    private function getActiveHospitalsWithSubscription(): int
    {
        $sql = "
            SELECT COUNT(*) as total
            FROM hospitals
            WHERE deleted_at IS NULL
            AND status = 'ACTIVE'
            AND subscription IS NOT NULL
            AND subscription != ''
        ";
        
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int)$result['total'];
    }

    /**
     * Get monthly revenue based on ACTIVE hospitals' subscription plans only
     * 
     * @return float Monthly revenue
     */
    private function getMonthlyRevenueFromHospitals(): float
    {
        $sql = "
            SELECT 
                SUM(
                    CASE 
                        WHEN sp.billing_cycle = 'MONTHLY' THEN sp.price
                        WHEN sp.billing_cycle = 'QUARTERLY' THEN sp.price / 3
                        WHEN sp.billing_cycle = 'SEMI_ANNUAL' THEN sp.price / 6
                        WHEN sp.billing_cycle = 'ANNUAL' THEN sp.price / 12
                        ELSE 0
                    END
                ) as monthly_revenue
            FROM hospitals h
            INNER JOIN subscription_plans sp ON h.subscription = sp.plan_name
            WHERE h.deleted_at IS NULL
            AND h.status = 'ACTIVE'
            AND h.subscription IS NOT NULL
            AND h.subscription != ''
            AND sp.is_active = 1
        ";
        
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (float)($result['monthly_revenue'] ?? 0);
    }

    /**
     * Get subscriptions expiring soon
     * 
     * @param int $days Number of days
     * @return int Count of expiring subscriptions
     */
    private function getExpiringSoon(int $days): int
    {
        $sql = "
            SELECT COUNT(*) as total
            FROM hospital_subscriptions
            WHERE status = 'ACTIVE'
            AND is_active = 1
            AND end_date >= CURDATE()
            AND end_date <= DATE_ADD(CURDATE(), INTERVAL :days DAY)
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['days' => $days]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return (int)$result['total'];
    }

    /**
     * Get statistics per plan based on hospitals.subscription field
     * Only counts ACTIVE hospitals for both count and revenue
     * 
     * @return array Plan statistics
     */
    private function getPlanStatisticsFromHospitals(): array
    {
        $sql = "
            SELECT 
                sp.id,
                sp.plan_code,
                sp.plan_name,
                COUNT(h.id) as hospital_count,
                SUM(
                    CASE 
                        WHEN h.id IS NOT NULL THEN
                            CASE 
                                WHEN sp.billing_cycle = 'MONTHLY' THEN sp.price
                                WHEN sp.billing_cycle = 'QUARTERLY' THEN sp.price / 3
                                WHEN sp.billing_cycle = 'SEMI_ANNUAL' THEN sp.price / 6
                                WHEN sp.billing_cycle = 'ANNUAL' THEN sp.price / 12
                                ELSE 0
                            END
                        ELSE 0
                    END
                ) as monthly_revenue
            FROM subscription_plans sp
            LEFT JOIN hospitals h ON sp.plan_name = h.subscription
                AND h.deleted_at IS NULL
                AND h.status = 'ACTIVE'
            WHERE sp.is_active = 1
            GROUP BY sp.id, sp.plan_code, sp.plan_name
            ORDER BY sp.display_order ASC, sp.price ASC
        ";
        
        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $statistics = [];
        foreach ($results as $row) {
            $statistics[$row['plan_code']] = [
                'plan_id' => (int)$row['id'],
                'plan_name' => $row['plan_name'],
                'hospital_count' => (int)$row['hospital_count'],
                'monthly_revenue' => (float)($row['monthly_revenue'] ?? 0)
            ];
        }
        
        return $statistics;
    }
}
