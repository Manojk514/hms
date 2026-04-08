<?php

/**
 * Validation Middleware
 * Handles request input validation with reusable rules
 */

declare(strict_types=1);

namespace App\Platform\Middleware;

use App\Core\Middleware;
use App\Core\Request;
use App\Core\Response;

class ValidationMiddleware implements Middleware
{
    private array $rules = [];
    private array $messages = [];

    /**
     * Set validation rules
     */
    public function setRules(array $rules): self
    {
        $this->rules = $rules;
        return $this;
    }

    /**
     * Set custom error messages
     */
    public function setMessages(array $messages): self
    {
        $this->messages = $messages;
        return $this;
    }

    /**
     * Handle validation
     */
    public function handle(Request $request, Response $response): void
    {
        $data = $request->all();
        $errors = [];

        foreach ($this->rules as $field => $ruleSet) {
            $ruleList = is_string($ruleSet) ? explode('|', $ruleSet) : $ruleSet;
            $value = $data[$field] ?? null;

            foreach ($ruleList as $rule) {
                $error = $this->validateRule($field, $value, $rule, $data);
                
                if ($error !== null) {
                    if (!isset($errors[$field])) {
                        $errors[$field] = [];
                    }
                    $errors[$field][] = $error;
                }
            }
        }

        if (!empty($errors)) {
            $response->validationError($errors);
        }
    }

    /**
     * Validate single rule
     */
    private function validateRule(string $field, $value, string $rule, array $data): ?string
    {
        // Parse rule with parameters (e.g., "min:3", "max:255")
        $parts = explode(':', $rule, 2);
        $ruleName = $parts[0];
        $ruleParam = $parts[1] ?? null;

        switch ($ruleName) {
            case 'required':
                return $this->validateRequired($field, $value);

            case 'email':
                return $this->validateEmail($field, $value);

            case 'min':
                return $this->validateMin($field, $value, (int)$ruleParam);

            case 'max':
                return $this->validateMax($field, $value, (int)$ruleParam);

            case 'numeric':
                return $this->validateNumeric($field, $value);

            case 'integer':
                return $this->validateInteger($field, $value);

            case 'in':
                $allowed = explode(',', $ruleParam);
                return $this->validateIn($field, $value, $allowed);

            case 'url':
                return $this->validateUrl($field, $value);

            case 'date':
                return $this->validateDate($field, $value);

            case 'boolean':
                return $this->validateBoolean($field, $value);

            case 'alpha':
                return $this->validateAlpha($field, $value);

            case 'alphanumeric':
                return $this->validateAlphanumeric($field, $value);

            default:
                return null;
        }
    }

    /**
     * Validate required field
     */
    private function validateRequired(string $field, $value): ?string
    {
        if ($value === null || $value === '' || (is_array($value) && empty($value))) {
            return $this->getMessage($field, 'required', "{$field} is required");
        }
        return null;
    }

    /**
     * Validate email format
     */
    private function validateEmail(string $field, $value): ?string
    {
        if ($value === null || $value === '') {
            return null; // Skip if empty (use 'required' rule for that)
        }

        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            return $this->getMessage($field, 'email', "Invalid email format");
        }
        return null;
    }

    /**
     * Validate minimum length/value
     */
    private function validateMin(string $field, $value, int $min): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            if ($value < $min) {
                return $this->getMessage($field, 'min', "{$field} must be at least {$min}");
            }
        } else {
            if (mb_strlen((string)$value) < $min) {
                return $this->getMessage($field, 'min', "{$field} must be at least {$min} characters");
            }
        }
        return null;
    }

    /**
     * Validate maximum length/value
     */
    private function validateMax(string $field, $value, int $max): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            if ($value > $max) {
                return $this->getMessage($field, 'max', "{$field} must not exceed {$max}");
            }
        } else {
            if (mb_strlen((string)$value) > $max) {
                return $this->getMessage($field, 'max', "{$field} must not exceed {$max} characters");
            }
        }
        return null;
    }

    /**
     * Validate numeric value
     */
    private function validateNumeric(string $field, $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!is_numeric($value)) {
            return $this->getMessage($field, 'numeric', "{$field} must be a number");
        }
        return null;
    }

    /**
     * Validate integer value
     */
    private function validateInteger(string $field, $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!filter_var($value, FILTER_VALIDATE_INT)) {
            return $this->getMessage($field, 'integer', "{$field} must be an integer");
        }
        return null;
    }

    /**
     * Validate value is in allowed list
     */
    private function validateIn(string $field, $value, array $allowed): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!in_array($value, $allowed, true)) {
            $allowedStr = implode(', ', $allowed);
            return $this->getMessage($field, 'in', "{$field} must be one of: {$allowedStr}");
        }
        return null;
    }

    /**
     * Validate URL format
     */
    private function validateUrl(string $field, $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!filter_var($value, FILTER_VALIDATE_URL)) {
            return $this->getMessage($field, 'url', "Invalid URL format");
        }
        return null;
    }

    /**
     * Validate date format (YYYY-MM-DD)
     */
    private function validateDate(string $field, $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $date = \DateTime::createFromFormat('Y-m-d', $value);
        if (!$date || $date->format('Y-m-d') !== $value) {
            return $this->getMessage($field, 'date', "Invalid date format. Use YYYY-MM-DD");
        }
        return null;
    }

    /**
     * Validate boolean value
     */
    private function validateBoolean(string $field, $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $valid = [true, false, 1, 0, '1', '0', 'true', 'false', 'yes', 'no'];
        if (!in_array($value, $valid, true)) {
            return $this->getMessage($field, 'boolean', "{$field} must be a boolean value");
        }
        return null;
    }

    /**
     * Validate alphabetic characters only
     */
    private function validateAlpha(string $field, $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!preg_match('/^[a-zA-Z\s\-\']+$/', $value)) {
            return $this->getMessage($field, 'alpha', "{$field} must contain only letters");
        }
        return null;
    }

    /**
     * Validate alphanumeric characters
     */
    private function validateAlphanumeric(string $field, $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!preg_match('/^[a-zA-Z0-9\s\-\']+$/', $value)) {
            return $this->getMessage($field, 'alphanumeric', "{$field} must contain only letters and numbers");
        }
        return null;
    }

    /**
     * Get custom or default error message
     */
    private function getMessage(string $field, string $rule, string $default): string
    {
        $key = "{$field}.{$rule}";
        return $this->messages[$key] ?? $this->messages[$field] ?? $default;
    }

    /**
     * Static factory method for inline usage
     */
    public static function validate(Request $request, Response $response, array $rules, array $messages = []): void
    {
        $validator = new self();
        $validator->setRules($rules);
        $validator->setMessages($messages);
        $validator->handle($request, $response);
    }
}
