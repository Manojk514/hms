# ITiVAT MED Platform - Project Structure

## Overview
Hospital Management System (HMS) with Super Admin Platform for managing multiple hospitals.

## Core Application Structure

### Backend (PHP)
```
app/
├── Config/
│   ├── config.php          # Application configuration
│   └── Database.php        # Database connection
├── Core/
│   ├── Controller.php      # Base controller
│   ├── helpers.php         # Helper functions
│   ├── Middleware.php      # Base middleware
│   ├── Request.php         # HTTP request handler
│   ├── Response.php        # HTTP response handler
│   └── Router.php          # Routing system
├── Platform/
│   ├── Controllers/
│   │   └── HealthController.php
│   ├── Middleware/
│   │   ├── AuthMiddleware.php
│   │   ├── RateLimitMiddleware.php
│   │   ├── SuperAdminMiddleware.php
│   │   └── ValidationMiddleware.php
│   ├── Services/
│   │   ├── FileUploadService.php
│   │   └── JWTService.php
│   └── SuperAdmin/
│       ├── Controllers/
│       │   ├── ActiveSubscriptionController.php
│       │   ├── AuthController.php
│       │   ├── DashboardController.php
│       │   ├── HospitalController.php
│       │   ├── ModuleController.php
│       │   ├── ReportController.php
│       │   ├── RevenueController.php
│       │   ├── SubscriptionPlanController.php
│       │   ├── SubscriptionStatisticsController.php
│       │   └── UsageStatisticsController.php
│       ├── Repositories/
│       │   ├── HospitalRepository.php
│       │   ├── ModuleRepository.php
│       │   └── SubscriptionRepository.php
│       ├── Services/
│       │   ├── ActiveSubscriptionService.php
│       │   ├── AuditLogService.php
│       │   ├── AuthService.php
│       │   ├── DashboardRevenueService.php
│       │   ├── DashboardService.php
│       │   ├── HospitalService.php
│       │   ├── ModuleService.php
│       │   ├── ReportService.php
│       │   ├── RevenueCalculationService.php
│       │   ├── RevenueExportService.php
│       │   ├── SubscriptionPlanService.php
│       │   ├── SubscriptionStatisticsService.php
│       │   └── UsageStatisticsService.php
│       └── routes.php       # Super Admin routes
└── Utils/
    ├── JwtHelper.php
    ├── ResponseHelper.php
    └── Validator.php
```

### Frontend
```
frontend/
├── index.html                      # Main entry point
├── super_admin_login.html          # Super Admin login
├── super_admin_login.js
├── super_admin_login.css
├── super_admin_dashboard.html      # Super Admin dashboard
├── super_admin_dashboard.js
├── super_admin_dashboard.css
├── super_admin_modules.html        # Module configuration
├── super_admin_modules.js
├── super_admin_modules.css
├── super_admin_reports.html        # Reports & Analytics
├── super_admin_reports.js
├── super_admin_reports.css
├── admin_dashboard.html            # Hospital Admin dashboard
├── admin_dashboard.js
├── admin_dashboard.css
├── doctor_portal.html              # Doctor portal
├── doctor_portal.js
├── doctor_portal.css
└── [other hospital-specific files]
```

### Public
```
public/
├── index.php                       # Application entry point
└── storage/
    └── uploads/                    # Hospital logos and files
```

### Database
```
database/
└── migrations/                     # Database migration files
```

### Storage
```
storage/
└── logs/
    └── rate_limit/                 # Rate limiting logs
```

## Key Features

### Super Admin Platform
1. **Hospital Management**
   - Create, edit, view, delete hospitals
   - Activate/deactivate hospitals
   - Upload hospital logos
   - Manage hospital subscriptions

2. **Subscription Management**
   - Create subscription plans
   - Assign plans to hospitals
   - Track subscription status
   - Calculate revenue

3. **Module Configuration**
   - Enable/disable modules per hospital
   - Bulk module updates
   - Module usage tracking

4. **Reports & Analytics**
   - Revenue reports
   - Usage statistics
   - Subscription statistics
   - Export to CSV

5. **Dashboard**
   - Real-time statistics
   - Revenue tracking
   - Hospital overview
   - Recent activities

### Authentication & Security
- JWT-based authentication
- Role-based access control (Super Admin)
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

### API Endpoints

#### Authentication
- `POST /api/platform/admin/login` - Super Admin login
- `POST /api/platform/admin/logout` - Logout

#### Hospitals
- `GET /api/platform/admin/hospitals` - List hospitals
- `POST /api/platform/admin/hospitals` - Create hospital
- `GET /api/platform/admin/hospitals/{id}` - Get hospital details
- `PUT /api/platform/admin/hospitals/{id}` - Update hospital
- `DELETE /api/platform/admin/hospitals/{id}` - Delete hospital
- `PATCH /api/platform/admin/hospitals/{id}/status` - Change status
- `POST /api/platform/admin/hospitals/{id}/logo` - Upload logo

#### Subscriptions
- `GET /api/platform/admin/plans` - List subscription plans
- `POST /api/platform/admin/plans` - Create plan
- `GET /api/platform/admin/subscriptions/active` - Active subscriptions
- `GET /api/platform/admin/subscriptions/statistics` - Statistics

#### Dashboard
- `GET /api/platform/admin/dashboard/statistics` - Dashboard stats
- `GET /api/platform/admin/dashboard/revenue-by-plan` - Revenue by plan
- `GET /api/platform/admin/dashboard/hospital-revenue` - Hospital revenue

#### Reports
- `GET /api/platform/admin/revenue/summary` - Revenue summary
- `GET /api/platform/admin/usage/summary` - Usage summary
- `GET /api/platform/admin/reports/revenue/export` - Export revenue CSV

#### Modules
- `GET /api/platform/admin/hospitals/{id}/modules` - List modules
- `POST /api/platform/admin/hospitals/{id}/modules/{code}/enable` - Enable
- `POST /api/platform/admin/hospitals/{id}/modules/{code}/disable` - Disable
- `PATCH /api/platform/admin/hospitals/{id}/modules` - Bulk update

## Database Tables

### Core Tables
- `hospitals` - Hospital information
- `hospital_subscriptions` - Subscription records
- `subscription_plans` - Available plans
- `modules` - Available modules
- `hospital_modules` - Module assignments
- `audit_logs` - Activity tracking

## Configuration

### Environment Variables (.env)
```
APP_ENV=development
APP_DEBUG=true
DB_HOST=localhost
DB_NAME=hms_dev
DB_USER=root
DB_PASS=
JWT_SECRET=your-secret-key
```

### Database Configuration
- Host: localhost
- Database: hms_dev
- User: root
- Password: (empty)

## Development

### Requirements
- PHP 7.4+
- MySQL 5.7+
- Apache/Nginx
- Composer

### Setup
1. Clone repository
2. Copy `.env.example` to `.env`
3. Configure database credentials
4. Run migrations
5. Start server

### Testing
- Super Admin: admin@platform.com / admin123
- Access: http://localhost/HMS/frontend/index.html

## Documentation

### Main Documentation
- `README.md` - Project overview and setup

### API Documentation
- All endpoints use JSON
- Authentication via JWT Bearer token
- Standard HTTP status codes
- Consistent error format

## Security Notes

1. **Authentication Required**
   - All API endpoints require JWT token
   - Super Admin role required for platform APIs

2. **Input Validation**
   - All inputs validated server-side
   - SQL injection prevention
   - XSS protection

3. **Rate Limiting**
   - Applied to sensitive endpoints
   - Prevents brute force attacks

4. **File Upload Security**
   - Only images allowed for logos
   - File size limits enforced
   - Secure file storage

## Maintenance

### Logs
- Application logs: `storage/logs/`
- Rate limit logs: `storage/logs/rate_limit/`
- Error logs: PHP error log

### Backups
- Regular database backups recommended
- Backup uploaded files in `public/storage/uploads/`

## Support

For issues or questions:
1. Check error logs
2. Verify database connection
3. Clear browser cache
4. Check API responses in browser console

## Version
Current Version: 1.0.0
Last Updated: February 2026
