<?php

/**
 * Rate Limit Middleware
 * Prevents abuse and DoS attacks
 */

declare(strict_types=1);

namespace App\Platform\Middleware;

use App\Core\Middleware;
use App\Core\Request;
use App\Core\Response;

class RateLimitMiddleware implements Middleware
{
    private const CACHE_PREFIX = 'rate_limit:';

    /**
     * Handle rate limiting
     */
    public function handle(Request $request, Response $response): void
    {
        $identifier = $this->getIdentifier($request);
        $perMinute = config('rate_limit.per_minute', 100);

        // Check rate limit
        $currentCount = $this->getRequestCount($identifier);

        if ($currentCount >= $perMinute) {
            $retryAfter = 60; // 1 minute
            $response->tooManyRequests(
                "Rate limit exceeded. Try again in {$retryAfter} seconds.",
                $retryAfter
            );
            return;
        }

        // Increment request count
        $this->incrementRequestCount($identifier);
    }

    /**
     * Get unique identifier for rate limiting
     * Uses user ID if authenticated, otherwise IP address
     */
    private function getIdentifier(Request $request): string
    {
        if (isset($request->userId)) {
            return 'user:' . $request->userId;
        }

        return 'ip:' . $request->ip();
    }

    /**
     * Get current request count
     * 
     * Note: This is a simple file-based implementation
     * In production, use Redis or Memcached for better performance
     */
    private function getRequestCount(string $identifier): int
    {
        $cacheFile = $this->getCacheFile($identifier);

        if (!file_exists($cacheFile)) {
            return 0;
        }

        $data = json_decode(file_get_contents($cacheFile), true);

        if ($data === null || !isset($data['count']) || !isset($data['expires'])) {
            return 0;
        }

        // Check if cache has expired
        if ($data['expires'] < time()) {
            unlink($cacheFile);
            return 0;
        }

        return (int)$data['count'];
    }

    /**
     * Increment request count
     */
    private function incrementRequestCount(string $identifier): void
    {
        $cacheFile = $this->getCacheFile($identifier);
        $currentCount = $this->getRequestCount($identifier);
        $expiresAt = time() + 60; // 1 minute

        $data = [
            'count' => $currentCount + 1,
            'expires' => $expiresAt,
        ];

        file_put_contents($cacheFile, json_encode($data));
    }

    /**
     * Get cache file path
     */
    private function getCacheFile(string $identifier): string
    {
        $cacheDir = BASE_PATH . config('logging.path', '/storage/logs') . '/rate_limit';

        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }

        $hash = md5(self::CACHE_PREFIX . $identifier);
        return $cacheDir . '/' . $hash . '.json';
    }
}
