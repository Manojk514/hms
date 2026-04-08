<?php

declare(strict_types=1);

namespace App\Platform\Services;

/**
 * File Upload Service
 * Handles secure file uploads for the platform
 */
class FileUploadService
{
    private const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
    private const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    
    private string $uploadBasePath;
    private string $publicBasePath;

    public function __construct()
    {
        // Storage path (absolute) - now inside public directory
        $this->uploadBasePath = dirname(__DIR__, 3) . '/public/storage/uploads';
        
        // Public URL path (relative to public folder)
        $this->publicBasePath = '/storage/uploads';
    }

    /**
     * Upload hospital logo
     * 
     * @param array $file $_FILES array element
     * @return string Public URL to the uploaded file
     * @throws \Exception If upload fails
     */
    public function uploadHospitalLogo(array $file): string
    {
        // Validate file
        $this->validateImageFile($file);
        
        // Create directory if not exists
        $hospitalDir = $this->uploadBasePath . '/hospitals';
        if (!is_dir($hospitalDir)) {
            if (!mkdir($hospitalDir, 0755, true)) {
                throw new \Exception('Failed to create upload directory');
            }
        }
        
        // Generate unique filename
        $extension = $this->getFileExtension($file['name']);
        $filename = $this->generateUniqueFilename($extension);
        
        // Full path
        $targetPath = $hospitalDir . '/' . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            throw new \Exception('Failed to move uploaded file');
        }
        
        // Set file permissions
        chmod($targetPath, 0644);
        
        // Return public URL
        return $this->publicBasePath . '/hospitals/' . $filename;
    }

    /**
     * Validate image file
     * 
     * @param array $file $_FILES array element
     * @throws \Exception If validation fails
     */
    private function validateImageFile(array $file): void
    {
        // Check if file was uploaded
        if (!isset($file['error']) || is_array($file['error'])) {
            throw new \Exception('Invalid file upload');
        }

        // Check for upload errors
        switch ($file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                throw new \Exception('No file was uploaded');
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                throw new \Exception('File size exceeds limit');
            default:
                throw new \Exception('Unknown upload error');
        }

        // Check file size
        if ($file['size'] > self::MAX_FILE_SIZE) {
            throw new \Exception('File size exceeds 5MB limit');
        }

        // Check MIME type
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        
        if (!in_array($mimeType, self::ALLOWED_IMAGE_TYPES, true)) {
            throw new \Exception('Invalid file type. Only JPG, PNG, and WebP images are allowed');
        }

        // Check file extension
        $extension = strtolower($this->getFileExtension($file['name']));
        if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            throw new \Exception('Invalid file extension');
        }

        // Additional security: verify it's actually an image
        $imageInfo = @getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            throw new \Exception('File is not a valid image');
        }
    }

    /**
     * Get file extension from filename
     * 
     * @param string $filename
     * @return string
     */
    private function getFileExtension(string $filename): string
    {
        $parts = explode('.', $filename);
        return strtolower(end($parts));
    }

    /**
     * Generate unique filename
     * 
     * @param string $extension
     * @return string
     */
    private function generateUniqueFilename(string $extension): string
    {
        return uniqid('hospital_', true) . '_' . time() . '.' . $extension;
    }

    /**
     * Delete file by URL
     * 
     * @param string $fileUrl Public URL of the file
     * @return bool True if deleted, false otherwise
     */
    public function deleteFile(string $fileUrl): bool
    {
        // Convert public URL to file path
        $relativePath = str_replace($this->publicBasePath, '', $fileUrl);
        $filePath = $this->uploadBasePath . $relativePath;
        
        if (file_exists($filePath)) {
            return unlink($filePath);
        }
        
        return false;
    }
}
