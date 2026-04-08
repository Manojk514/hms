<?php

/**
 * Active Subscription Service
 * Business logic for listing active hospital subscriptions
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Config\Database;
use PDO;

class ActiveSubscriptionService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Get all active subscriptions
     * Returns hospitals with subscription plans assigned
     * 
     * @return array List of active subscriptions
     */
    public function getActiveSubscriptions(): array
    {
        $sql = "
            SELECT 
                h.id,
                h.hospital_code,
                h.name as hospital_name,
                h.subscription as plan_name,
                h.status,
                h.created_at,
                sp.price,
                sp.billing_cycle,
                sp.plan_code,
                MAX(hs.start_date) as start_date,
                MAX(hs.end_date) as end_date,
                MAX(hs.payment_status) as payment_status
            FROM hospitals h
            INNER JOIN subscription_plans sp ON h.subscription = sp.plan_name
            LEFT JOIN hospital_subscriptions hs ON h.id = hs.hospital_id 
                AND hs.is_active = 1 
                AND hs.end_date >= CURDATE()
            WHERE h.deleted_at IS NULL
            AND h.subscription IS NOT NULL
            AND h.subscription != ''
            AND sp.is_active = 1
            GROUP BY h.id, h.hospital_code, h.name, h.subscription, h.status, 
                     h.created_at, sp.price, sp.billing_cycle, sp.plan_code
            ORDER BY h.created_at DESC
        ";
        
        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $subscriptions = [];
        foreach ($results as $row) {
            // Calculate monthly cost
            $annualPrice = (float)$row['price'];
            $monthlyCost = $annualPrice / 12;
            
            // Use subscription dates if available, otherwise use hospital created date
            $startDate = $row['start_date'] ?? $row['created_at'];
            $endDate = $row['end_date'] ?? $this->calculateEndDate($startDate);
            
            $subscriptions[] = [
                'id' => (int)$row['id'],
                'hospital_code' => $row['hospital_code'],
                'hospital_name' => $row['hospital_name'],
                'plan_name' => $row['plan_name'],
                'plan_code' => $row['plan_code'],
                'start_date' => $startDate,
                'end_date' => $endDate,
                'monthly_cost' => $monthlyCost,
                'annual_cost' => $annualPrice,
                'status' => $row['status'],
                'payment_status' => $row['payment_status'] ?? 'PENDING',
                'billing_cycle' => $row['billing_cycle']
            ];
        }
        
        return $subscriptions;
    }

    /**
     * Calculate end date (1 year from start date)
     * 
     * @param string $startDate Start date
     * @return string End date
     */
    private function calculateEndDate(string $startDate): string
    {
        $date = new \DateTime($startDate);
        $date->modify('+1 year');
        return $date->format('Y-m-d');
    }
}
