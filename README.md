
# hms
=======
# Hospital Management System - Super Admin Backend

Core PHP backend for Super Admin platform management.

## Requirements

- PHP 8.1+
- MySQL 8.0+ or MariaDB 10.5+
- Composer
- Apache/Nginx with mod_rewrite

## Installation

### 1. Install Dependencies

```bash
composer install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database credentials
- JWT secret (generate with: `openssl rand -base64 32`)
- CORS origins
- Upload paths

### 3. Setup Database

```bash
mysql -u root -p < database/schema.sql
```

### 4. Create Super Admin Account

```sql
INSERT INTO platform_super_admins (email, name, password_hash, is_active)
VALUES (
    'admin@example.com',
    'Super Admin',
    '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzNW5kJ.lW', -- password: admin123
    1
);
```

### 5. Configure Web Server

#### Apache

Ensure `.htaccess` is enabled and `mod_rewrite` is active.

Document root should point to `/public` directory.

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/project/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 6. Set Permissions

```bash
chmod -R 755 storage
chmod -R 755 public/uploads
```

## API Endpoints

### Authentication
- `POST /api/platform/admin/login` - Login
- `POST /api/platform/admin/logout` - Logout (requires auth)

### Hospital Management
- `POST /api/platform/admin/hospitals` - Create hospital
- `GET /api/platform/admin/hospitals` - List hospitals
- `GET /api/platform/admin/hospitals/{id}` - Get hospital details
- `PUT /api/platform/admin/hospitals/{id}` - Update hospital
- `PATCH /api/platform/admin/hospitals/{id}/status` - Change status
- `POST /api/platform/admin/hospitals/{id}/subscriptions` - Extend subscription
- `DELETE /api/platform/admin/hospitals/{id}` - Soft delete hospital
- `POST /api/platform/admin/hospitals/{id}/logo` - Upload logo

### Module Configuration
- `GET /api/platform/admin/hospitals/{id}/modules` - List modules
- `POST /api/platform/admin/hospitals/{id}/modules/{code}/enable` - Enable module
- `POST /api/platform/admin/hospitals/{id}/modules/{code}/disable` - Disable module
- `PATCH /api/platform/admin/hospitals/{id}/modules` - Bulk update modules

### Dashboard & Reports
- `GET /api/platform/admin/dashboard` - Dashboard statistics
- `GET /api/platform/admin/reports/revenue` - Revenue report
- `GET /api/platform/admin/reports/renewals` - Subscription renewals
- `GET /api/platform/admin/reports/usage` - System usage statistics

## Security

- All endpoints (except login) require JWT authentication
- All endpoints require SUPER_ADMIN role
- Rate limiting enabled on write operations
- Input validation on all requests
- Audit logging for all actions
- Soft delete preserves data integrity

## Architecture

```
app/
├── Config/              # Configuration files
├── Core/                # Core infrastructure (Router, Request, Response)
├── Platform/
│   ├── Middleware/      # Authentication, Authorization, Rate Limiting
│   └── SuperAdmin/      # Super Admin module
│       ├── Controllers/ # HTTP request handlers
│       ├── Services/    # Business logic
│       ├── Repositories/# Database access
│       └── routes.php   # Route definitions
└── Utils/               # Helper utilities

public/
└── index.php            # Single entry point

routes/
└── api.php              # Route registration
```

## Testing

Health check endpoint:
```bash
curl http://localhost/api/health
```

Login:
```bash
curl -X POST http://localhost/api/platform/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## License

Proprietary - All rights reserved
>>>>>>> ad70454 (Initial commit)
