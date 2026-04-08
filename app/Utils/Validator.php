<?php

/**
 * Validator
 * Common validation rules for input data
 */

declare(strict_types=1);

namespace App\Utils;

class Validator
{
    /**
     * Validate email format
     * 
     * @param string $email Email address
     * @return bool True if valid, false otherwise
     */
    public static function email(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate phone number
     * Must contain at least 10 digits
     * 
     * @param string $phone Phone number
     * @return bool True if valid, false otherwise
     */
    public static function phone(string $phone): bool
    {
        // Remove non-digit characters
        $digits = preg_replace('/\D/', '', $phone);
        
        // Must have at least 10 digits
        return strlen($digits) >= 10 && strlen($digits) <= 15;
    }

    /**
     * Validate date format (YYYY-MM-DD)
     * 
     * @param string $date Date string
     * @return bool True if valid, false otherwise
     */
    public static function date(string $date): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }

    /**
     * Validate datetime format (YYYY-MM-DD HH:MM:SS)
     * 
     * @param string $datetime Datetime string
     * @return bool True if valid, false otherwise
     */
    public static function datetime(string $datetime): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d H:i:s', $datetime);
        return $d && $d->format('Y-m-d H:i:s') === $datetime;
    }

    /**
     * Validate URL format
     * 
     * @param string $url URL string
     * @return bool True if valid, false otherwise
     */
    public static function url(string $url): bool
    {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }

    /**
     * Validate HTTPS URL
     * 
     * @param string $url URL string
     * @return bool True if valid HTTPS URL, false otherwise
     */
    public static function httpsUrl(string $url): bool
    {
        return self::url($url) && str_starts_with($url, 'https://');
    }

    /**
     * Validate string length
     * 
     * @param string $value String value
     * @param int $min Minimum length
     * @param int|null $max Maximum length (optional)
     * @return bool True if valid, false otherwise
     */
    public static function length(string $value, int $min, ?int $max = null): bool
    {
        $length = mb_strlen($value);
        
        if ($length < $min) {
            return false;
        }
        
        if ($max !== null && $length > $max) {
            return false;
        }
        
        return true;
    }

    /**
     * Validate numeric value
     * 
     * @param mixed $value Value to validate
     * @return bool True if numeric, false otherwise
     */
    public static function numeric($value): bool
    {
        return is_numeric($value);
    }

    /**
     * Validate integer value
     * 
     * @param mixed $value Value to validate
     * @return bool True if integer, false otherwise
     */
    public static function integer($value): bool
    {
        return filter_var($value, FILTER_VALIDATE_INT) !== false;
    }

    /**
     * Validate positive integer
     * 
     * @param mixed $value Value to validate
     * @return bool True if positive integer, false otherwise
     */
    public static function positiveInteger($value): bool
    {
        return self::integer($value) && (int)$value > 0;
    }

    /**
     * Validate value is in allowed list
     * 
     * @param mixed $value Value to validate
     * @param array $allowed Allowed values
     * @param bool $strict Use strict comparison
     * @return bool True if in list, false otherwise
     */
    public static function in($value, array $allowed, bool $strict = true): bool
    {
        return in_array($value, $allowed, $strict);
    }

    /**
     * Validate enum value (case-insensitive)
     * 
     * @param string $value Value to validate
     * @param array $allowed Allowed values
     * @return bool True if valid enum, false otherwise
     */
    public static function enum(string $value, array $allowed): bool
    {
        $value = strtoupper($value);
        $allowed = array_map('strtoupper', $allowed);
        return in_array($value, $allowed, true);
    }

    /**
     * Validate boolean value
     * 
     * @param mixed $value Value to validate
     * @return bool True if boolean, false otherwise
     */
    public static function boolean($value): bool
    {
        $valid = [true, false, 1, 0, '1', '0', 'true', 'false', 'yes', 'no'];
        return in_array($value, $valid, true);
    }

    /**
     * Validate alphabetic characters only
     * 
     * @param string $value String value
     * @return bool True if alphabetic, false otherwise
     */
    public static function alpha(string $value): bool
    {
        return preg_match('/^[a-zA-Z\s\-\']+$/', $value) === 1;
    }

    /**
     * Validate alphanumeric characters
     * 
     * @param string $value String value
     * @return bool True if alphanumeric, false otherwise
     */
    public static function alphanumeric(string $value): bool
    {
        return preg_match('/^[a-zA-Z0-9\s\-\']+$/', $value) === 1;
    }

    /**
     * Validate postal code (flexible format)
     * 
     * @param string $postalCode Postal code
     * @return bool True if valid, false otherwise
     */
    public static function postalCode(string $postalCode): bool
    {
        // Alphanumeric with optional spaces and hyphens
        return preg_match('/^[a-zA-Z0-9\s\-]{3,20}$/', $postalCode) === 1;
    }

    /**
     * Validate hospital code format (HSP-XXXX)
     * 
     * @param string $code Hospital code
     * @return bool True if valid, false otherwise
     */
    public static function hospitalCode(string $code): bool
    {
        return preg_match('/^HSP-\d+$/', $code) === 1;
    }

    /**
     * Validate module code
     * 
     * @param string $code Module code
     * @return bool True if valid, false otherwise
     */
    public static function moduleCode(string $code): bool
    {
        $allowed = ['OP', 'LAB', 'PHARMACY', 'BILLING', 'IPD', 'EMERGENCY'];
        return self::enum($code, $allowed);
    }

    /**
     * Validate hospital status
     * 
     * @param string $status Hospital status
     * @return bool True if valid, false otherwise
     */
    public static function hospitalStatus(string $status): bool
    {
        $allowed = ['PENDING', 'ACTIVE', 'INACTIVE', 'DELETED'];
        return self::enum($status, $allowed);
    }

    /**
     * Validate subscription status
     * 
     * @param string $status Subscription status
     * @return bool True if valid, false otherwise
     */
    public static function subscriptionStatus(string $status): bool
    {
        $allowed = ['ACTIVE', 'EXPIRED', 'TRIAL', 'CANCELLED'];
        return self::enum($status, $allowed);
    }

    /**
     * Validate billing cycle
     * 
     * @param string $cycle Billing cycle
     * @return bool True if valid, false otherwise
     */
    public static function billingCycle(string $cycle): bool
    {
        $allowed = ['MONTHLY', 'ANNUAL'];
        return self::enum($cycle, $allowed);
    }

    /**
     * Validate payment status
     * 
     * @param string $status Payment status
     * @return bool True if valid, false otherwise
     */
    public static function paymentStatus(string $status): bool
    {
        $allowed = ['PENDING', 'PAID', 'FAILED'];
        return self::enum($status, $allowed);
    }

    /**
     * Validate date is not in the past
     * 
     * @param string $date Date string (YYYY-MM-DD)
     * @return bool True if not in past, false otherwise
     */
    public static function notInPast(string $date): bool
    {
        if (!self::date($date)) {
            return false;
        }
        
        $dateObj = new \DateTime($date);
        $today = new \DateTime('today');
        
        return $dateObj >= $today;
    }

    /**
     * Validate date is within range
     * 
     * @param string $date Date string (YYYY-MM-DD)
     * @param int $maxYearsInPast Maximum years in the past
     * @param int $maxYearsInFuture Maximum years in the future
     * @return bool True if within range, false otherwise
     */
    public static function dateInRange(
        string $date,
        int $maxYearsInPast = 5,
        int $maxYearsInFuture = 5
    ): bool {
        if (!self::date($date)) {
            return false;
        }
        
        $dateObj = new \DateTime($date);
        $minDate = new \DateTime("-{$maxYearsInPast} years");
        $maxDate = new \DateTime("+{$maxYearsInFuture} years");
        
        return $dateObj >= $minDate && $dateObj <= $maxDate;
    }

    /**
     * Validate file extension
     * 
     * @param string $filename Filename
     * @param array $allowedExtensions Allowed extensions
     * @return bool True if valid, false otherwise
     */
    public static function fileExtension(string $filename, array $allowedExtensions): bool
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $allowedExtensions = array_map('strtolower', $allowedExtensions);
        return in_array($extension, $allowedExtensions, true);
    }

    /**
     * Validate file MIME type
     * 
     * @param string $mimeType MIME type
     * @param array $allowedTypes Allowed MIME types
     * @return bool True if valid, false otherwise
     */
    public static function mimeType(string $mimeType, array $allowedTypes): bool
    {
        return in_array($mimeType, $allowedTypes, true);
    }

    /**
     * Validate file size
     * 
     * @param int $size File size in bytes
     * @param int $maxSize Maximum size in bytes
     * @return bool True if valid, false otherwise
     */
    public static function fileSize(int $size, int $maxSize): bool
    {
        return $size > 0 && $size <= $maxSize;
    }

    /**
     * Sanitize string (remove special characters)
     * 
     * @param string $value String value
     * @return string Sanitized string
     */
    public static function sanitize(string $value): string
    {
        return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Sanitize filename (remove dangerous characters)
     * 
     * @param string $filename Filename
     * @return string Sanitized filename
     */
    public static function sanitizeFilename(string $filename): string
    {
        // Remove path separators and special characters
        $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
        // Remove multiple underscores
        $filename = preg_replace('/_+/', '_', $filename);
        return trim($filename, '_');
    }

    /**
     * Validate and sanitize email
     * 
     * @param string $email Email address
     * @return string|null Sanitized email or null if invalid
     */
    public static function sanitizeEmail(string $email): ?string
    {
        $email = strtolower(trim($email));
        return self::email($email) ? $email : null;
    }

    /**
     * Validate password strength
     * 
     * @param string $password Password
     * @param int $minLength Minimum length
     * @return array Validation result with 'valid' and 'errors' keys
     */
    public static function passwordStrength(string $password, int $minLength = 8): array
    {
        $errors = [];
        
        if (strlen($password) < $minLength) {
            $errors[] = "Password must be at least {$minLength} characters";
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = "Password must contain at least one uppercase letter";
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = "Password must contain at least one lowercase letter";
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = "Password must contain at least one number";
        }
        
        if (!preg_match('/[^a-zA-Z0-9]/', $password)) {
            $errors[] = "Password must contain at least one special character";
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Validate multiple fields at once
     * 
     * @param array $data Data to validate
     * @param array $rules Validation rules
     * @return array Validation errors (empty if valid)
     */
    public static function validateFields(array $data, array $rules): array
    {
        $errors = [];
        
        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;
            
            foreach ($fieldRules as $rule => $params) {
                $isValid = match($rule) {
                    'required' => !empty($value),
                    'email' => $value ? self::email($value) : true,
                    'phone' => $value ? self::phone($value) : true,
                    'date' => $value ? self::date($value) : true,
                    'url' => $value ? self::url($value) : true,
                    'min' => $value ? self::length($value, $params) : true,
                    'max' => $value ? self::length($value, 0, $params) : true,
                    'in' => $value ? self::in($value, $params) : true,
                    default => true
                };
                
                if (!$isValid) {
                    $errors[$field][] = self::getErrorMessage($field, $rule, $params);
                }
            }
        }
        
        return $errors;
    }

    /**
     * Get error message for validation rule
     * 
     * @param string $field Field name
     * @param string $rule Rule name
     * @param mixed $params Rule parameters
     * @return string Error message
     */
    private static function getErrorMessage(string $field, string $rule, $params): string
    {
        return match($rule) {
            'required' => "{$field} is required",
            'email' => "Invalid email format",
            'phone' => "Invalid phone number format",
            'date' => "Invalid date format. Use YYYY-MM-DD",
            'url' => "Invalid URL format",
            'min' => "{$field} must be at least {$params} characters",
            'max' => "{$field} must not exceed {$params} characters",
            'in' => "{$field} must be one of: " . implode(', ', $params),
            default => "{$field} is invalid"
        };
    }
}
