<?php

/**
 * Auth Controller
 * Handles authentication for Super Admin
 */

declare(strict_types=1);

namespace App\Platform\SuperAdmin\Controllers;

use App\Core\Controller;
use App\Platform\SuperAdmin\Services\AuthService;
use App\Utils\Validator;

class AuthController extends Controller
{
    private AuthService $authService;

    public function __construct($request, $response)
    {
        parent::__construct($request, $response);
        $this->authService = new AuthService();
    }

    /**
     * Login
     * POST /api/platform/admin/login
     */
    public function login(): void
    {
        $email = $this->input('email');
        $password = $this->input('password');

        // Validate input
        $errors = [];

        if (empty($email)) {
            $errors['email'][] = 'Email is required';
        } elseif (!Validator::email($email)) {
            $errors['email'][] = 'Invalid email format';
        }

        if (empty($password)) {
            $errors['password'][] = 'Password is required';
        }

        if (!empty($errors)) {
            $this->response->validationError($errors);
            return;
        }

        try {
            $result = $this->authService->login($email, $password);
            $this->response->success($result);

        } catch (\Exception $e) {
            $code = $e->getCode();
            
            if ($code === 401) {
                $this->response->unauthorized($e->getMessage(), 'INVALID_CREDENTIALS');
            } else {
                error_log('Login error: ' . $e->getMessage());
                $this->response->serverError('An unexpected error occurred. Please try again later.');
            }
        }
    }

    /**
     * Logout
     * POST /api/platform/admin/logout
     */
    public function logout(): void
    {
        try {
            $this->authService->logout($this->request->userId);
            $this->response->success(['message' => 'Logged out successfully']);

        } catch (\Exception $e) {
            error_log('Logout error: ' . $e->getMessage());
            $this->response->serverError('An unexpected error occurred. Please try again later.');
        }
    }
}
