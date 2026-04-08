<?php

/**
 * Super Admin Routes
 * Route mappings for Super Admin module
 */

declare(strict_types=1);

use App\Core\Router;

/**
 * Register Super Admin routes
 * 
 * @param Router $router Router instance
 * @return void
 */
return function (Router $router): void {
    
    // Authentication routes (no middleware required)
    $router->post(
        '/api/platform/admin/login',
        'App\Platform\SuperAdmin\Controllers\AuthController',
        'login'
    );

    $router->post(
        '/api/platform/admin/logout',
        'App\Platform\SuperAdmin\Controllers\AuthController',
        'logout'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    // Hospital Management routes
    $router->get(
        '/api/platform/admin/hospitals/next-code',
        'App\Platform\SuperAdmin\Controllers\HospitalController',
        'nextCode'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    // Subscription Plan routes
    $router->get(
        '/api/platform/admin/plans',
        'App\Platform\SuperAdmin\Controllers\SubscriptionPlanController',
        'index'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->post(
        '/api/platform/admin/plans',
        'App\Platform\SuperAdmin\Controllers\SubscriptionPlanController',
        'create'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware',
        'App\Platform\Middleware\RateLimitMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/plans/{id}',
        'App\Platform\SuperAdmin\Controllers\SubscriptionPlanController',
        'show'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->delete(
        '/api/platform/admin/plans/{id}',
        'App\Platform\SuperAdmin\Controllers\SubscriptionPlanController',
        'delete'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware',
        'App\Platform\Middleware\RateLimitMiddleware'
    ]);

    // Subscription Statistics routes
    $router->get(
        '/api/platform/admin/subscriptions/statistics',
        'App\Platform\SuperAdmin\Controllers\SubscriptionStatisticsController',
        'index'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    // Active Subscriptions routes
    $router->get(
        '/api/platform/admin/subscriptions/active',
        'App\Platform\SuperAdmin\Controllers\ActiveSubscriptionController',
        'list'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    // Legacy route for backward compatibility (simple list for dropdowns)
    $router->get(
        '/api/platform/admin/subscription-plans',
        'App\Platform\SuperAdmin\Controllers\HospitalController',
        'getPlans'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->post(
        '/api/platform/admin/hospitals',
        'App\Platform\SuperAdmin\Controllers\HospitalController',
        'create'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware',
        'App\Platform\Middleware\RateLimitMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/hospitals',
        'App\Platform\SuperAdmin\Controllers\HospitalController',
        'list'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/hospitals/{id}',
        'App\Platform\SuperAdmin\Controllers\HospitalController',
        'show'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->put(
        '/api/platform/admin/hospitals/{id}',
        'App\Platform\SuperAdmin\Controllers\HospitalController',
        'update'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware',
        'App\Platform\Middleware\RateLimitMiddleware'
    ]);

    $router->patch(
        '/api/platform/admin/hospitals/{id}/status',
        'App\Platform\SuperAdmin\Controllers\HospitalController',
        'changeStatus'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware',
        'App\Platform\Middleware\RateLimitMiddleware'
    ]);

    $router->post(
        '/api/platform/admin/hospitals/{id}/subscriptions',
        'App\Platform\SuperAdmin\Controllers\HospitalController',
        'extendSubscription'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware',
        'App\Platform\Middleware\RateLimitMiddleware'
    ]);

    $router->delete(
        '/api/platform/admin/hospitals/{id}',
        'App\Platform\SuperAdmin\Controllers\HospitalController',
        'delete'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware',
        'App\Platform\Middleware\RateLimitMiddleware'
    ]);

    $router->post(
        '/api/platform/admin/hospitals/{id}/logo',
        'App\Platform\SuperAdmin\Controllers\HospitalController',
        'uploadLogo'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware',
        'App\Platform\Middleware\RateLimitMiddleware'
    ]);

    // Module Configuration routes
    $router->get(
        '/api/platform/admin/hospitals/{id}/modules',
        'App\Platform\SuperAdmin\Controllers\ModuleController',
        'list'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->post(
        '/api/platform/admin/hospitals/{id}/modules/{code}/enable',
        'App\Platform\SuperAdmin\Controllers\ModuleController',
        'enable'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware',
        'App\Platform\Middleware\RateLimitMiddleware'
    ]);

    $router->post(
        '/api/platform/admin/hospitals/{id}/modules/{code}/disable',
        'App\Platform\SuperAdmin\Controllers\ModuleController',
        'disable'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware',
        'App\Platform\Middleware\RateLimitMiddleware'
    ]);

    $router->patch(
        '/api/platform/admin/hospitals/{id}/modules',
        'App\Platform\SuperAdmin\Controllers\ModuleController',
        'bulkUpdate'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware',
        'App\Platform\Middleware\RateLimitMiddleware'
    ]);

    // Dashboard routes
    $router->get(
        '/api/platform/admin/dashboard',
        'App\Platform\SuperAdmin\Controllers\DashboardController',
        'index'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/dashboard/statistics',
        'App\Platform\SuperAdmin\Controllers\DashboardController',
        'statistics'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/dashboard/revenue-by-plan',
        'App\Platform\SuperAdmin\Controllers\DashboardController',
        'revenueByPlan'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/dashboard/hospital-revenue',
        'App\Platform\SuperAdmin\Controllers\DashboardController',
        'hospitalRevenue'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    // Reports routes
    $router->get(
        '/api/platform/admin/reports/revenue',
        'App\Platform\SuperAdmin\Controllers\ReportController',
        'revenue'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/reports/revenue/export',
        'App\Platform\SuperAdmin\Controllers\ReportController',
        'revenueExport'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    // Revenue Calculation routes
    $router->get(
        '/api/platform/admin/revenue/statistics',
        'App\Platform\SuperAdmin\Controllers\RevenueController',
        'statistics'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/revenue/summary',
        'App\Platform\SuperAdmin\Controllers\RevenueController',
        'summary'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/revenue/trend',
        'App\Platform\SuperAdmin\Controllers\RevenueController',
        'trend'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/revenue/export',
        'App\Platform\SuperAdmin\Controllers\RevenueController',
        'export'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/revenue/export-stats',
        'App\Platform\SuperAdmin\Controllers\RevenueController',
        'exportStats'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/reports/renewals',
        'App\Platform\SuperAdmin\Controllers\ReportController',
        'renewals'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/reports/usage',
        'App\Platform\SuperAdmin\Controllers\ReportController',
        'usage'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    // Usage Statistics routes
    $router->get(
        '/api/platform/admin/usage/statistics',
        'App\Platform\SuperAdmin\Controllers\UsageStatisticsController',
        'statistics'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/usage/summary',
        'App\Platform\SuperAdmin\Controllers\UsageStatisticsController',
        'summary'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/usage/hospitals',
        'App\Platform\SuperAdmin\Controllers\UsageStatisticsController',
        'hospitalDetails'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);

    $router->get(
        '/api/platform/admin/usage/adoption-trend',
        'App\Platform\SuperAdmin\Controllers\UsageStatisticsController',
        'adoptionTrend'
    )->middleware([
        'App\Platform\Middleware\AuthMiddleware',
        'App\Platform\Middleware\SuperAdminMiddleware'
    ]);
};
