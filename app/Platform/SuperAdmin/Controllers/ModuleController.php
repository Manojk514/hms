<?php

/**
 * Module Controller
 * Handles HTTP requests for module configuration
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Controllers;

use App\Core\Controller;
use App\Platform\SuperAdmin\Services\ModuleService;
use App\Utils\Validator;

class ModuleController extends Controller
{
    private ModuleService $moduleService;

    public function __construct($request, $response)
    {
        parent::__construct($request, $response);
        $this->moduleService = new ModuleService();
    }

    /**
     * Get all modules for hospital
     * GET /api/platform/admin/hospitals/{id}/modules
     */
    public function list(array $params): void
    {
        $hospitalId = (int)($params['id'] ?? 0);

        if ($hospitalId <= 0) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => 'Invalid hospital ID',
                'details' => []
            ], 400);
            return;
        }

        try {
            $modules = $this->moduleService->getModules($hospitalId);
            $this->response->success(['modules' => $modules]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Enable module for hospital
     * POST /api/platform/admin/hospitals/{id}/modules/{code}/enable
     */
    public function enable(array $params): void
    {
        $hospitalId = (int)($params['id'] ?? 0);
        $moduleCode = $params['code'] ?? '';

        if ($hospitalId <= 0) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => 'Invalid hospital ID',
                'details' => []
            ], 400);
            return;
        }

        if (empty($moduleCode)) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => 'Module code is required',
                'details' => []
            ], 400);
            return;
        }

        // Validate module code
        if (!Validator::moduleCode($moduleCode)) {
            $this->response->validationError([
                'module_code' => ['Invalid module code. Must be one of: OP, LAB, PHARMACY, BILLING, IPD, EMERGENCY']
            ]);
            return;
        }

        $notes = $this->input('notes');

        // Validate notes length if provided
        if ($notes !== null && !Validator::length($notes, 0, 1000)) {
            $this->response->validationError([
                'notes' => ['Notes must not exceed 1000 characters']
            ]);
            return;
        }

        try {
            $module = $this->moduleService->enableModule(
                $hospitalId,
                strtoupper($moduleCode),
                $notes,
                $this->request->userId
            );

            $this->response->success(['module' => $module]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Disable module for hospital
     * POST /api/platform/admin/hospitals/{id}/modules/{code}/disable
     */
    public function disable(array $params): void
    {
        $hospitalId = (int)($params['id'] ?? 0);
        $moduleCode = $params['code'] ?? '';

        if ($hospitalId <= 0) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => 'Invalid hospital ID',
                'details' => []
            ], 400);
            return;
        }

        if (empty($moduleCode)) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => 'Module code is required',
                'details' => []
            ], 400);
            return;
        }

        // Validate module code
        if (!Validator::moduleCode($moduleCode)) {
            $this->response->validationError([
                'module_code' => ['Invalid module code. Must be one of: OP, LAB, PHARMACY, BILLING, IPD, EMERGENCY']
            ]);
            return;
        }

        $reason = $this->input('reason');

        // Validate reason
        if (empty($reason)) {
            $this->response->validationError([
                'reason' => ['Reason is required']
            ]);
            return;
        }

        if (!Validator::length($reason, 10, 500)) {
            $this->response->validationError([
                'reason' => ['Reason must be between 10 and 500 characters']
            ]);
            return;
        }

        try {
            $module = $this->moduleService->disableModule(
                $hospitalId,
                strtoupper($moduleCode),
                $reason,
                $this->request->userId
            );

            $this->response->success(['module' => $module]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Bulk update modules
     * PATCH /api/platform/admin/hospitals/{id}/modules
     */
    public function bulkUpdate(array $params): void
    {
        $hospitalId = (int)($params['id'] ?? 0);

        if ($hospitalId <= 0) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => 'Invalid hospital ID',
                'details' => []
            ], 400);
            return;
        }

        $data = $this->request->all();

        // Validate input
        $errors = $this->validateBulkUpdateInput($data);
        if (!empty($errors)) {
            $this->response->validationError($errors);
            return;
        }

        try {
            $modules = $this->moduleService->bulkUpdate(
                $hospitalId,
                $data['modules'],
                $data['reason'] ?? null,
                $this->request->userId
            );

            $this->response->success(['modules' => $modules]);

        } catch (\Exception $e) {
            $this->handleException($e);
        }
    }

    /**
     * Validate bulk update input
     */
    private function validateBulkUpdateInput(array $data): array
    {
        $errors = [];

        // Modules array is required
        if (empty($data['modules']) || !is_array($data['modules'])) {
            $errors['modules'][] = 'Modules array is required';
            return $errors;
        }

        // Validate each module
        foreach ($data['modules'] as $index => $module) {
            if (!isset($module['module_code'])) {
                $errors["modules.{$index}.module_code"][] = 'Module code is required';
            } elseif (!Validator::moduleCode($module['module_code'])) {
                $errors["modules.{$index}.module_code"][] = 'Invalid module code';
            }

            if (!isset($module['is_enabled'])) {
                $errors["modules.{$index}.is_enabled"][] = 'is_enabled is required';
            } elseif (!is_bool($module['is_enabled'])) {
                $errors["modules.{$index}.is_enabled"][] = 'is_enabled must be a boolean';
            }

            // Validate notes if provided
            if (isset($module['notes']) && !Validator::length($module['notes'], 0, 1000)) {
                $errors["modules.{$index}.notes"][] = 'Notes must not exceed 1000 characters';
            }
        }

        // Check if any module is being disabled
        $hasDisabled = false;
        foreach ($data['modules'] as $module) {
            if (isset($module['is_enabled']) && !$module['is_enabled']) {
                $hasDisabled = true;
                break;
            }
        }

        // Require reason if disabling any module
        if ($hasDisabled) {
            if (empty($data['reason'])) {
                $errors['reason'][] = 'Reason is required when disabling modules';
            } elseif (!Validator::length($data['reason'], 10, 500)) {
                $errors['reason'][] = 'Reason must be between 10 and 500 characters';
            }
        }

        return $errors;
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
            $this->response->conflict($e->getMessage(), 'CANNOT_DISABLE_ALL_MODULES');
        } elseif ($code === 422) {
            $this->response->unprocessable($e->getMessage());
        } elseif ($code === 400) {
            $this->response->error([
                'code' => 'INVALID_INPUT',
                'message' => $e->getMessage(),
                'details' => []
            ], 400);
        } else {
            error_log('Module controller error: ' . $e->getMessage());
            $this->response->serverError(
                config('app.debug') ? $e->getMessage() : 'An unexpected error occurred. Please try again later.'
            );
        }
    }
}
