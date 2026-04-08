<?php

/**
 * Module Service
 * Business logic layer for module configuration
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Platform\SuperAdmin\Repositories\ModuleRepository;
use App\Platform\SuperAdmin\Repositories\HospitalRepository;
use App\Platform\SuperAdmin\Services\AuditLogService;
use App\Config\Database;

class ModuleService
{
    private ModuleRepository $moduleRepo;
    private HospitalRepository $hospitalRepo;
    private AuditLogService $auditLog;

    public function __construct()
    {
        $this->moduleRepo = new ModuleRepository();
        $this->hospitalRepo = new HospitalRepository();
        $this->auditLog = new AuditLogService();
    }

    /**
     * Get all modules for hospital with enabled status
     * 
     * @param int $hospitalId Hospital ID
     * @return array List of modules
     * @throws \Exception
     */
    public function getModules(int $hospitalId): array
    {
        // Check hospital exists
        $hospital = $this->hospitalRepo->findById($hospitalId);
        if (!$hospital) {
            throw new \Exception("Hospital with ID {$hospitalId} does not exist", 404);
        }

        return $this->moduleRepo->getModulesWithStatus($hospitalId);
    }

    /**
     * Enable module for hospital
     * 
     * Business Rules:
     * - Can enable module anytime (regardless of hospital status)
     * - Cannot enable for deleted hospitals
     * - Creates or updates module record
     * 
     * @param int $hospitalId Hospital ID
     * @param string $moduleCode Module code
     * @param string|null $notes Optional notes
     * @param int $enabledBy Super Admin ID
     * @return array Module data
     * @throws \Exception
     */
    public function enableModule(
        int $hospitalId,
        string $moduleCode,
        ?string $notes,
        int $enabledBy
    ): array {
        // Check hospital exists
        $hospital = $this->hospitalRepo->findById($hospitalId);
        if (!$hospital) {
            throw new \Exception("Hospital with ID {$hospitalId} does not exist", 404);
        }

        // Validate module code
        $moduleCode = strtoupper($moduleCode);
        $availableModules = array_column($this->moduleRepo->getAvailableModules(), 'code');
        if (!in_array($moduleCode, $availableModules)) {
            throw new \Exception("Invalid module code: {$moduleCode}", 400);
        }

        try {
            Database::beginTransaction();

            // Enable module
            $this->moduleRepo->enableModule($hospitalId, $moduleCode, $notes, $enabledBy);

            // Log action
            $this->auditLog->log(
                'MODULE_ENABLED',
                'MODULE',
                $hospitalId,
                $enabledBy,
                null,
                ['module_code' => $moduleCode, 'notes' => $notes]
            );

            Database::commit();

            // Return module data
            return $this->moduleRepo->getModule($hospitalId, $moduleCode);

        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }

    /**
     * Disable module for hospital
     * 
     * Business Rules:
     * - Cannot disable all modules for ACTIVE hospital
     * - Cannot disable for deleted hospitals
     * - Reason is required
     * 
     * @param int $hospitalId Hospital ID
     * @param string $moduleCode Module code
     * @param string $reason Reason for disabling
     * @param int $disabledBy Super Admin ID
     * @return array Module data
     * @throws \Exception
     */
    public function disableModule(
        int $hospitalId,
        string $moduleCode,
        string $reason,
        int $disabledBy
    ): array {
        // Check hospital exists
        $hospital = $this->hospitalRepo->findById($hospitalId);
        if (!$hospital) {
            throw new \Exception("Hospital with ID {$hospitalId} does not exist", 404);
        }

        // Validate module code
        $moduleCode = strtoupper($moduleCode);
        $availableModules = array_column($this->moduleRepo->getAvailableModules(), 'code');
        if (!in_array($moduleCode, $availableModules)) {
            throw new \Exception("Invalid module code: {$moduleCode}", 400);
        }

        // Check if module exists and is enabled
        $module = $this->moduleRepo->getModule($hospitalId, $moduleCode);
        if (!$module || !$module['is_enabled']) {
            throw new \Exception("Module {$moduleCode} is not enabled for this hospital", 422);
        }

        // Check if this is the last enabled module for ACTIVE hospital
        if ($hospital['status'] === 'ACTIVE') {
            $enabledCount = $this->moduleRepo->countEnabledModules($hospitalId);
            if ($enabledCount <= 1) {
                throw new \Exception(
                    'Cannot disable all modules for an active hospital',
                    409
                );
            }
        }

        try {
            Database::beginTransaction();

            // Disable module
            $this->moduleRepo->disableModule($hospitalId, $moduleCode, $reason, $disabledBy);

            // Log action
            $this->auditLog->log(
                'MODULE_DISABLED',
                'MODULE',
                $hospitalId,
                $disabledBy,
                ['module_code' => $moduleCode, 'is_enabled' => true],
                ['module_code' => $moduleCode, 'is_enabled' => false, 'reason' => $reason]
            );

            Database::commit();

            // Return module data
            return $this->moduleRepo->getModule($hospitalId, $moduleCode);

        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }

    /**
     * Bulk update modules
     * 
     * Business Rules:
     * - Cannot disable all modules for ACTIVE hospital
     * - Validates all module codes
     * - Reason required if any module is being disabled
     * 
     * @param int $hospitalId Hospital ID
     * @param array $modules Array of module configurations
     * @param string|null $reason Reason (required if disabling any module)
     * @param int $updatedBy Super Admin ID
     * @return array Updated modules list
     * @throws \Exception
     */
    public function bulkUpdate(
        int $hospitalId,
        array $modules,
        ?string $reason,
        int $updatedBy
    ): array {
        // Check hospital exists
        $hospital = $this->hospitalRepo->findById($hospitalId);
        if (!$hospital) {
            throw new \Exception("Hospital with ID {$hospitalId} does not exist", 404);
        }

        // Validate module codes
        $availableModules = array_column($this->moduleRepo->getAvailableModules(), 'code');
        foreach ($modules as $module) {
            $code = strtoupper($module['module_code']);
            if (!in_array($code, $availableModules)) {
                throw new \Exception("Invalid module code: {$code}", 400);
            }
        }

        // Check if any module is being disabled
        $hasDisabled = false;
        foreach ($modules as $module) {
            if (!$module['is_enabled']) {
                $hasDisabled = true;
                break;
            }
        }

        // Require reason if disabling any module
        if ($hasDisabled && empty($reason)) {
            throw new \Exception('Reason is required when disabling modules', 400);
        }

        // Check if all modules would be disabled for ACTIVE hospital
        if ($hospital['status'] === 'ACTIVE') {
            $enabledCount = 0;
            foreach ($modules as $module) {
                if ($module['is_enabled']) {
                    $enabledCount++;
                }
            }

            if ($enabledCount === 0) {
                throw new \Exception(
                    'Cannot disable all modules for an active hospital',
                    409
                );
            }
        }

        try {
            Database::beginTransaction();

            // Update each module
            foreach ($modules as $module) {
                $moduleCode = strtoupper($module['module_code']);
                $isEnabled = $module['is_enabled'];

                if ($isEnabled) {
                    $this->moduleRepo->enableModule(
                        $hospitalId,
                        $moduleCode,
                        $module['notes'] ?? null,
                        $updatedBy
                    );
                } else {
                    $this->moduleRepo->disableModule(
                        $hospitalId,
                        $moduleCode,
                        $reason ?? 'Bulk update',
                        $updatedBy
                    );
                }
            }

            // Log action
            $this->auditLog->log(
                'MODULES_BULK_UPDATED',
                'MODULE',
                $hospitalId,
                $updatedBy,
                null,
                ['modules' => $modules, 'reason' => $reason]
            );

            Database::commit();

            // Return updated modules list
            return $this->moduleRepo->getModulesWithStatus($hospitalId);

        } catch (\Exception $e) {
            Database::rollback();
            throw $e;
        }
    }

    /**
     * Get enabled modules for hospital
     * 
     * @param int $hospitalId Hospital ID
     * @return array List of enabled module codes
     */
    public function getEnabledModules(int $hospitalId): array
    {
        return $this->moduleRepo->getEnabledModuleCodes($hospitalId);
    }

    /**
     * Check if module is enabled for hospital
     * 
     * @param int $hospitalId Hospital ID
     * @param string $moduleCode Module code
     * @return bool True if enabled, false otherwise
     */
    public function isModuleEnabled(int $hospitalId, string $moduleCode): bool
    {
        $module = $this->moduleRepo->getModule($hospitalId, strtoupper($moduleCode));
        return $module && $module['is_enabled'];
    }
}
