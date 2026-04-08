<?php

/**
 * Hospital Controller
 * Handles HTTP requests for hospital management
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Controllers;

use App\Core\Controller;
use App\Platform\SuperAdmin\Services\HospitalService;
use App\Platform\Services\FileUploadService;
use App\Utils\Validator;

class HospitalController extends Controller
{
    private HospitalService $hospitalService;
    private FileUploadService $fileUpload;

    public function __construct($request, $response)
    {
        parent::__construct($request, $response);
        $this->hospitalService = new HospitalService();
        $this->fileUpload = new FileUploadService();
    }

    /**
     * Create new hospital
     * POST /api/platform/admin/hospitals
     */
    public function create(): void
    {
        // Validate input
        $data = $this->request->all();
        
        // DEBUG: Log received data
        error_log('=== CREATE HOSPITAL DEBUG ===');
        error_log('Received subscription value: ' . ($data['subscription'] ?? 'NOT SET'));
        error_log('Subscription is empty: ' . (empty($data['subscription']) ? 'YES' : 'NO'));
        error_log('All data keys: ' . implode(', ', array_keys($data)));
        
        $errors = $this->validateCreateInput($data);

        if (!empty($errors)) {
            $this->response->validationError($errors);
            return;
        }

        // Handle logo upload if present (optional)
        if ($this->request->hasFile('logo')) {
            try {
                $logoFile = $this->request->file('logo');
                $logoUrl = $this->fileUpload->uploadHospitalLogo($logoFile);
                $data['logo_url'] = $logoUrl;
            } catch (\Exception $e) {
                // Log error but don't fail hospital creation
                error_log('Logo upload failed: ' . $e->getMessage());
                // Continue without logo
            }
        }

        try {
            $hospital = $this->hospitalService->create($data, $this->request->userId);
            $this->response->created(['hospital' => $hospital]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * List hospitals with pagination and filters
     * GET /api/platform/admin/hospitals
     */
    public function list(): void
    {
        try {
            // Get pagination parameters
            $pagination = $this->getPaginationParams();

            // Get filter parameters
            $filters = [
                'status' => $this->query('status'),
                'city' => $this->query('city'),
                'state' => $this->query('state'),
                'search' => $this->query('search'),
                'include_deleted' => $this->query('include_deleted') === 'true',
                'sort_by' => $this->query('sort_by', 'created_at'),
                'sort_order' => strtoupper($this->query('sort_order', 'DESC')),
            ];

            // Validate sort parameters
            $allowedSortFields = ['created_at', 'name', 'status', 'city', 'state', 'hospital_code'];
            if (!in_array($filters['sort_by'], $allowedSortFields)) {
                $filters['sort_by'] = 'created_at';
            }

            if (!in_array($filters['sort_order'], ['ASC', 'DESC'])) {
                $filters['sort_order'] = 'DESC';
            }

            // Get hospitals
            $result = $this->hospitalService->list(
                $filters,
                $pagination['page'],
                $pagination['per_page']
            );

            $this->response->paginated(
                $result['items'],
                $result['total'],
                $result['page'],
                $result['per_page']
            );

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get next hospital code
     * GET /api/platform/admin/hospitals/next-code
     */
    public function nextCode(): void
    {
        try {
            // Get the next hospital code from the service
            $nextCode = $this->hospitalService->getNextHospitalCode();

            $this->response->success([
                'hospital_code' => $nextCode
            ]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get subscription plans
     * GET /api/platform/admin/subscription-plans
     */
    public function getPlans(): void
    {
        try {
            $plans = $this->hospitalService->getSubscriptionPlans();
            
            $this->response->success([
                'plans' => $plans
            ]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get hospital details
     * GET /api/platform/admin/hospitals/{id}
     */
    public function show(array $params): void
    {
        $id = (int)($params['id'] ?? 0);

        if ($id <= 0) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => 'Invalid hospital ID',
                'details' => []
            ], 400);
            return;
        }

        try {
            $hospital = $this->hospitalService->getById($id);

            if (!$hospital) {
                $this->response->notFound([
                    'code' => 'HOSPITAL_NOT_FOUND',
                    'message' => "Hospital with ID {$id} does not exist",
                    'details' => []
                ]);
                return;
            }

            $this->response->success(['hospital' => $hospital]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Update hospital details
     * PUT /api/platform/admin/hospitals/{id}
     */
    public function update(array $params): void
    {
        $id = (int)($params['id'] ?? 0);

        if ($id <= 0) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => 'Invalid hospital ID',
                'details' => []
            ], 400);
            return;
        }

        // Validate input
        $data = $this->request->all();
        $errors = $this->validateUpdateInput($data);

        if (!empty($errors)) {
            $this->response->validationError($errors);
            return;
        }

        // Handle logo upload if present (optional)
        $oldLogoUrl = null;
        if ($this->request->hasFile('logo')) {
            try {
                // Get current hospital data to retrieve old logo URL
                $currentHospital = $this->hospitalService->getById($id);
                
                if ($currentHospital && !empty($currentHospital['logo_url'])) {
                    $oldLogoUrl = $currentHospital['logo_url'];
                }
                
                // Upload new logo
                $logoFile = $this->request->file('logo');
                $newLogoUrl = $this->fileUpload->uploadHospitalLogo($logoFile);
                $data['logo_url'] = $newLogoUrl;
                
                // Delete old logo file after successful upload
                if ($oldLogoUrl) {
                    try {
                        $this->fileUpload->deleteFile($oldLogoUrl);
                    } catch (\Exception $e) {
                        // Log error but don't fail the update
                        error_log('Failed to delete old logo: ' . $e->getMessage());
                    }
                }
            } catch (\Exception $e) {
                // Log error but don't fail hospital update
                error_log('Logo upload failed: ' . $e->getMessage());
                // Continue without logo update
            }
        }

        try {
            $hospital = $this->hospitalService->update($id, $data, $this->request->userId);
            $this->response->success(['hospital' => $hospital]);

        } catch (\Exception $e) {
            // If update fails and we uploaded a new logo, try to clean it up
            if (isset($newLogoUrl)) {
                try {
                    $this->fileUpload->deleteFile($newLogoUrl);
                } catch (\Exception $cleanupError) {
                    error_log('Failed to cleanup new logo after update failure: ' . $cleanupError->getMessage());
                }
            }
            
            $this->handleException($e);
        }
    }

    /**
     * Change hospital status
     * PATCH /api/platform/admin/hospitals/{id}/status
     */
    public function changeStatus(array $params): void
    {
        $id = (int)($params['id'] ?? 0);

        if ($id <= 0) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => 'Invalid hospital ID',
                'details' => []
            ], 400);
            return;
        }

        $status = $this->input('status');

        if (empty($status)) {
            $this->response->validationError(['status' => ['Status is required']]);
            return;
        }

        if (!Validator::hospitalStatus($status)) {
            $this->response->validationError([
                'status' => ['Status must be one of: PENDING, ACTIVE, INACTIVE']
            ]);
            return;
        }

        try {
            $hospital = $this->hospitalService->changeStatus(
                $id,
                strtoupper($status),
                $this->request->userId
            );
            $this->response->success(['hospital' => $hospital]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Extend subscription
     * POST /api/platform/admin/hospitals/{id}/subscriptions
     */
    public function extendSubscription(array $params): void
    {
        $id = (int)($params['id'] ?? 0);

        if ($id <= 0) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => 'Invalid hospital ID',
                'details' => []
            ], 400);
            return;
        }

        // Validate input
        $data = $this->request->all();
        $errors = $this->validateSubscriptionInput($data);

        if (!empty($errors)) {
            $this->response->validationError($errors);
            return;
        }

        try {
            $subscription = $this->hospitalService->extendSubscription(
                $id,
                $data,
                $this->request->userId
            );
            $this->response->created(['subscription' => $subscription]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Soft delete hospital
     * DELETE /api/platform/admin/hospitals/{id}
     */
    public function delete(array $params): void
    {
        $id = (int)($params['id'] ?? 0);

        if ($id <= 0) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => 'Invalid hospital ID',
                'details' => []
            ], 400);
            return;
        }

        try {
            $this->hospitalService->delete($id, $this->request->userId);
            $this->response->success(['message' => 'Hospital deleted successfully']);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Upload hospital logo
     * POST /api/platform/admin/hospitals/{id}/logo
     */
    public function uploadLogo(array $params): void
    {
        $id = (int)($params['id'] ?? 0);

        if ($id <= 0) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => 'Invalid hospital ID',
                'details' => []
            ], 400);
            return;
        }

        // Validate file upload
        if (!$this->request->hasFile('logo')) {
            $this->response->validationError(['logo' => ['Logo file is required']]);
            return;
        }

        $file = $this->request->file('logo');

        // Validate file
        $errors = $this->validateLogoFile($file);
        if (!empty($errors)) {
            $this->response->validationError($errors);
            return;
        }

        try {
            // Upload file
            $logoUrl = $this->uploadFile($file, $id);

            // Update hospital
            $hospital = $this->hospitalService->updateLogo(
                $id,
                $logoUrl,
                $this->request->userId
            );

            $this->response->success(['hospital' => $hospital]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Validate create input
     */
    private function validateCreateInput(array $data): array
    {
        $errors = [];

        // Name
        if (empty($data['name'])) {
            $errors['name'][] = 'Hospital name is required';
        } elseif (!Validator::length($data['name'], 3, 255)) {
            $errors['name'][] = 'Hospital name must be between 3 and 255 characters';
        }

        // Email
        if (empty($data['email'])) {
            $errors['email'][] = 'Email is required';
        } elseif (!Validator::email($data['email'])) {
            $errors['email'][] = 'Invalid email format';
        }

        // Phone
        if (empty($data['phone'])) {
            $errors['phone'][] = 'Phone is required';
        } elseif (!Validator::phone($data['phone'])) {
            $errors['phone'][] = 'Phone must be between 10 and 20 characters';
        }

        // Address Line 1
        if (empty($data['address_line1'])) {
            $errors['address_line1'][] = 'Address line 1 is required';
        } elseif (!Validator::length($data['address_line1'], 5, 255)) {
            $errors['address_line1'][] = 'Address line 1 must be between 5 and 255 characters';
        }

        // City
        if (empty($data['city'])) {
            $errors['city'][] = 'City is required';
        } elseif (!Validator::length($data['city'], 2, 100)) {
            $errors['city'][] = 'City must be between 2 and 100 characters';
        }

        // State
        if (empty($data['state'])) {
            $errors['state'][] = 'State is required';
        } elseif (!Validator::length($data['state'], 2, 100)) {
            $errors['state'][] = 'State must be between 2 and 100 characters';
        }

        // Country (optional, default to India)
        if (!empty($data['country']) && !Validator::length($data['country'], 2, 100)) {
            $errors['country'][] = 'Country must be between 2 and 100 characters';
        }

        // Website (optional)
        if (!empty($data['website']) && !Validator::url($data['website'])) {
            $errors['website'][] = 'Invalid URL format';
        }

        // Logo URL (optional)
        // Note: logo_url is set by FileUploadService, not by user input
        // It's a relative path like /storage/uploads/hospitals/filename.png
        // Skip validation as it's system-generated

        return $errors;
    }

    /**
     * Validate update input
     */
    private function validateUpdateInput(array $data): array
    {
        $errors = [];

        // At least one field must be provided
        if (empty($data)) {
            $errors['_general'][] = 'At least one field must be provided for update';
            return $errors;
        }

        // Name (optional)
        if (isset($data['name']) && !Validator::length($data['name'], 3, 255)) {
            $errors['name'][] = 'Hospital name must be between 3 and 255 characters';
        }

        // Email (optional)
        if (isset($data['email']) && !Validator::email($data['email'])) {
            $errors['email'][] = 'Invalid email format';
        }

        // Phone (optional)
        if (isset($data['phone']) && !Validator::phone($data['phone'])) {
            $errors['phone'][] = 'Phone must be between 10 and 20 characters';
        }

        // Address Line 1 (optional)
        if (isset($data['address_line1']) && !Validator::length($data['address_line1'], 5, 255)) {
            $errors['address_line1'][] = 'Address line 1 must be between 5 and 255 characters';
        }

        // City (optional)
        if (isset($data['city']) && !Validator::length($data['city'], 2, 100)) {
            $errors['city'][] = 'City must be between 2 and 100 characters';
        }

        // State (optional)
        if (isset($data['state']) && !Validator::length($data['state'], 2, 100)) {
            $errors['state'][] = 'State must be between 2 and 100 characters';
        }

        // Country (optional)
        if (isset($data['country']) && !Validator::length($data['country'], 2, 100)) {
            $errors['country'][] = 'Country must be between 2 and 100 characters';
        }

        // Website (optional)
        if (isset($data['website']) && !empty($data['website']) && !Validator::url($data['website'])) {
            $errors['website'][] = 'Invalid URL format';
        }

        // Logo URL (optional)
        // Note: logo_url is set by FileUploadService, not by user input
        // It's a relative path like /storage/uploads/hospitals/filename.png
        // Skip validation as it's system-generated

        return $errors;
    }

    /**
     * Validate subscription input
     */
    private function validateSubscriptionInput(array $data): array
    {
        $errors = [];

        // Plan ID
        if (empty($data['plan_id'])) {
            $errors['plan_id'][] = 'Plan ID is required';
        } elseif (!Validator::positiveInteger($data['plan_id'])) {
            $errors['plan_id'][] = 'Plan ID must be a positive integer';
        }

        // Billing Cycle
        if (empty($data['billing_cycle'])) {
            $errors['billing_cycle'][] = 'Billing cycle is required';
        } elseif (!Validator::billingCycle($data['billing_cycle'])) {
            $errors['billing_cycle'][] = 'Billing cycle must be MONTHLY or ANNUAL';
        }

        // Start Date (optional)
        if (!empty($data['start_date'])) {
            if (!Validator::date($data['start_date'])) {
                $errors['start_date'][] = 'Invalid date format. Use YYYY-MM-DD';
            } elseif (!Validator::dateInRange($data['start_date'], 1, 1)) {
                $errors['start_date'][] = 'Start date cannot be more than 1 year in the past or future';
            }
        }

        // Payment Status (optional)
        if (!empty($data['payment_status']) && !Validator::paymentStatus($data['payment_status'])) {
            $errors['payment_status'][] = 'Payment status must be PENDING, PAID, or FAILED';
        }

        // Payment Reference (required if payment_status is PAID)
        if (!empty($data['payment_status']) && strtoupper($data['payment_status']) === 'PAID') {
            if (empty($data['payment_reference'])) {
                $errors['payment_reference'][] = 'Payment reference is required when payment status is PAID';
            }
        }

        return $errors;
    }

    /**
     * Validate logo file
     */
    private function validateLogoFile(array $file): array
    {
        $errors = [];

        // Check file upload error
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors['logo'][] = 'File upload failed';
            return $errors;
        }

        // Validate file size (2MB max)
        $maxSize = config('upload.max_size', 2097152);
        if (!Validator::fileSize($file['size'], $maxSize)) {
            $errors['logo'][] = 'File size exceeds 2MB limit';
        }

        // Validate file type
        $allowedTypes = config('upload.allowed_types', ['image/jpeg', 'image/png']);
        if (!Validator::mimeType($file['type'], $allowedTypes)) {
            $errors['logo'][] = 'Only JPEG and PNG images are allowed';
        }

        // Validate file extension
        $allowedExtensions = config('upload.allowed_extensions', ['jpg', 'jpeg', 'png']);
        if (!Validator::fileExtension($file['name'], $allowedExtensions)) {
            $errors['logo'][] = 'Only JPEG and PNG images are allowed';
        }

        return $errors;
    }

    /**
     * Upload file and return URL
     */
    private function uploadFile(array $file, int $hospitalId): string
    {
        // Get hospital to get hospital code
        $hospital = $this->hospitalService->getById($hospitalId);
        if (!$hospital) {
            throw new \Exception("Hospital with ID {$hospitalId} does not exist", 404);
        }

        $hospitalCode = $hospital['hospital_code'];
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $timestamp = time();
        $filename = "{$hospitalCode}_logo_{$timestamp}.{$extension}";

        // Create upload directory
        $uploadPath = BASE_PATH . config('upload.path', '/storage/uploads') . "/hospitals/{$hospitalCode}";
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }

        // Move uploaded file
        $destination = $uploadPath . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new \Exception('Failed to upload file', 500);
        }

        // Return relative URL
        return "/uploads/hospitals/{$hospitalCode}/{$filename}";
    }

    /**
     * Handle exceptions and return appropriate responses
     */
    private function handleException(\Exception $e): void
    {
        $code = $e->getCode();

        if ($code === 404) {
            $this->response->notFound([
                'code' => 'HOSPITAL_NOT_FOUND',
                'message' => $e->getMessage(),
                'details' => []
            ]);
        } elseif ($code === 409) {
            $this->response->conflict($e->getMessage(), 'DUPLICATE_EMAIL');
        } elseif ($code === 422) {
            $this->response->unprocessable($e->getMessage());
        } else {
            error_log('Hospital controller error: ' . $e->getMessage());
            $this->response->serverError(
                config('app.debug') ? $e->getMessage() : 'An unexpected error occurred. Please try again later.'
            );
        }
    }
}
