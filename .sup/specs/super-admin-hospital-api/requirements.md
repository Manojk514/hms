# MODULE 1: SUPER ADMIN - REST API DESIGN FOR HOSPITAL MANAGEMENT

## SPECIFICATION OVERVIEW

**Module:** Super Admin - Hospital Management APIs  
**Version:** 1.0  
**Date:** 2024-01-20  
**Status:** Design Phase

## PURPOSE

Design REST-style API endpoints for Super Admin to manage hospitals in a multi-tenant Hospital Management SaaS system. These APIs enable platform-level hospital lifecycle management, subscription control, and metadata management.

## SCOPE

### In Scope
- Hospital CRUD operations
- Hospital status management (PENDING, ACTIVE, INACTIVE, DELETED)
- Subscription management and renewal
- Hospital logo upload/update
- Pagination, filtering, and search
- Soft delete with data preservation

### Out of Scope
- Hospital-level operations (patients, appointments, billing)
- Hospital Admin user management
- Payment gateway integration
- Email notifications
- Hospital data export/import

## API NAMESPACE & BASE URL

**Base URL:** `/api/platform/admin`

**Namespace Convention:**
- All Super Admin endpoints: `/api/platform/admin/*`
- Hospital-level endpoints (future): `/api/hospital/*`
- Clear separation enforces authorization boundaries

## AUTHENTICATION & AUTHORIZATION

### All Endpoints Require:
- **Authentication:** Valid JWT token in `Authorization` header
- **Format:** `Authorization: Bearer <jwt_token>`
- **Role:** Token must contain `role: SUPER_ADMIN` claim
- **Active Account:** Super Admin account must have `is_active = 1`

### Authorization Middleware:
- `AuthenticationMiddleware`: Validates JWT token
- `SuperAdminAuthorizationMiddleware`: Verifies SUPER_ADMIN role
- Both middleware run before all endpoints

---

## API ENDPOINTS

### 1. CREATE HOSPITAL

**HTTP Method:** `POST`  
**URL Path:** `/api/platform/admin/hospitals`

**Purpose:** Create a new hospital account on the platform. Hospital starts in PENDING state.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Required Request Fields:**
```json
{
  "name": "string",           // 3-255 chars
  "email": "string",          // Valid email, unique
  "phone": "string",          // 10-20 chars
  "address_line1": "string",  // 5-255 chars
  "city": "string",           // 2-100 chars
  "state": "string",          // 2-100 chars
  "country": "string"         // 2-100 chars
}
```

**Optional Request Fields:**
```json
{
  "address_line2": "string",  // Max 255 chars
  "postal_code": "string",    // Max 20 chars
  "logo_url": "string",       // HTTPS URL, max 500 chars
  "website": "string"         // HTTP/HTTPS URL, max 255 chars
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Hospital created successfully",
  "data": {
    "id": 1,
    "hospital_code": "HSP-001",
    "name": "Apollo Hospitals",
    "email": "admin@apollo.com",
    "phone": "+91 9876543210",
    "address_line1": "Jubilee Hills",
    "address_line2": null,
    "city": "Hyderabad",
    "state": "Telangana",
    "postal_code": "500033",
    "country": "India",
    "status": "PENDING",
    "logo_url": null,
    "website": null,
    "created_at": "2024-01-15T10:30:00Z",
    "created_by": {
      "id": 1,
      "name": "Super Admin"
    }
  }
}
```

**Error Responses:**

*Validation Error (400):*
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "name": ["Hospital name is required"],
      "email": ["Invalid email format"]
    }
  }
}
```

*Duplicate Email (409):*
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "A hospital with this email already exists"
  }
}
```

**HTTP Status Codes:**
- `201 Created`: Success
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin
- `409 Conflict`: Email exists
- `500 Internal Server Error`: Server error

---

### 2. LIST HOSPITALS

**HTTP Method:** `GET`  
**URL Path:** `/api/platform/admin/hospitals`

**Purpose:** Retrieve paginated list of hospitals with filtering and search.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters (All Optional):**
- `page`: Page number (default: 1, min: 1)
- `per_page`: Items per page (default: 20, max: 100)
- `status`: Filter by status (PENDING, ACTIVE, INACTIVE, DELETED)
- `subscription_status`: Filter by subscription (ACTIVE, EXPIRED, TRIAL)
- `city`: Filter by city (exact match)
- `state`: Filter by state (exact match)
- `search`: Search in name, email, hospital_code
- `include_deleted`: Include deleted hospitals (true/false, default: false)
- `sort_by`: Sort field (created_at, name, status, city)
- `sort_order`: Sort direction (ASC, DESC, default: DESC)

**Example Request:**
```
GET /api/platform/admin/hospitals?page=1&per_page=20&status=ACTIVE&search=apollo
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hospitals": [
      {
        "id": 1,
        "hospital_code": "HSP-001",
        "name": "Apollo Hospitals",
        "email": "admin@apollo.com",
        "phone": "+91 9876543210",
        "city": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "status": "ACTIVE",
        "logo_url": "https://example.com/logo.png",
        "subscription": {
          "status": "ACTIVE",
          "plan_name": "Premium Plan",
          "end_date": "2024-12-31",
          "days_until_expiry": 180
        },
        "created_at": "2024-01-15T10:30:00Z",
        "activated_at": "2024-01-16T09:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_items": 45,
      "total_pages": 3,
      "has_next": true,
      "has_previous": false
    }
  }
}
```

**HTTP Status Codes:**
- `200 OK`: Success (even if empty)
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin
- `500 Internal Server Error`: Server error

---

### 3. VIEW HOSPITAL DETAILS

**HTTP Method:** `GET`  
**URL Path:** `/api/platform/admin/hospitals/{hospital_id}`

**Purpose:** Retrieve complete hospital details including subscription history and modules.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `hospital_id`: Hospital ID (required, positive integer)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "hospital": {
      "id": 1,
      "hospital_code": "HSP-001",
      "name": "Apollo Hospitals",
      "email": "admin@apollo.com",
      "phone": "+91 9876543210",
      "address_line1": "Jubilee Hills",
      "city": "Hyderabad",
      "state": "Telangana",
      "country": "India",
      "status": "ACTIVE",
      "created_at": "2024-01-15T10:30:00Z",
      "activated_at": "2024-01-16T09:00:00Z"
    },
    "current_subscription": {
      "id": 5,
      "plan_name": "Premium Plan",
      "subscription_status": "ACTIVE",
      "start_date": "2024-01-16",
      "end_date": "2024-12-31",
      "days_until_expiry": 180,
      "monthly_price": 50000.00,
      "billing_cycle": "ANNUAL"
    },
    "subscription_history": [],
    "enabled_modules": [
      {
        "module_code": "OP",
        "module_name": "Outpatient Management",
        "is_enabled": true
      }
    ],
    "recent_activity": []
  }
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid ID
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin
- `404 Not Found`: Hospital not found
- `500 Internal Server Error`: Server error

---

### 4. UPDATE HOSPITAL DETAILS

**HTTP Method:** `PUT` or `PATCH`  
**URL Path:** `/api/platform/admin/hospitals/{hospital_id}`

**Purpose:** Update hospital metadata (not status or subscription).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters:**
- `hospital_id`: Hospital ID (required)

**Optional Request Fields (at least one required):**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "address_line1": "string",
  "address_line2": "string",
  "city": "string",
  "state": "string",
  "postal_code": "string",
  "country": "string",
  "logo_url": "string",
  "website": "string"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Hospital updated successfully",
  "data": {
    "id": 1,
    "hospital_code": "HSP-001",
    "name": "Apollo Hospitals Updated",
    "updated_at": "2024-01-20T14:30:00Z"
  }
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin or hospital deleted
- `404 Not Found`: Hospital not found
- `409 Conflict`: Email exists
- `500 Internal Server Error`: Server error

---

### 5. CHANGE HOSPITAL STATUS

**HTTP Method:** `PATCH`  
**URL Path:** `/api/platform/admin/hospitals/{hospital_id}/status`

**Purpose:** Change hospital status (ACTIVE/INACTIVE).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Required Request Fields:**
```json
{
  "status": "string"  // "ACTIVE" or "INACTIVE"
}
```

**Optional Request Fields:**
```json
{
  "reason": "string"  // Required for INACTIVE (10-500 chars)
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Hospital activated successfully",
  "data": {
    "id": 1,
    "hospital_code": "HSP-001",
    "status": "ACTIVE",
    "previous_status": "PENDING",
    "activated_at": "2024-01-20T15:00:00Z"
  }
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin or hospital deleted
- `404 Not Found`: Hospital not found
- `422 Unprocessable Entity`: Business rule violations
- `500 Internal Server Error`: Server error

---

### 6. EXTEND SUBSCRIPTION

**HTTP Method:** `POST`  
**URL Path:** `/api/platform/admin/hospitals/{hospital_id}/subscriptions`

**Purpose:** Create new subscription or renew existing subscription.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Required Request Fields:**
```json
{
  "plan_id": "integer",
  "start_date": "string",     // YYYY-MM-DD
  "billing_cycle": "string"   // "MONTHLY" or "ANNUAL"
}
```

**Optional Request Fields:**
```json
{
  "payment_status": "string",     // PENDING, PAID, FAILED
  "payment_reference": "string",
  "auto_renew": "boolean"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "id": 10,
      "hospital_id": 1,
      "plan_name": "Premium Plan",
      "start_date": "2024-02-01",
      "end_date": "2025-02-01",
      "subscription_status": "ACTIVE",
      "monthly_price": 50000.00
    },
    "enabled_modules": ["OP", "LAB", "PHARMACY", "BILLING"]
  }
}
```

**HTTP Status Codes:**
- `201 Created`: Success
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin or hospital deleted
- `404 Not Found`: Hospital or plan not found
- `422 Unprocessable Entity`: Business rule violations
- `500 Internal Server Error`: Server error

---

### 7. SOFT DELETE HOSPITAL

**HTTP Method:** `DELETE`  
**URL Path:** `/api/platform/admin/hospitals/{hospital_id}`

**Purpose:** Soft delete hospital (preserve data, make inaccessible).

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Required Request Fields:**
```json
{
  "reason": "string",      // 10-1000 chars
  "confirm": true          // Must be true
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Hospital deleted successfully",
  "data": {
    "id": 1,
    "hospital_code": "HSP-001",
    "name": "Apollo Hospitals",
    "status": "DELETED",
    "deleted_at": "2024-01-20T16:00:00Z",
    "deleted_by": {
      "id": 1,
      "name": "Super Admin"
    }
  }
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin
- `404 Not Found`: Hospital not found
- `422 Unprocessable Entity`: Already deleted
- `500 Internal Server Error`: Server error

---

### 8. UPLOAD/UPDATE HOSPITAL LOGO

**HTTP Method:** `POST`  
**URL Path:** `/api/platform/admin/hospitals/{hospital_id}/logo`

**Purpose:** Upload or update hospital logo image.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Required Request Fields:**
```
logo: file  // Image file (JPEG, PNG, max 2MB)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "hospital_id": 1,
    "logo_url": "https://cdn.example.com/hospitals/HSP-001/logo.png",
    "uploaded_at": "2024-01-20T17:00:00Z"
  }
}
```

**Error Responses:**

*Invalid File Type (400):*
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only JPEG and PNG images are allowed"
  }
}
```

*File Too Large (413):*
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 2MB limit"
  }
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid file type
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin or hospital deleted
- `404 Not Found`: Hospital not found
- `413 Payload Too Large`: File too large
- `500 Internal Server Error`: Server error

---

## COMMON ERROR RESPONSE FORMAT

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}  // Optional additional details
  }
}
```

## COMMON HTTP STATUS CODES

- `200 OK`: Request successful
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: Authorization failed
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `413 Payload Too Large`: File too large
- `422 Unprocessable Entity`: Business rule violation
- `500 Internal Server Error`: Server error

## VALIDATION RULES

### Hospital Name
- Required
- 3-255 characters
- Cannot be only whitespace

### Email
- Required
- Valid RFC 5322 format
- Unique across all hospitals
- Max 255 characters

### Phone
- Required
- 10-20 characters
- Valid phone format

### Hospital Code
- Auto-generated
- Format: HSP-{number}
- Immutable
- Unique

### Dates
- Format: YYYY-MM-DD
- Valid date range

### URLs
- Valid URL format
- HTTPS required for logo_url
- Max 500 characters

## BUSINESS RULES

### Hospital Creation
- Status starts as PENDING
- Hospital code is auto-generated
- No subscription created initially
- No modules enabled initially

### Hospital Activation
- Requires valid subscription
- Requires at least one enabled module
- Sets activated_at timestamp

### Hospital Deactivation
- Requires reason
- Logs out all users
- Preserves all data

### Subscription
- Price locked at creation
- End date calculated from billing cycle
- Modules auto-enabled from plan

### Soft Delete
- Sets status to DELETED
- Preserves all data
- Cancels active subscription
- Disables all modules
- Logs out all users

## SECURITY CONSIDERATIONS

### Authentication
- JWT tokens required
- Tokens include role claims
- Tokens have expiration
- Tokens validated on every request

### Authorization
- Super Admin role required
- Role verified by middleware
- Backend enforces all rules
- UI cannot bypass authorization

### Data Protection
- Passwords never logged
- Sensitive data sanitized in logs
- Audit trail for all actions
- Soft delete preserves data

### Rate Limiting
- Requests limited per user
- Prevents abuse
- Configurable limits

## AUDIT LOGGING

All Super Admin actions are logged with:
- Super Admin ID
- Action type
- Entity type and ID
- Timestamp
- IP address
- Request/response details
- Success/failure status

## NEXT STEPS

1. Implement backend architecture
2. Create database schema
3. Develop API endpoints
4. Write unit tests
5. Write integration tests
6. API documentation
7. Frontend integration

---

**End of Specification**
