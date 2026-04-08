<?php

/**
 * Module Repository
 * Database access layer for module configuration
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Repositories;

use App\Config\Database;
use PDO;

class ModuleRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Get all modules for a hospital
     * 
     * @param int $hospitalId Hospital ID
     * @return array List of modules with enabled status
     */
    public function getHospitalModules(int $hospitalId): array
    {
        $sql = "
            SELECT 
                module_code,
                is_enabled,
                enabled_at,
                disabled_at,
                notes,
                reason
            FROM hospital_modules
            WHERE hospital_id = :hospital_id
            ORDER BY module_code ASC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['hospital_id' => $hospitalId]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get specific module for a hospital
     * 
     * @param int $hospitalId Hospital ID
     * @param string $moduleCode Module code
     * @return array|null Module data or null if not found
     */
    public function getModule(int $hospitalId, string $moduleCode): ?array
    {
        $sql = "
            SELECT 
                module_code,
                is_enabled,
                enabled_at,
                disabled_at,
                notes,
                reason
            FROM hospital_modules
            WHERE hospital_id = :hospital_id
            AND module_code = :module_code
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'hospital_id' => $hospitalId,
            'module_code' => $moduleCode
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Check if module exists for hospital
     * 
     * @param int $hospitalId Hospital ID
     * @param string $moduleCode Module code
     * @return bool True if exists, false otherwise
     */
    public function moduleExists(int $hospitalId, string $moduleCode): bool
    {
        return $this->getModule($hospitalId, $moduleCode) !== null;
    }

    /**
     * Enable module for hospital
     * 
     * @param int $hospitalId Hospital ID
     * @param string $moduleCode Module code
     * @param string|null $notes Optional notes
     * @param int $enabledBy Super Admin ID
     * @return bool Success status
     */
    public function enableModule(
        int $hospitalId,
        string $moduleCode,
        ?string $notes,
        int $enabledBy
    ): bool {
        // Get module ID from modules table
        $sql = "SELECT id FROM modules WHERE module_code = :module_code";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['module_code' => $moduleCode]);
        $module = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$module) {
            throw new \Exception("Module {$moduleCode} not found in modules table");
        }
        
        $moduleId = $module['id'];
        
        // Check if module record exists
        if ($this->moduleExists($hospitalId, $moduleCode)) {
            // Update existing record
            $sql = "
                UPDATE hospital_modules
                SET 
                    is_enabled = 1,
                    enabled_at = NOW(),
                    enabled_by = :enabled_by,
                    disabled_at = NULL,
                    disabled_by = NULL,
                    notes = :notes,
                    reason = NULL
                WHERE hospital_id = :hospital_id
                AND module_code = :module_code
            ";
            
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'hospital_id' => $hospitalId,
                'module_code' => $moduleCode,
                'enabled_by' => $enabledBy,
                'notes' => $notes
            ]);
        } else {
            // Insert new record
            $sql = "
                INSERT INTO hospital_modules (
                    hospital_id,
                    module_id,
                    module_code,
                    is_enabled,
                    enabled_at,
                    enabled_by,
                    notes,
                    created_by,
                    created_at
                ) VALUES (
                    :hospital_id,
                    :module_id,
                    :module_code,
                    1,
                    NOW(),
                    :enabled_by,
                    :notes,
                    :created_by,
                    NOW()
                )
            ";
            
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'hospital_id' => $hospitalId,
                'module_id' => $moduleId,
                'module_code' => $moduleCode,
                'enabled_by' => $enabledBy,
                'notes' => $notes,
                'created_by' => $enabledBy
            ]);
        }
    }

    /**
     * Disable module for hospital
     * 
     * @param int $hospitalId Hospital ID
     * @param string $moduleCode Module code
     * @param string $reason Reason for disabling
     * @param int $disabledBy Super Admin ID
     * @return bool Success status
     */
    public function disableModule(
        int $hospitalId,
        string $moduleCode,
        string $reason,
        int $disabledBy
    ): bool {
        $sql = "
            UPDATE hospital_modules
            SET 
                is_enabled = 0,
                disabled_at = NOW(),
                disabled_by = :disabled_by,
                reason = :reason
            WHERE hospital_id = :hospital_id
            AND module_code = :module_code
        ";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'hospital_id' => $hospitalId,
            'module_code' => $moduleCode,
            'disabled_by' => $disabledBy,
            'reason' => $reason
        ]);
    }

    /**
     * Disable all modules for hospital
     * 
     * @param int $hospitalId Hospital ID
     * @param string $reason Reason for disabling
     * @param int $disabledBy Super Admin ID
     * @return bool Success status
     */
    public function disableAllModules(int $hospitalId, string $reason, int $disabledBy): bool
    {
        $sql = "
            UPDATE hospital_modules
            SET 
                is_enabled = 0,
                disabled_at = NOW(),
                disabled_by = :disabled_by,
                reason = :reason
            WHERE hospital_id = :hospital_id
            AND is_enabled = 1
        ";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'hospital_id' => $hospitalId,
            'disabled_by' => $disabledBy,
            'reason' => $reason
        ]);
    }

    /**
     * Count enabled modules for hospital
     * 
     * @param int $hospitalId Hospital ID
     * @return int Count of enabled modules
     */
    public function countEnabledModules(int $hospitalId): int
    {
        $sql = "
            SELECT COUNT(*) as total
            FROM hospital_modules
            WHERE hospital_id = :hospital_id
            AND is_enabled = 1
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['hospital_id' => $hospitalId]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$result['total'];
    }

    /**
     * Get list of enabled module codes for hospital
     * 
     * @param int $hospitalId Hospital ID
     * @return array List of module codes
     */
    public function getEnabledModuleCodes(int $hospitalId): array
    {
        $sql = "
            SELECT module_code
            FROM hospital_modules
            WHERE hospital_id = :hospital_id
            AND is_enabled = 1
            ORDER BY module_code ASC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['hospital_id' => $hospitalId]);
        
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'module_code');
    }

    /**
     * Bulk update modules
     * 
     * @param int $hospitalId Hospital ID
     * @param array $modules Array of module configurations
     * @param int $updatedBy Super Admin ID
     * @return bool Success status
     */
    public function bulkUpdate(int $hospitalId, array $modules, int $updatedBy): bool
    {
        foreach ($modules as $module) {
            $moduleCode = $module['module_code'];
            $isEnabled = $module['is_enabled'];

            if ($isEnabled) {
                $this->enableModule(
                    $hospitalId,
                    $moduleCode,
                    $module['notes'] ?? null,
                    $updatedBy
                );
            } else {
                $this->disableModule(
                    $hospitalId,
                    $moduleCode,
                    $module['reason'] ?? 'Bulk update',
                    $updatedBy
                );
            }
        }

        return true;
    }

    /**
     * Get all available modules (system-wide)
     * 
     * @return array List of available modules
     */
    public function getAvailableModules(): array
    {
        return [
            ['code' => 'OP', 'name' => 'Outpatient Management'],
            ['code' => 'LAB', 'name' => 'Laboratory Management'],
            ['code' => 'PHARMACY', 'name' => 'Pharmacy Management'],
            ['code' => 'BILLING', 'name' => 'Billing Management'],
            ['code' => 'IPD', 'name' => 'Inpatient Management'],
            ['code' => 'EMERGENCY', 'name' => 'Emergency Management'],
        ];
    }

    /**
     * Get modules with enabled status for hospital
     * 
     * @param int $hospitalId Hospital ID
     * @return array List of all modules with enabled status
     */
    public function getModulesWithStatus(int $hospitalId): array
    {
        $availableModules = $this->getAvailableModules();
        $hospitalModules = $this->getHospitalModules($hospitalId);

        // Create lookup map
        $moduleMap = [];
        foreach ($hospitalModules as $module) {
            $moduleMap[$module['module_code']] = $module;
        }

        // Merge with available modules
        $result = [];
        foreach ($availableModules as $module) {
            $code = $module['code'];
            $result[] = [
                'module_code' => $code,
                'module_name' => $module['name'],
                'is_enabled' => isset($moduleMap[$code]) ? (bool)$moduleMap[$code]['is_enabled'] : false,
                'enabled_at' => $moduleMap[$code]['enabled_at'] ?? null,
                'disabled_at' => $moduleMap[$code]['disabled_at'] ?? null,
                'notes' => $moduleMap[$code]['notes'] ?? null,
                'reason' => $moduleMap[$code]['reason'] ?? null,
            ];
        }

        return $result;
    }
}
