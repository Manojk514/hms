<?php

/**
 * Subscription Repository
 * Database access layer for subscription operations
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Repositories;

use App\Config\Database;
use PDO;

class SubscriptionRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Create subscription
     */
    public function create(array $data): int
    {
        $sql = "
            INSERT INTO hospital_subscriptions (
                hospital_id, plan_id, start_date, end_date, billing_cycle,
                amount, payment_status, payment_reference, auto_renew,
                is_active, created_by, created_at
            ) VALUES (
                :hospital_id, :plan_id, :start_date, :end_date, :billing_cycle,
                :amount, :payment_status, :payment_reference, :auto_renew,
                :is_active, :created_by, NOW()
            )
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Find subscription by ID
     */
    public function findById(int $id): ?array
    {
        $sql = "
            SELECT hs.*, sp.name as plan_name
            FROM hospital_subscriptions hs
            LEFT JOIN subscription_plans sp ON hs.plan_id = sp.id
            WHERE hs.id = :id
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Get active subscription for hospital
     */
    public function getActiveSubscription(int $hospitalId): ?array
    {
        $sql = "
            SELECT *
            FROM hospital_subscriptions
            WHERE hospital_id = :hospital_id
            AND is_active = 1
            AND end_date >= CURDATE()
            ORDER BY end_date DESC
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['hospital_id' => $hospitalId]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Get subscription plan by ID
     */
    public function getPlanById(int $planId): ?array
    {
        $sql = "SELECT * FROM subscription_plans WHERE id = :id";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $planId]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Get all active subscription plans with full details
     * Includes pricing, limits, and associated modules
     */
    public function getAllActivePlansWithDetails(): array
    {
        $sql = "
            SELECT 
                id,
                plan_code,
                plan_name,
                description,
                price,
                currency,
                billing_cycle,
                max_users,
                max_patients,
                storage_gb,
                is_featured,
                display_order,
                created_at,
                updated_at
            FROM subscription_plans
            WHERE is_active = 1
            ORDER BY display_order ASC, price ASC
        ";
        
        $stmt = $this->db->query($sql);
        $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Fetch modules for each plan
        foreach ($plans as &$plan) {
            $plan['modules'] = $this->getPlanModules((int)$plan['id']);
        }
        
        return $plans;
    }

    /**
     * Get all active subscription plans (simple version for dropdowns)
     */
    public function getAllActivePlans(): array
    {
        $sql = "
            SELECT id, plan_name, description, price, billing_cycle
            FROM subscription_plans
            WHERE is_active = 1
            ORDER BY price ASC
        ";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get modules included in plan
     */
    public function getPlanModules(int $planId): array
    {
        $sql = "SELECT module_code FROM subscription_plan_modules WHERE plan_id = :plan_id";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['plan_id' => $planId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Cancel active subscriptions for hospital
     */
    public function cancelActiveSubscriptions(int $hospitalId): bool
    {
        $sql = "
            UPDATE hospital_subscriptions
            SET is_active = 0
            WHERE hospital_id = :hospital_id
            AND is_active = 1
        ";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['hospital_id' => $hospitalId]);
    }
}
