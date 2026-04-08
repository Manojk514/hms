<?php

/**
 * Hospital Repository
 * Database access layer for hospital-related operations
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Repositories;

use App\Config\Database;
use PDO;

class HospitalRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    /**
     * Create new hospital
     * 
     * @param array $data Hospital data
     * @return int Hospital ID
     */
    public function create(array $data): int
    {
        $sql = "
            INSERT INTO hospitals (
                hospital_code,
                name,
                email,
                phone,
                address_line1,
                address_line2,
                city,
                state,
                country,
                postal_code,
                subscription,
                logo_url,
                website,
                status,
                created_by,
                created_at
            ) VALUES (
                :hospital_code,
                :name,
                :email,
                :phone,
                :address_line1,
                :address_line2,
                :city,
                :state,
                :country,
                :postal_code,
                :subscription,
                :logo_url,
                :website,
                :status,
                :created_by,
                NOW()
            )
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'hospital_code' => $data['hospital_code'],
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'address_line1' => $data['address_line1'],
            'address_line2' => $data['address_line2'] ?? null,
            'city' => $data['city'],
            'state' => $data['state'],
            'country' => $data['country'],
            'postal_code' => $data['postal_code'] ?? null,
            'subscription' => $data['subscription'] ?? '',
            'logo_url' => $data['logo_url'] ?? null,
            'website' => $data['website'] ?? null,
            'status' => $data['status'] ?? 'PENDING',
            'created_by' => $data['created_by'],
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * Find hospital by ID
     * 
     * @param int $id Hospital ID
     * @param bool $includeDeleted Include soft-deleted hospitals
     * @return array|null Hospital data or null if not found
     */
    public function findById(int $id, bool $includeDeleted = false): ?array
    {
        $sql = "
            SELECT 
                id,
                hospital_code,
                name,
                email,
                phone,
                address_line1,
                address_line2,
                city,
                state,
                country,
                postal_code,
                logo_url,
                website,
                status,
                created_by,
                created_at,
                updated_at,
                deleted_at
            FROM hospitals
            WHERE id = :id
        ";

        if (!$includeDeleted) {
            $sql .= " AND deleted_at IS NULL";
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Find hospital by hospital code
     * 
     * @param string $hospitalCode Hospital code
     * @param bool $includeDeleted Include soft-deleted hospitals
     * @return array|null Hospital data or null if not found
     */
    public function findByCode(string $hospitalCode, bool $includeDeleted = false): ?array
    {
        $sql = "
            SELECT 
                id,
                hospital_code,
                name,
                email,
                phone,
                address_line1,
                address_line2,
                city,
                state,
                country,
                postal_code,
                logo_url,
                website,
                status,
                created_by,
                created_at,
                updated_at,
                deleted_at
            FROM hospitals
            WHERE hospital_code = :hospital_code
        ";

        if (!$includeDeleted) {
            $sql .= " AND deleted_at IS NULL";
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['hospital_code' => $hospitalCode]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Find hospital by email
     * 
     * @param string $email Email address
     * @param int|null $excludeId Exclude hospital with this ID
     * @return array|null Hospital data or null if not found
     */
    public function findByEmail(string $email, ?int $excludeId = null): ?array
    {
        $sql = "
            SELECT 
                id,
                hospital_code,
                name,
                email,
                status
            FROM hospitals
            WHERE email = :email
            AND deleted_at IS NULL
        ";

        if ($excludeId !== null) {
            $sql .= " AND id != :exclude_id";
        }

        $stmt = $this->db->prepare($sql);
        
        $params = ['email' => $email];
        if ($excludeId !== null) {
            $params['exclude_id'] = $excludeId;
        }
        
        $stmt->execute($params);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Get list of hospitals with pagination and filters
     * 
     * @param array $filters Filter criteria
     * @param int $limit Items per page
     * @param int $offset Offset for pagination
     * @return array List of hospitals
     */
    public function list(array $filters, int $limit, int $offset): array
    {
        $sql = "
            SELECT 
                id,
                hospital_code,
                name,
                email,
                phone,
                address_line1,
                address_line2,
                city,
                state,
                country,
                postal_code,
                subscription,
                logo_url,
                website,
                status,
                created_at,
                updated_at
            FROM hospitals
            WHERE 1=1
        ";

        $params = [];

        // Filter by status
        if (!empty($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }

        // Filter by city
        if (!empty($filters['city'])) {
            $sql .= " AND city LIKE :city";
            $params['city'] = '%' . $filters['city'] . '%';
        }

        // Filter by state
        if (!empty($filters['state'])) {
            $sql .= " AND state LIKE :state";
            $params['state'] = '%' . $filters['state'] . '%';
        }

        // Search by name, email, or hospital code
        if (!empty($filters['search'])) {
            $sql .= " AND (
                name LIKE :search 
                OR email LIKE :search 
                OR hospital_code LIKE :search
            )";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        // Include deleted hospitals if requested
        if (empty($filters['include_deleted'])) {
            $sql .= " AND deleted_at IS NULL";
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'DESC';
        $sql .= " ORDER BY {$sortBy} {$sortOrder}";

        // Pagination
        $sql .= " LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        
        // Bind pagination parameters separately (PDO requirement for integers)
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count hospitals with filters
     * 
     * @param array $filters Filter criteria
     * @return int Total count
     */
    public function count(array $filters): int
    {
        $sql = "SELECT COUNT(*) as total FROM hospitals WHERE 1=1";
        $params = [];

        // Apply same filters as list()
        if (!empty($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['city'])) {
            $sql .= " AND city LIKE :city";
            $params['city'] = '%' . $filters['city'] . '%';
        }

        if (!empty($filters['state'])) {
            $sql .= " AND state LIKE :state";
            $params['state'] = '%' . $filters['state'] . '%';
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (
                name LIKE :search 
                OR email LIKE :search 
                OR hospital_code LIKE :search
            )";
            $params['search'] = '%' . $filters['search'] . '%';
        }

        if (empty($filters['include_deleted'])) {
            $sql .= " AND deleted_at IS NULL";
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$result['total'];
    }

    /**
     * Update hospital
     * 
     * @param int $id Hospital ID
     * @param array $data Update data
     * @return bool Success status
     */
    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        // Build dynamic update query based on provided fields
        $allowedFields = [
            'name', 'email', 'phone', 'address_line1', 'address_line2',
            'city', 'state', 'country', 'postal_code', 'logo_url', 'website'
        ];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $fields[] = "updated_at = NOW()";

        $sql = "
            UPDATE hospitals 
            SET " . implode(', ', $fields) . "
            WHERE id = :id 
            AND deleted_at IS NULL
        ";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * Update hospital status
     * 
     * @param int $id Hospital ID
     * @param string $status New status
     * @return bool Success status
     */
    public function updateStatus(int $id, string $status): bool
    {
        $sql = "
            UPDATE hospitals 
            SET status = :status, updated_at = NOW()
            WHERE id = :id 
            AND deleted_at IS NULL
        ";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id' => $id,
            'status' => $status
        ]);
    }

    /**
     * Update hospital logo URL
     * 
     * @param int $id Hospital ID
     * @param string $logoUrl Logo URL
     * @return bool Success status
     */
    public function updateLogo(int $id, string $logoUrl): bool
    {
        $sql = "
            UPDATE hospitals 
            SET logo_url = :logo_url, updated_at = NOW()
            WHERE id = :id 
            AND deleted_at IS NULL
        ";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id' => $id,
            'logo_url' => $logoUrl
        ]);
    }

    /**
     * Soft delete hospital
     * 
     * @param int $id Hospital ID
     * @param int $deletedBy Super Admin ID
     * @return bool Success status
     */
    public function softDelete(int $id, int $deletedBy): bool
    {
        $sql = "
            UPDATE hospitals 
            SET 
                deleted_at = NOW(),
                deleted_by = :deleted_by,
                status = 'DELETED'
            WHERE id = :id 
            AND deleted_at IS NULL
        ";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            'id' => $id,
            'deleted_by' => $deletedBy
        ]);
    }

    /**
     * Generate next hospital code
     * 
     * @return string Hospital code (e.g., HSP-0001)
     */
    /**
     * Generate unique hospital code
     * Reuses deleted hospital codes to fill gaps
     * 
     * @return string Hospital code (e.g., HSP-0001)
     */
    public function generateHospitalCode(): string
    {
        // Find the first available gap in hospital codes
        $sql = "
            SELECT hospital_code 
            FROM hospitals 
            WHERE deleted_at IS NULL
            ORDER BY hospital_code ASC
        ";

        $stmt = $this->db->query($sql);
        $existingCodes = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // If no hospitals exist, start with HSP-0001
        if (empty($existingCodes)) {
            return 'HSP-0001';
        }

        // Find the first gap in the sequence
        $expectedNumber = 1;
        foreach ($existingCodes as $code) {
            // Extract number from code (e.g., HSP-0001 -> 1)
            $currentNumber = (int)substr($code, 4);
            
            // If there's a gap, use it
            if ($currentNumber > $expectedNumber) {
                return 'HSP-' . str_pad((string)$expectedNumber, 4, '0', STR_PAD_LEFT);
            }
            
            $expectedNumber = $currentNumber + 1;
        }

        // No gaps found, use the next sequential number
        return 'HSP-' . str_pad((string)$expectedNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Check if email exists
     * 
     * @param string $email Email address
     * @param int|null $excludeId Exclude hospital with this ID
     * @return bool True if exists, false otherwise
     */
    public function emailExists(string $email, ?int $excludeId = null): bool
    {
        return $this->findByEmail($email, $excludeId) !== null;
    }

    /**
     * Check if hospital code exists
     * 
     * @param string $hospitalCode Hospital code
     * @return bool True if exists, false otherwise
     */
    public function codeExists(string $hospitalCode): bool
    {
        return $this->findByCode($hospitalCode, true) !== null;
    }

    /**
     * Get hospital with current subscription details
     * 
     * @param int $id Hospital ID
     * @return array|null Hospital with subscription data
     */
    public function findWithSubscription(int $id): ?array
    {
        $sql = "
            SELECT 
                h.*,
                hs.id as subscription_id,
                hs.plan_id,
                hs.start_date,
                hs.end_date,
                hs.billing_cycle,
                hs.amount,
                hs.payment_status,
                hs.auto_renew,
                sp.plan_name
            FROM hospitals h
            LEFT JOIN hospital_subscriptions hs ON h.id = hs.hospital_id 
                AND hs.end_date >= CURDATE()
                AND hs.is_active = 1
            LEFT JOIN subscription_plans sp ON hs.plan_id = sp.id
            WHERE h.id = :id
            AND h.deleted_at IS NULL
            ORDER BY hs.end_date DESC
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Get hospitals with expiring subscriptions
     * 
     * @param int $daysThreshold Days until expiration
     * @return array List of hospitals
     */
    public function getExpiringSubscriptions(int $daysThreshold = 30): array
    {
        $sql = "
            SELECT 
                h.id,
                h.hospital_code,
                h.name,
                h.email,
                hs.end_date,
                DATEDIFF(hs.end_date, CURDATE()) as days_remaining
            FROM hospitals h
            INNER JOIN hospital_subscriptions hs ON h.id = hs.hospital_id
            WHERE h.deleted_at IS NULL
            AND h.status = 'ACTIVE'
            AND hs.is_active = 1
            AND hs.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL :days DAY)
            ORDER BY hs.end_date ASC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['days' => $daysThreshold]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Hard delete hospital (permanently remove from database)
     * Deletes all related records first to avoid foreign key constraints
     * 
     * @param int $id Hospital ID
     * @return bool Success status
     */
    public function hardDelete(int $id): bool
    {
        // Delete related records first to avoid foreign key constraints
        
        // Delete hospital subscriptions
        $sql = "DELETE FROM hospital_subscriptions WHERE hospital_id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        
        // Delete hospital modules
        $sql = "DELETE FROM hospital_modules WHERE hospital_id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        
        // Delete audit logs if table exists (optional)
        try {
            $sql = "DELETE FROM audit_logs WHERE entity_type = 'HOSPITAL' AND entity_id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            // Table doesn't exist, skip
        }
        
        // Finally, delete the hospital
        $sql = "DELETE FROM hospitals WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }
}
