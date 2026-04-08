<?php

/**
 * Audit Log Service
 * Handles audit logging for all Super Admin actions
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Services;

use App\Config\Database;
use PDO;

class AuditLogService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Log an action
     * 
     * @param string $action Action performed
     * @param string $resourceType Resource type (HOSPITAL, SUBSCRIPTION, MODULE, AUTH)
     * @param int|null $resourceId Resource ID
     * @param int $actorId Super Admin ID
     * @param array|null $oldValues Previous state
     * @param array|null $newValues New state
     * @return bool Success status
     */
    public function log(
        string $action,
        string $resourceType,
        ?int $resourceId,
        int $actorId,
        ?array $oldValues = null,
        ?array $newValues = null
    ): bool {
        $sql = "
            INSERT INTO platform_audit_logs (
                actor_type,
                actor_id,
                action_type,
                entity_type,
                entity_id,
                actor_ip,
                user_agent,
                status,
                created_at
            ) VALUES (
                'SUPER_ADMIN',
                :actor_id,
                :action_type,
                :entity_type,
                :entity_id,
                :actor_ip,
                :user_agent,
                'SUCCESS',
                NOW()
            )
        ";

        $stmt = $this->db->prepare($sql);
        
        return $stmt->execute([
            'actor_id' => $actorId,
            'action_type' => $action,
            'entity_type' => $resourceType,
            'entity_id' => $resourceId,
            'actor_ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
        ]);
    }
}
