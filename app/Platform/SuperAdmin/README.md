# Super Admin Module

This module handles all platform-level Super Admin functionality for the Hospital Management System.

## Directory Structure

```
SuperAdmin/
├── Controllers/       # HTTP request handlers
├── Services/         # Business logic layer
├── Repositories/     # Database access layer
└── routes.php        # Route definitions
```

## Architecture

### Controllers
- Handle HTTP requests and responses
- Validate input using middleware
- Delegate business logic to Services
- Return standardized JSON responses
- No direct database access

### Services
- Implement business rules and logic
- Coordinate between repositories
- Handle state transitions
- Enforce business constraints
- No HTTP concerns

### Repositories
- Direct database access using PDO
- Execute queries with prepared statements
- Return raw data (arrays)
- No business logic
- No HTTP concerns

## Route Namespace

All Super Admin routes use the `/api/platform/admin` namespace.

## Middleware

All routes (except login) require:
- `AuthMiddleware` - JWT authentication
- `SuperAdminMiddleware` - SUPER_ADMIN role verification
- `RateLimitMiddleware` - Rate limiting (for write operations)

## Features

1. **Authentication**
   - Login
   - Logout

2. **Hospital Management**
   - Create hospital
   - List hospitals (with pagination, filters, search)
   - View hospital details
   - Update hospital details
   - Change hospital status
   - Extend subscription
   - Soft delete hospital
   - Upload hospital logo

3. **Module Configuration**
   - List hospital modules
   - Enable module
   - Disable module
   - Bulk update modules

4. **Dashboard**
   - Platform statistics
   - Recent activities

5. **Reports**
   - Revenue by hospital
   - Subscription renewals due
   - System usage statistics

## Security

- All endpoints require JWT authentication
- All endpoints require SUPER_ADMIN role
- Rate limiting on write operations
- Input validation on all requests
- Audit logging for all actions
- No access to hospital operational data
- No access to patient data

## Database Tables

- `platform_super_admins` - Super Admin accounts
- `hospitals` - Hospital entities
- `subscription_plans` - Available plans
- `subscription_plan_modules` - Plan-module mapping
- `hospital_subscriptions` - Subscription history
- `hospital_modules` - Module configuration
- `platform_audit_logs` - Audit trail
- `platform_activity_summary` - Dashboard statistics
