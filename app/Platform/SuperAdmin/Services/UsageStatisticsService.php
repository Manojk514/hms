<?php

/**
 * Usage Statistics Service
 * Calculates system usage statistics in real-time from database
 * 
 * Rules:
 * - No hardcoded values
 * - Database aggregation only
 * - NULL-safe calculations
 * - No payment/billing logic
 * - Only ACTIVE hospitals for module statistics
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Config\Database;
use PDO;

class UsageStatisticsService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Get comprehensive usage statistics
     * 
     * @return array Usage statistics
     */
    public function getUsageStatistics(): array
    {
        return [
            'active_hospitals' => $this->getActiveHospitalsStats(),
            'total_modules_enabled' => $this->getTotalModulesEnabled(),
            'module_usage_breakdown' => $this->getModuleUsageBreakdown()
        ];
    }

    /**
     * Get active hospitals statistics
     * 
     * @return array Active hospitals stats
     */
    private function getActiveHospitalsStats(): array
    {
        $sql = "
            SELECT 
                COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_count,
                COUNT(*) as total_count
            FROM hospitals
            WHERE deleted_at IS NULL
        ";
        
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $activeCount = (int)($result['active_count'] ?? 0);
        $totalCount = (int)($result['total_count'] ?? 0);
        
        // Calculate utilization percentage (NULL-safe)
        $utilizationPercentage = $totalCount > 0 
            ? ($activeCount / $totalCount) * 100 
            : 0.0;
        
        return [
            'active_count' => $activeCount,
            'total_count' => $totalCount,
            'utilization_percentage' => round($utilizationPercentage, 2),
            'inactive_count' => $totalCount - $activeCount
        ];
    }

    /**
     * Get total modules enabled across ACTIVE hospitals
     * 
     * @return array Total modules enabled stats
     */
    private function getTotalModulesEnabled(): array
    {
        $sql = "
            SELECT 
                COUNT(DISTINCT hm.id) as total_enabled_modules,
                COUNT(DISTINCT hm.hospital_id) as hospitals_with_modules,
                COUNT(DISTINCT hm.module_id) as unique_modules_enabled
            FROM hospital_modules hm
            INNER JOIN hospitals h ON hm.hospital_id = h.id
            WHERE h.status = 'ACTIVE'
            AND h.deleted_at IS NULL
            AND hm.is_enabled = 1
        ";
        
        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'total_enabled_modules' => (int)($result['total_enabled_modules'] ?? 0),
            'hospitals_with_modules' => (int)($result['hospitals_with_modules'] ?? 0),
            'unique_modules_enabled' => (int)($result['unique_modules_enabled'] ?? 0)
        ];
    }

    /**
     * Get module usage breakdown
     * For each module, calculate:
     * - Count of ACTIVE hospitals
     * - Count of hospitals where module is enabled
     * - Usage percentage
     * 
     * @return array Module usage breakdown
     */
    private function getModuleUsageBreakdown(): array
    {
        // First, get total ACTIVE hospitals count
        $totalActiveHospitals = $this->getActiveHospitalsStats()['active_count'];
        
        $sql = "
            SELECT 
                m.id as module_id,
                m.module_code,
                m.module_name,
                m.description,
                COUNT(DISTINCT CASE 
                    WHEN hm.is_enabled = 1 AND h.status = 'ACTIVE' 
                    THEN h.id 
                END) as enabled_count,
                COUNT(DISTINCT CASE 
                    WHEN h.status = 'ACTIVE' 
                    THEN h.id 
                END) as active_hospitals_count
            FROM modules m
            LEFT JOIN hospital_modules hm ON m.id = hm.module_id
            LEFT JOIN hospitals h ON hm.hospital_id = h.id AND h.deleted_at IS NULL
            WHERE m.is_available = 1
            GROUP BY m.id, m.module_code, m.module_name, m.description
            ORDER BY enabled_count DESC, m.module_name ASC
        ";
        
        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $breakdown = [];
        foreach ($results as $row) {
            $enabledCount = (int)$row['enabled_count'];
            
            // Calculate usage percentage (NULL-safe)
            $usagePercentage = $totalActiveHospitals > 0 
                ? ($enabledCount / $totalActiveHospitals) * 100 
                : 0.0;
            
            $breakdown[] = [
                'module_id' => (int)$row['module_id'],
                'module_code' => $row['module_code'],
                'module_name' => $row['module_name'],
                'description' => $row['description'],
                'enabled_count' => $enabledCount,
                'total_active_hospitals' => $totalActiveHospitals,
                'usage_percentage' => round($usagePercentage, 2),
                'usage_ratio' => $enabledCount . '/' . $totalActiveHospitals
            ];
        }
        
        return $breakdown;
    }

    /**
     * Get usage summary for dashboard
     * 
     * @return array Usage summary
     */
    public function getUsageSummary(): array
    {
        $activeHospitals = $this->getActiveHospitalsStats();
        $modulesEnabled = $this->getTotalModulesEnabled();
        $moduleBreakdown = $this->getModuleUsageBreakdown();
        
        // Find most used module
        $mostUsedModule = null;
        if (!empty($moduleBreakdown)) {
            $mostUsedModule = $moduleBreakdown[0]; // Already sorted by enabled_count DESC
        }
        
        // Find least used module
        $leastUsedModule = null;
        if (!empty($moduleBreakdown)) {
            $leastUsedModule = end($moduleBreakdown);
        }
        
        return [
            'active_hospitals' => $activeHospitals,
            'total_modules_enabled' => $modulesEnabled,
            'module_breakdown' => $moduleBreakdown,
            'most_used_module' => $mostUsedModule,
            'least_used_module' => $leastUsedModule,
            'summary' => [
                'active_hospitals_count' => $activeHospitals['active_count'],
                'total_hospitals_count' => $activeHospitals['total_count'],
                'platform_utilization' => $activeHospitals['utilization_percentage'] . '%',
                'total_enabled_modules' => $modulesEnabled['total_enabled_modules'],
                'unique_modules' => $modulesEnabled['unique_modules_enabled'],
                'hospitals_with_modules' => $modulesEnabled['hospitals_with_modules']
            ]
        ];
    }

    /**
     * Get detailed hospital usage statistics
     * Shows which hospitals have which modules enabled
     * 
     * @return array Hospital usage details
     */
    public function getHospitalUsageDetails(): array
    {
        $sql = "
            SELECT 
                h.id as hospital_id,
                h.hospital_code,
                h.name as hospital_name,
                h.status,
                COUNT(CASE WHEN hm.is_enabled = 1 THEN 1 END) as enabled_modules_count,
                GROUP_CONCAT(
                    CASE WHEN hm.is_enabled = 1 
                    THEN m.module_name 
                    END 
                    ORDER BY m.module_name 
                    SEPARATOR ', '
                ) as enabled_modules
            FROM hospitals h
            LEFT JOIN hospital_modules hm ON h.id = hm.hospital_id
            LEFT JOIN modules m ON hm.module_id = m.id AND m.is_available = 1
            WHERE h.deleted_at IS NULL
            GROUP BY h.id, h.hospital_code, h.name, h.status
            ORDER BY h.status DESC, enabled_modules_count DESC, h.name ASC
        ";
        
        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $details = [];
        foreach ($results as $row) {
            $details[] = [
                'hospital_id' => (int)$row['hospital_id'],
                'hospital_code' => $row['hospital_code'],
                'hospital_name' => $row['hospital_name'],
                'status' => $row['status'],
                'enabled_modules_count' => (int)$row['enabled_modules_count'],
                'enabled_modules' => $row['enabled_modules'] ?? 'None'
            ];
        }
        
        return $details;
    }

    /**
     * Get module adoption trend
     * Shows how many hospitals have adopted each module count
     * 
     * @return array Module adoption trend
     */
    public function getModuleAdoptionTrend(): array
    {
        $sql = "
            SELECT 
                module_count,
                COUNT(*) as hospital_count
            FROM (
                SELECT 
                    h.id,
                    COUNT(CASE WHEN hm.is_enabled = 1 THEN 1 END) as module_count
                FROM hospitals h
                LEFT JOIN hospital_modules hm ON h.id = hm.hospital_id
                WHERE h.status = 'ACTIVE'
                AND h.deleted_at IS NULL
                GROUP BY h.id
            ) as hospital_modules
            GROUP BY module_count
            ORDER BY module_count ASC
        ";
        
        $stmt = $this->db->query($sql);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $trend = [];
        foreach ($results as $row) {
            $trend[] = [
                'module_count' => (int)$row['module_count'],
                'hospital_count' => (int)$row['hospital_count'],
                'label' => $row['module_count'] . ' modules'
            ];
        }
        
        return $trend;
    }
}
