<?php

/**
 * Middleware Interface
 * Base interface for all middleware classes
 */

declare(strict_types=1);

namespace App\Core;

interface Middleware
{
    /**
     * Handle the request
     * 
     * @param Request $request
     * @param Response $response
     * @return void
     */
    public function handle(Request $request, Response $response): void;
}
