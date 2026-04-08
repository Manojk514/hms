<?php

/**
 * Hospital Service
 * Business logic layer for hospital management
 * 
 * Enforces Super Admin lifecycle rules:
 * - Hospital code generation (backend-only, deterministic)
 * - Subscription expiry enforcement
 * - Status transition validation
 * - Soft delete guards
 * - Audit logging
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Platform\SuperAdmin\Repositories\HospitalRepository;
use App\Platform\SuperAdmin\Repositories\SubscriptionRepository;
use App\Platform\SuperAdmin\Repositories\ModuleRepository;
use App\Platform\SuperAdmin\Services\AuditLogService;
use App\Config\Database;

class HospitalService
{
    private HospitalRepository $hospitalRepo;
    private SubscriptionRepository $subscriptionRepo;
    private ModuleRepository $moduleRepo;
    private AuditLogService $auditLog;

    public function __construct()
    {
        $this->hospitalRepo = new HospitalRepository();
        $this->subscriptionRepo = new SubscriptionRepository();
        $this->moduleRepo = new ModuleRepository();
        $this->auditLog = new AuditLogService();
    }

    /**
     * Check if hospital is soft-deleted
     * 
     * @param array $hospital Hospital data
     * @throws \Exception if hospital is soft-deleted
     */
    private function guardSoftDelete(array $hospital): void
    {
        if ($hospital['deleted_at'] !== null) {
            throw new \Exception(
                'Cannot perform operation on deleted hospital',
                403
            );
        }
    }

    /**
     * Generate unique hospital code
     * Backend-only, deterministic generation
     * 
     * @return string Unique hospital code
     */
    private function generateUniqueHospitalCode(): string
    {
        $maxAttempts = 10;
        $attempt = 0;

        do {
            $hospitalCode = $this->hospitalRepo->generateHospitalCode();
            $attempt++;

            if (!$this->hospitalRepo->codeExists($hospitalCode)) {
                return $hospitalCode;
            }
        } while ($attempt < $maxAttempts);

        throw new \Exception(
            'Failed to generate unique hospital code. Please try again.',
            500
        );
    }

    /**
     * Get next hospital code (for preview in UI)
     * This is a read-only operation that shows what the next code will be
     * 
     * @return string Next hospital code
     */
    public function getNextHospitalCode(): string
    {
        return $this->hospitalRepo->generateHospitalCode();
    }

    /**
     * Get all active subscription plans
     * 
     * @return array List of active subscription plans
     */
    public function getSubscriptionPlans(): array
    {
        return $this->subscriptionRepo->getAllActivePlans();
    }

    /**
     * Check if subscription is expired
     * 
     * @param array|null $subscription Subscription data
     * @return bool True if expired or no subscription
     */
    private function isSubscriptionExpired(?array $subscription): bool
    {
        if ($subscription === null) {
            return true;
        }

        $endDate = strtotime($subscription['end_date']);
        $today = strtotime(date('Y-m-d'));

        return $endDate < $today;
    }

    /**
     * Create new hospital
     * 
     * Business Rules:
     * - Hospital code is auto-generated (NEVER from request)
     * - Email must be unique
     * - Initial status is PENDING
     * - No modules enabled by default
     * 
     * @param array $data Hospital data (hospital_code is IGNORED if present)
     * @param int $createdBy Super Admin ID
     * @return array Created hospital data
     * @throws \Exception
     */
    public function create(array $data, int $createdBy): array
    {
        // Check email uniqueness
        if ($this->hospitalRepo->emailExists($data['email'])) {
            throw new \Exception('Email address is already registered', 409);
        }

        // Generate unique hospital code (BACKEND-ONLY, DETERMINISTIC)
        // NEVER accept hospital_code from request data
        $hospitalCode = $this->generateUniqueHospitalCode();

        // Prepare hospital data
        $hospitalData = [
            'hospital_code' => $hospitalCode,
            'name' => $data['name'],
            'email' => strtolower(trim($data['email'])),
            'subscription' => !empty($data['subscription']) ? $data['subscription'] : '',
            'phone' => $data['phone'],
            'address_line1' => $data['address_line1'],
            'address_line2' => $data['address_line2'] ?? null,
            'city' => $data['city'],
            'state' => $data['state'],
            'country' => $data['country'] ?? 'India',
            'postal_code' => $data['postal_code'] ?? null,
            'logo_url' => $data['logo_url'] ?? null,
            'website' => $data['website'] ?? null,
            'status' => 'PENDING',
            'created_by' => $createdBy,
        ];
        
        // DEBUG: Log subscription value
        error_log('HospitalService::create - Subscription value: "' . $hospitalData['subscription'] . '"');
        error_log('HospitalService::create - Subscription length: ' . strlen($hospitalData['subscription']));

        try {
            Database::beginTransaction();

            // Create hospital
            $hospitalId = $this->hospitalRepo->create($hospitalData);

            // Log action
            $this->auditLog->log(
                'HOSPITAL_CREATED',
                'HOSPITAL',
                $hospitalId,
                $createdBy,
                null,
                ['hospital_code' => $hospitalCode, 'name' => $data['name']]
            );

            Database::commit();

            // Return created hospital
            return $this->hospitalRepo->findById($hospitalId);

        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }

    /**
     * Get hospital list with pagination and filters
     * 
     * @param array $filters Filter criteria
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array Paginated results
     */
    public function list(array $filters, int $page, int $perPage): array
    {
        $offset = ($page - 1) * $perPage;
        
        $hospitals = $this->hospitalRepo->list($filters, $perPage, $offset);
        $total = $this->hospitalRepo->count($filters);

        return [
            'items' => $hospitals,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
        ];
    }

    /**
     * Get hospital details by ID
     * 
     * @param int $id Hospital ID
     * @return array|null Hospital data
     */
    public function getById(int $id): ?array
    {
        return $this->hospitalRepo->findWithSubscription($id);
    }

    /**
     * Update hospital details
     * 
     * Business Rules:
     * - Cannot update soft-deleted hospitals (CRITICAL GUARD)
     * - Cannot update hospital_code, status, or timestamps
     * - Email must remain unique
     * 
     * @param int $id Hospital ID
     * @param array $data Update data
     * @param int $updatedBy Super Admin ID
     * @return array Updated hospital data
     * @throws \Exception
     */
    public function update(int $id, array $data, int $updatedBy): array
    {
        // Check hospital exists (include deleted to check soft-delete status)
        $hospital = $this->hospitalRepo->findById($id, true);
        if (!$hospital) {
            throw new \Exception("Hospital with ID {$id} does not exist", 404);
        }

        // CRITICAL: Guard against soft-deleted hospitals
        $this->guardSoftDelete($hospital);

        // Check email uniqueness if email is being updated
        if (isset($data['email']) && $data['email'] !== $hospital['email']) {
            $data['email'] = strtolower(trim($data['email']));
            if ($this->hospitalRepo->emailExists($data['email'], $id)) {
                throw new \Exception('Email address is already registered', 409);
            }
        }

        // Track changes for audit log
        $oldValues = [];
        $newValues = [];
        foreach ($data as $key => $value) {
            if (isset($hospital[$key]) && $hospital[$key] !== $value) {
                $oldValues[$key] = $hospital[$key];
                $newValues[$key] = $value;
            }
        }

        try {
            Database::beginTransaction();

            // Update hospital
            $this->hospitalRepo->update($id, $data);

            // Log action
            if (!empty($oldValues)) {
                $this->auditLog->log(
                    'HOSPITAL_UPDATED',
                    'HOSPITAL',
                    $id,
                    $updatedBy,
                    $oldValues,
                    $newValues
                );
            }

            Database::commit();

            // Return updated hospital
            return $this->hospitalRepo->findById($id);

        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }

    /**
     * Change hospital status
     * 
     * Business Rules:
     * - Cannot change status of soft-deleted hospitals (CRITICAL GUARD)
     * - PENDING → ACTIVE: Requires active, non-expired subscription
     * - ACTIVE → INACTIVE: Allowed (deactivation always allowed)
     * - INACTIVE → ACTIVE: Requires active, non-expired subscription
     * - Cannot transition to PENDING from other states
     * - If subscription is expired, hospital MUST be INACTIVE
     * 
     * @param int $id Hospital ID
     * @param string $newStatus New status
     * @param int $changedBy Super Admin ID
     * @return array Updated hospital data
     * @throws \Exception
     */
    public function changeStatus(int $id, string $newStatus, int $changedBy): array
    {
        // Validate status
        $allowedStatuses = ['PENDING', 'ACTIVE', 'INACTIVE'];
        if (!in_array($newStatus, $allowedStatuses)) {
            throw new \Exception("Invalid status: {$newStatus}", 400);
        }

        // Check hospital exists (include deleted to check soft-delete status)
        $hospital = $this->hospitalRepo->findById($id, true);
        if (!$hospital) {
            throw new \Exception("Hospital with ID {$id} does not exist", 404);
        }

        // CRITICAL: Guard against soft-deleted hospitals
        $this->guardSoftDelete($hospital);

        $currentStatus = $hospital['status'];

        // Check if status is already the same
        if ($currentStatus === $newStatus) {
            return $hospital;
        }

        // Validate state transitions
        $this->validateStatusTransition($currentStatus, $newStatus);

        // Get current subscription
        $subscription = $this->subscriptionRepo->getActiveSubscription($id);

        // CRITICAL: Enforce subscription expiry rules
        if ($newStatus === 'ACTIVE') {
            // Check subscription exists
            if (!$subscription) {
                throw new \Exception(
                    'Cannot activate hospital without an active subscription',
                    422
                );
            }

            // Check subscription is not expired
            if ($this->isSubscriptionExpired($subscription)) {
                throw new \Exception(
                    'Cannot activate hospital with expired subscription. Please extend subscription first.',
                    422
                );
            }
        }

        // CRITICAL: Force INACTIVE if subscription is expired
        // This ensures expired hospitals cannot remain ACTIVE
        if ($currentStatus === 'ACTIVE' && $this->isSubscriptionExpired($subscription)) {
            $newStatus = 'INACTIVE';
        }

        try {
            Database::beginTransaction();

            // Update status
            $this->hospitalRepo->updateStatus($id, $newStatus);

            // Log action
            $this->auditLog->log(
                'HOSPITAL_STATUS_CHANGED',
                'HOSPITAL',
                $id,
                $changedBy,
                ['status' => $currentStatus],
                ['status' => $newStatus]
            );

            Database::commit();

            // Return updated hospital
            return $this->hospitalRepo->findById($id);

        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }

    /**
     * Validate status transition
     * 
     * @param string $currentStatus Current status
     * @param string $newStatus New status
     * @throws \Exception
     */
    private function validateStatusTransition(string $currentStatus, string $newStatus): void
    {
        // Cannot transition back to PENDING from other states
        if ($newStatus === 'PENDING' && $currentStatus !== 'PENDING') {
            throw new \Exception(
                "Cannot transition from {$currentStatus} to PENDING",
                422
            );
        }

        // Deactivation (to INACTIVE) is always allowed from any state
        // PENDING can go to ACTIVE or INACTIVE
        // ACTIVE can go to INACTIVE
        // INACTIVE can go to ACTIVE (with subscription check in changeStatus)
    }

    /**
     * Extend or create subscription
     * 
     * Business Rules:
     * - Cannot extend subscription for soft-deleted hospitals (CRITICAL GUARD)
     * - Creates new subscription record
     * - If active subscription exists, new subscription starts after current ends
     * - Auto-enables modules included in plan
     * - Updates hospital status if needed
     * 
     * @param int $hospitalId Hospital ID
     * @param array $data Subscription data
     * @param int $createdBy Super Admin ID
     * @return array Subscription data
     * @throws \Exception
     */
    public function extendSubscription(int $hospitalId, array $data, int $createdBy): array
    {
        // Check hospital exists (include deleted to check soft-delete status)
        $hospital = $this->hospitalRepo->findById($hospitalId, true);
        if (!$hospital) {
            throw new \Exception("Hospital with ID {$hospitalId} does not exist", 404);
        }

        // CRITICAL: Guard against soft-deleted hospitals
        $this->guardSoftDelete($hospital);

        // Check plan exists
        $plan = $this->subscriptionRepo->getPlanById($data['plan_id']);
        if (!$plan) {
            throw new \Exception("Subscription plan does not exist", 404);
        }

        if ($plan['is_active'] != 1) {
            throw new \Exception("Subscription plan is not active", 422);
        }

        // Determine start date
        $activeSubscription = $this->subscriptionRepo->getActiveSubscription($hospitalId);
        if ($activeSubscription) {
            // Start after current subscription ends
            $startDate = date('Y-m-d', strtotime($activeSubscription['end_date'] . ' +1 day'));
        } else {
            // Use provided start date or today
            $startDate = $data['start_date'] ?? date('Y-m-d');
        }

        // Calculate end date based on billing cycle
        $billingCycle = $data['billing_cycle'] ?? 'MONTHLY';
        if ($billingCycle === 'ANNUAL') {
            $endDate = date('Y-m-d', strtotime($startDate . ' +1 year -1 day'));
        } else {
            $endDate = date('Y-m-d', strtotime($startDate . ' +1 month -1 day'));
        }

        // Prepare subscription data
        $subscriptionData = [
            'hospital_id' => $hospitalId,
            'plan_id' => $data['plan_id'],
            'start_date' => $startDate,
            'end_date' => $endDate,
            'billing_cycle' => $billingCycle,
            'amount' => $plan['price'],
            'payment_status' => $data['payment_status'] ?? 'PENDING',
            'payment_reference' => $data['payment_reference'] ?? null,
            'auto_renew' => $data['auto_renew'] ?? false,
            'is_active' => 1,
            'created_by' => $createdBy,
        ];

        try {
            Database::beginTransaction();

            // Create subscription
            $subscriptionId = $this->subscriptionRepo->create($subscriptionData);

            // Get modules included in plan
            $planModules = $this->subscriptionRepo->getPlanModules($data['plan_id']);

            // Enable modules for hospital
            foreach ($planModules as $module) {
                $this->moduleRepo->enableModule(
                    $hospitalId,
                    $module['module_code'],
                    "Auto-enabled with subscription plan",
                    $createdBy
                );
            }

            // Log action
            $this->auditLog->log(
                'SUBSCRIPTION_CREATED',
                'SUBSCRIPTION',
                $subscriptionId,
                $createdBy,
                null,
                [
                    'hospital_id' => $hospitalId,
                    'plan_id' => $data['plan_id'],
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ]
            );

            Database::commit();

            // Return subscription data
            return $this->subscriptionRepo->findById($subscriptionId);

        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }

    /**
     * Soft delete hospital
     * 
     * Business Rules:
     * - Sets deleted_at timestamp
     * - Changes status to DELETED
     * - Cancels active subscriptions
     * - Disables all modules
     * - Preserves all data for audit
     * - Once deleted, hospital cannot be modified
     * 
     * @param int $id Hospital ID
     * @param int $deletedBy Super Admin ID
     * @return bool Success status
     * @throws \Exception
     */
    public function delete(int $id, int $deletedBy): bool
    {
        // Check hospital exists (include deleted to provide better error message)
        $hospital = $this->hospitalRepo->findById($id, true);
        if (!$hospital) {
            throw new \Exception("Hospital with ID {$id} does not exist", 404);
        }

        // Check if already deleted
        if ($hospital['deleted_at'] !== null) {
            throw new \Exception(
                'Hospital is already deleted',
                422
            );
        }

        try {
            Database::beginTransaction();

            // Hard delete hospital (permanently remove from database)
            $this->hospitalRepo->hardDelete($id);

            // Log action before deletion
            $this->auditLog->log(
                'HOSPITAL_DELETED',
                'HOSPITAL',
                $id,
                $deletedBy,
                [
                    'hospital_code' => $hospital['hospital_code'],
                    'name' => $hospital['name'],
                    'status' => $hospital['status'],
                ],
                null
            );

            Database::commit();

            return true;

        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }

    /**
     * Upload hospital logo
     * 
     * Business Rules:
     * - Cannot update logo for soft-deleted hospitals (CRITICAL GUARD)
     * 
     * @param int $id Hospital ID
     * @param string $logoUrl Logo URL
     * @param int $updatedBy Super Admin ID
     * @return array Updated hospital data
     * @throws \Exception
     */
    public function updateLogo(int $id, string $logoUrl, int $updatedBy): array
    {
        // Check hospital exists (include deleted to check soft-delete status)
        $hospital = $this->hospitalRepo->findById($id, true);
        if (!$hospital) {
            throw new \Exception("Hospital with ID {$id} does not exist", 404);
        }

        // CRITICAL: Guard against soft-deleted hospitals
        $this->guardSoftDelete($hospital);

        try {
            Database::beginTransaction();

            // Update logo
            $this->hospitalRepo->updateLogo($id, $logoUrl);

            // Log action
            $this->auditLog->log(
                'HOSPITAL_LOGO_UPDATED',
                'HOSPITAL',
                $id,
                $updatedBy,
                ['logo_url' => $hospital['logo_url']],
                ['logo_url' => $logoUrl]
            );

            Database::commit();

            // Return updated hospital
            return $this->hospitalRepo->findById($id);

        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }

    /**
     * Get hospitals with expiring subscriptions
     * 
     * @param int $daysThreshold Days until expiration
     * @return array List of hospitals
     */
    public function getExpiringSubscriptions(int $daysThreshold = 30): array
    {
        return $this->hospitalRepo->getExpiringSubscriptions($daysThreshold);
    }
}
