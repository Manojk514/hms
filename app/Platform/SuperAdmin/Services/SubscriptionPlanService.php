<?php

/**
 * Subscription Plan Service
 * Business logic for subscription plan operations
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Platform\SuperAdmin\Repositories\SubscriptionRepository;
use App\Config\Database;
use PDO;

class SubscriptionPlanService
{
    private SubscriptionRepository $subscriptionRepo;
    private PDO $db;

    public function __construct()
    {
        $this->subscriptionRepo = new SubscriptionRepository();
        $this->db = Database::getConnection();
    }

    /**
     * Get all active subscription plans with full details
     * 
     * Returns:
     * - Plan identification (id, code, name)
     * - Pricing (price, currency, billing_cycle)
     * - Resource limits (max_users, max_patients, storage_gb)
     * - Status (is_featured)
     * - Associated modules
     * - Timestamps
     * 
     * @return array List of active subscription plans
     */
    public function getAllActivePlans(): array
    {
        $plans = $this->subscriptionRepo->getAllActivePlansWithDetails();
        
        // Format response
        return array_map(function ($plan) {
            return [
                'id' => (int)$plan['id'],
                'code' => $plan['plan_code'],
                'name' => $plan['plan_name'],
                'description' => $plan['description'],
                'pricing' => [
                    'amount' => (float)$plan['price'],
                    'currency' => $plan['currency'],
                    'billing_cycle' => $plan['billing_cycle'],
                    'formatted' => $this->formatPrice($plan['price'], $plan['currency'], $plan['billing_cycle'])
                ],
                'limits' => [
                    'max_users' => (int)$plan['max_users'],
                    'max_patients' => (int)$plan['max_patients'],
                    'storage_gb' => (int)$plan['storage_gb']
                ],
                'features' => [
                    'is_featured' => (bool)$plan['is_featured'],
                    'display_order' => (int)$plan['display_order']
                ],
                'modules' => array_map(function ($module) {
                    return $module['module_code'];
                }, $plan['modules']),
                'metadata' => [
                    'created_at' => $plan['created_at'],
                    'updated_at' => $plan['updated_at']
                ]
            ];
        }, $plans);
    }

    /**
     * Get subscription plan by ID
     * 
     * @param int $planId Plan ID
     * @return array|null Plan details or null if not found
     */
    public function getPlanById(int $planId): ?array
    {
        $plan = $this->subscriptionRepo->getPlanById($planId);
        
        if (!$plan) {
            return null;
        }
        
        // Get modules
        $modules = $this->subscriptionRepo->getPlanModules($planId);
        
        return [
            'id' => (int)$plan['id'],
            'code' => $plan['plan_code'],
            'name' => $plan['plan_name'],
            'description' => $plan['description'],
            'pricing' => [
                'amount' => (float)$plan['price'],
                'currency' => $plan['currency'],
                'billing_cycle' => $plan['billing_cycle'],
                'formatted' => $this->formatPrice($plan['price'], $plan['currency'], $plan['billing_cycle'])
            ],
            'limits' => [
                'max_users' => (int)$plan['max_users'],
                'max_patients' => (int)$plan['max_patients'],
                'storage_gb' => (int)$plan['storage_gb']
            ],
            'features' => [
                'is_featured' => (bool)$plan['is_featured'],
                'display_order' => (int)$plan['display_order']
            ],
            'modules' => array_map(function ($module) {
                return $module['module_code'];
            }, $modules),
            'status' => [
                'is_active' => (bool)$plan['is_active']
            ],
            'metadata' => [
                'created_at' => $plan['created_at'],
                'updated_at' => $plan['updated_at']
            ]
        ];
    }

    /**
     * Format price for display
     * 
     * @param string|float $price Price amount
     * @param string $currency Currency code
     * @param string $billingCycle Billing cycle
     * @return string Formatted price string
     */
    private function formatPrice($price, string $currency, string $billingCycle): string
    {
        $priceFloat = (float)$price;
        $currencySymbol = $this->getCurrencySymbol($currency);
        $cycle = $this->formatBillingCycle($billingCycle);
        
        // Format without decimals for whole numbers
        $formattedAmount = $priceFloat == floor($priceFloat) 
            ? number_format($priceFloat, 0) 
            : number_format($priceFloat, 2);
        
        return "{$currencySymbol}{$formattedAmount}/{$cycle}";
    }

    /**
     * Get currency symbol
     * 
     * @param string $currency Currency code
     * @return string Currency symbol
     */
    private function getCurrencySymbol(string $currency): string
    {
        $symbols = [
            'INR' => '₹',
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£'
        ];
        
        return $symbols[$currency] ?? $currency . ' ';
    }

    /**
     * Format billing cycle for display
     * 
     * @param string $cycle Billing cycle
     * @return string Formatted cycle
     */
    private function formatBillingCycle(string $cycle): string
    {
        $formats = [
            'MONTHLY' => 'month',
            'QUARTERLY' => 'quarter',
            'SEMI_ANNUAL' => '6 months',
            'ANNUAL' => 'year'
        ];
        
        return $formats[$cycle] ?? strtolower($cycle);
    }

    /**
     * Create a new subscription plan
     * 
     * @param array $data Plan data
     * @return array Created plan details
     * @throws \Exception If creation fails
     */
    public function createPlan(array $data): array
    {
        // Validate required fields
        $this->validatePlanData($data);
        
        // Generate plan code from name
        $planCode = $this->generatePlanCode($data['plan_name']);
        
        // Start transaction
        $this->db->beginTransaction();
        
        try {
            // Insert plan
            $sql = "
                INSERT INTO subscription_plans (
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
                    is_active,
                    display_order,
                    created_at,
                    updated_at
                ) VALUES (
                    :plan_code,
                    :plan_name,
                    :description,
                    :price,
                    :currency,
                    :billing_cycle,
                    :max_users,
                    :max_patients,
                    :storage_gb,
                    :is_featured,
                    1,
                    :display_order,
                    NOW(),
                    NOW()
                )
            ";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'plan_code' => $planCode,
                'plan_name' => $data['plan_name'],
                'description' => $data['description'] ?? '',
                'price' => $data['price'],
                'currency' => $data['currency'] ?? 'INR',
                'billing_cycle' => $data['billing_cycle'] ?? 'ANNUAL',
                'max_users' => $data['max_users'] ?? 50,
                'max_patients' => $data['max_patients'] ?? 10000,
                'storage_gb' => $data['storage_gb'] ?? 10,
                'is_featured' => $data['is_featured'] ?? 0,
                'display_order' => $data['display_order'] ?? 999
            ]);
            
            $planId = (int)$this->db->lastInsertId();
            
            // Insert plan modules if provided and table exists
            if (!empty($data['modules'])) {
                try {
                    $this->assignModulesToPlan($planId, $data['modules']);
                } catch (\Exception $e) {
                    // Log error but don't fail - modules are optional
                    error_log('Warning: Could not assign modules to plan: ' . $e->getMessage());
                }
            }
            
            $this->db->commit();
            
            // Return created plan
            return $this->getPlanById($planId);
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw new \Exception('Failed to create subscription plan: ' . $e->getMessage());
        }
    }
    
    /**
     * Validate plan data
     * 
     * @param array $data Plan data
     * @throws \Exception If validation fails
     */
    private function validatePlanData(array $data): void
    {
        if (empty($data['plan_name'])) {
            throw new \Exception('Plan name is required');
        }
        
        if (empty($data['price']) || $data['price'] <= 0) {
            throw new \Exception('Valid price is required');
        }
        
        // Check if plan name already exists
        $stmt = $this->db->prepare("SELECT id FROM subscription_plans WHERE plan_name = ?");
        $stmt->execute([$data['plan_name']]);
        
        if ($stmt->fetch()) {
            throw new \Exception('A plan with this name already exists');
        }
    }
    
    /**
     * Generate plan code from plan name
     * 
     * @param string $planName Plan name
     * @return string Plan code
     */
    private function generatePlanCode(string $planName): string
    {
        // Remove special characters and convert to uppercase
        $code = strtoupper(preg_replace('/[^A-Za-z0-9]/', '_', $planName));
        
        // Remove multiple underscores
        $code = preg_replace('/_+/', '_', $code);
        
        // Trim underscores from start and end
        $code = trim($code, '_');
        
        // Limit to 50 characters
        return substr($code, 0, 50);
    }
    
    /**
     * Assign modules to a plan
     * 
     * @param int $planId Plan ID
     * @param array $moduleCodes Module codes
     */
    private function assignModulesToPlan(int $planId, array $moduleCodes): void
    {
        // Get module IDs from codes
        $placeholders = str_repeat('?,', count($moduleCodes) - 1) . '?';
        $stmt = $this->db->prepare("SELECT id, module_code FROM modules WHERE module_code IN ($placeholders)");
        $stmt->execute($moduleCodes);
        $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Insert plan-module associations
        $sql = "INSERT INTO plan_modules (plan_id, module_id, created_at) VALUES (?, ?, NOW())";
        $stmt = $this->db->prepare($sql);
        
        foreach ($modules as $module) {
            $stmt->execute([$planId, $module['id']]);
        }
    }

    /**
     * Delete a subscription plan
     * 
     * @param int $planId Plan ID
     * @return bool Success status
     * @throws \Exception If deletion fails
     */
    public function deletePlan(int $planId): bool
    {
        // Check if plan exists
        $plan = $this->getPlanById($planId);
        
        if (!$plan) {
            throw new \Exception('Subscription plan not found');
        }
        
        // Check if any hospitals are using this plan
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as count 
            FROM hospitals 
            WHERE subscription = ? 
            AND deleted_at IS NULL
        ");
        $stmt->execute([$plan['name']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] > 0) {
            throw new \Exception('Cannot delete plan: ' . $result['count'] . ' hospital(s) are currently using this plan');
        }
        
        // Delete the plan
        $stmt = $this->db->prepare("DELETE FROM subscription_plans WHERE id = ?");
        $stmt->execute([$planId]);
        
        return true;
    }
}

