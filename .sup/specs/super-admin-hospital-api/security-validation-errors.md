# MODULE 1: SUPER ADMIN - SECURITY, VALIDATION, AND ERROR HANDLING

## SPECIFICATION OVERVIEW

**Feature:** Security, Validation, and Error Handling Rules  
**Version:** 1.0  
**Date:** 2024-01-20  
**Status:** Design Phase

## PURPOSE

Define comprehensive security, validation, and error handling rules for the Super Admin module to ensure secure, reliable, and predictable API behavior.

---

# PART A: SECURITY

## 1. SUPER ADMIN AUTHENTICATION

### **Authentication Mechanism**
- **JWT (JSON Web Token) based authentication**
- Tokens issued upon successful login
- Tokens contain encrypted user claims
- Tokens are stateless (no server-side session storage)

### **Login Process**

#### **Step 1: Credentials Validation**
- Super Admin provides email and password
- Email must exist in `platform_super_admins` table
- Password is hashed using bcrypt (cost factor: 12)
- Password hash is compared with stored hash
- Failed login attempts are logged

#### **Step 2: Account Status Check**
- Super Admin account must have `is_active = 1`
- Inactive accounts cannot log in
- Error message: "Account is suspended"

#### **Step 3: Token Generation**
- JWT token is generated with following claims:
  - `user_id`: Super Admin ID
  - `email`: Super Admin email
  - `role`: "SUPER_ADMIN"
  - `iat`: Issued at timestamp
  - `exp`: Expiration timestamp
- Token is signed with secret key (stored in environment variable)
- Token expiration: 8 hours (configurable)


#### **Step 4: Token Response**
- Token is returned to client
- Client stores token (localStorage or secure cookie)
- Client includes token in `Authorization` header for all requests
- Format: `Authorization: Bearer <token>`

#### **Step 5: Last Login Update**
- `last_login_at` timestamp is updated in `platform_super_admins` table
- Login action is logged in `platform_audit_logs`

### **Authentication Security Rules**

#### **Password Requirements**
- Minimum length: 8 characters
- Must contain: uppercase, lowercase, number, special character
- Cannot be common passwords (dictionary check)
- Cannot be same as email
- Password history: Cannot reuse last 3 passwords

#### **Failed Login Handling**
- Failed attempts are logged with IP address
- After 5 failed attempts: Account is temporarily locked (15 minutes)
- After 10 failed attempts: Account is permanently locked (requires Super Admin unlock)
- Lockout is logged in audit trail

#### **Token Security**
- Tokens are signed with HS256 algorithm
- Secret key is stored in environment variable (never in code)
- Secret key is rotated every 90 days
- Tokens cannot be modified without invalidating signature

#### **Multi-Factor Authentication (MFA)**
- MFA is mandatory for Super Admin accounts
- Supported methods: TOTP (Time-based One-Time Password)
- MFA code required after password validation
- MFA code expires after 30 seconds
- Failed MFA attempts are logged


## 2. AUTHORIZATION FOR EVERY SUPER ADMIN API

### **Authorization Middleware Pipeline**

#### **Middleware 1: Authentication Middleware**
- **Purpose:** Validate JWT token presence and validity
- **Execution Order:** First middleware (runs before all others)
- **Checks:**
  - `Authorization` header is present
  - Header format is `Bearer <token>`
  - Token is not empty
  - Token signature is valid
  - Token has not expired
  - Token claims are present and valid
- **On Success:** Extract user claims and attach to request object
- **On Failure:** Return 401 Unauthorized

#### **Middleware 2: Super Admin Authorization Middleware**
- **Purpose:** Verify user has SUPER_ADMIN role
- **Execution Order:** Second middleware (after authentication)
- **Checks:**
  - User role claim is "SUPER_ADMIN"
  - Super Admin account is active (`is_active = 1`)
  - Super Admin account exists in database
- **On Success:** Allow request to proceed to controller
- **On Failure:** Return 403 Forbidden

#### **Middleware 3: Rate Limiting Middleware**
- **Purpose:** Prevent abuse and DoS attacks
- **Execution Order:** Third middleware
- **Limits:**
  - 100 requests per minute per Super Admin
  - 1000 requests per hour per Super Admin
  - Configurable per endpoint
- **On Limit Exceeded:** Return 429 Too Many Requests

### **Authorization Rules by Endpoint**

#### **All Super Admin Endpoints**
- **Namespace:** `/api/platform/admin/*`
- **Required:** Valid JWT token with SUPER_ADMIN role
- **Forbidden:** Hospital Admin, Doctor, Staff, Patient roles
- **Enforcement:** Backend middleware (UI cannot bypass)


#### **Hospital-Level Endpoints (Future)**
- **Namespace:** `/api/hospital/*`
- **Required:** Valid JWT token with hospital-level role
- **Forbidden:** SUPER_ADMIN role (separation of concerns)
- **Enforcement:** Backend middleware

### **Token Validation Rules**

#### **On Every Request**
- Token is extracted from `Authorization` header
- Token signature is verified using secret key
- Token expiration is checked (`exp` claim)
- Token claims are validated (user_id, role)
- User account status is checked (is_active)

#### **Token Expiration Handling**
- Expired tokens return 401 Unauthorized
- Error message: "Token has expired. Please log in again."
- Client must obtain new token by logging in again
- No automatic token refresh (security best practice)

#### **Token Revocation**
- Tokens cannot be revoked (stateless design)
- To "revoke" a token: Set `is_active = 0` for Super Admin account
- Inactive accounts fail authorization check
- Token becomes invalid on next request

## 3. PROTECTION AGAINST UNAUTHORIZED ACCESS

### **Endpoint Protection**

#### **URL-Based Protection**
- All Super Admin endpoints start with `/api/platform/admin/*`
- Middleware checks URL pattern before allowing access
- Non-Super Admin users cannot access these endpoints
- Returns 403 Forbidden if role mismatch

#### **Resource-Level Protection**
- Super Admin can only access platform-level resources
- Super Admin cannot access hospital operational data
- Super Admin cannot access patient, doctor, staff data
- Attempting to access forbidden resources returns 403 Forbidden


### **Database-Level Protection**

#### **Query Filtering**
- All queries include role-based filters
- Super Admin queries cannot join with patient/clinical tables
- Database permissions restrict access to hospital operational tables
- Prepared statements prevent SQL injection

#### **Data Isolation**
- Super Admin can only query platform-level tables:
  - `platform_super_admins`
  - `hospitals`
  - `hospital_subscriptions`
  - `subscription_plans`
  - `hospital_modules`
  - `platform_audit_logs`
  - `platform_activity_summary`
- Super Admin cannot query hospital-level tables:
  - `patients`
  - `appointments`
  - `lab_tests`
  - `prescriptions`
  - `billing_transactions`

### **IP Whitelisting (Optional)**
- Super Admin access can be restricted to specific IP addresses
- Configurable per Super Admin account
- Requests from non-whitelisted IPs are rejected
- Returns 403 Forbidden with message "Access denied from this IP"

### **CORS (Cross-Origin Resource Sharing)**
- CORS headers are configured to allow only trusted origins
- Allowed origins: Platform admin UI domain
- Credentials are allowed (cookies, authorization headers)
- Preflight requests are handled correctly

## 4. PREVENTION OF PRIVILEGE ESCALATION

### **Role Immutability**
- Super Admin role is assigned at account creation
- Role cannot be changed via API
- Role can only be changed via direct database access (manual process)
- Role changes are logged in audit trail


### **Self-Service Restrictions**
- Super Admin cannot create other Super Admin accounts via API
- Super Admin cannot modify their own role
- Super Admin cannot deactivate their own account
- Super Admin cannot delete their own account
- These actions require another Super Admin or system administrator

### **Token Claim Integrity**
- Token claims are signed and cannot be modified
- Attempting to modify token invalidates signature
- Modified tokens are rejected with 401 Unauthorized
- Token tampering attempts are logged

### **Horizontal Privilege Escalation Prevention**
- Super Admin can only access their own profile
- Super Admin cannot impersonate other Super Admins
- Super Admin cannot access other Super Admins' sessions
- All actions are logged with Super Admin ID

### **Vertical Privilege Escalation Prevention**
- Super Admin cannot access hospital-level resources
- Super Admin cannot perform hospital-internal actions
- Super Admin cannot access patient data
- Attempting to access forbidden resources returns 403 Forbidden

## 5. SECURE HANDLING OF SESSION OR TOKEN EXPIRY

### **Token Expiration Rules**
- Default token expiration: 8 hours
- Configurable per environment (dev: 24h, prod: 8h)
- Expiration is enforced on every request
- No grace period after expiration

### **Expiry Handling Process**

#### **On Token Expiry**
- Middleware detects expired token (`exp` claim < current time)
- Request is rejected with 401 Unauthorized
- Error response includes: "Token has expired"
- Client must redirect user to login page


#### **Client-Side Handling**
- Client checks token expiration before making requests (optional)
- Client can decode JWT to read `exp` claim (not for security, for UX)
- Client shows "Session expired" message
- Client redirects to login page
- Client clears stored token

#### **No Automatic Refresh**
- Tokens are NOT automatically refreshed
- Refresh tokens are NOT used (security best practice)
- User must log in again to get new token
- Rationale: Reduces attack surface, enforces re-authentication

### **Inactivity Timeout**
- In addition to token expiration, inactivity timeout can be configured
- If no requests for 30 minutes, next request requires re-authentication
- Implemented via token expiration time
- User is warned before timeout (client-side)

### **Concurrent Session Handling**
- Multiple sessions are allowed (same Super Admin, different devices)
- Each session has its own token
- Logging out from one device does not affect other devices
- All sessions can be terminated by deactivating account

---

# PART B: INPUT VALIDATION

## 1. HOSPITAL CREATION & UPDATE VALIDATION

### **Hospital Name**
- **Required:** Yes (for creation), Optional (for update)
- **Type:** String
- **Min Length:** 3 characters
- **Max Length:** 255 characters
- **Format:** Alphanumeric, spaces, hyphens, apostrophes allowed
- **Validation:** Cannot be only whitespace, trimmed before saving
- **Error Message:** "Hospital name must be between 3 and 255 characters"


### **Email**
- **Required:** Yes (for creation), Optional (for update)
- **Type:** String
- **Max Length:** 255 characters
- **Format:** Valid RFC 5322 email format
- **Validation:** 
  - Must contain @ symbol
  - Must have valid domain
  - Converted to lowercase before saving
  - Must be unique across all hospitals (including deleted)
- **Error Messages:**
  - "Invalid email format"
  - "Email already exists"

### **Phone**
- **Required:** Yes (for creation), Optional (for update)
- **Type:** String
- **Min Length:** 10 characters
- **Max Length:** 20 characters
- **Format:** Digits, spaces, hyphens, parentheses, plus sign allowed
- **Validation:** Must contain at least 10 digits
- **Error Message:** "Phone must be between 10 and 20 characters"

### **Address Line 1**
- **Required:** Yes (for creation), Optional (for update)
- **Type:** String
- **Min Length:** 5 characters
- **Max Length:** 255 characters
- **Format:** Any printable characters
- **Validation:** Cannot be only whitespace
- **Error Message:** "Address line 1 must be between 5 and 255 characters"

### **Address Line 2**
- **Required:** No
- **Type:** String or NULL
- **Max Length:** 255 characters
- **Format:** Any printable characters
- **Validation:** Can be empty or NULL

### **City**
- **Required:** Yes (for creation), Optional (for update)
- **Type:** String
- **Min Length:** 2 characters
- **Max Length:** 100 characters
- **Format:** Alphabetic characters, spaces, hyphens allowed
- **Validation:** Cannot contain only numbers
- **Error Message:** "City must be between 2 and 100 characters"


### **State**
- **Required:** Yes (for creation), Optional (for update)
- **Type:** String
- **Min Length:** 2 characters
- **Max Length:** 100 characters
- **Format:** Alphabetic characters, spaces, hyphens allowed
- **Error Message:** "State must be between 2 and 100 characters"

### **Country**
- **Required:** Yes (for creation), Optional (for update)
- **Type:** String
- **Min Length:** 2 characters
- **Max Length:** 100 characters
- **Format:** Alphabetic characters, spaces, hyphens allowed
- **Default:** "India"
- **Error Message:** "Country must be between 2 and 100 characters"

### **Postal Code**
- **Required:** No
- **Type:** String or NULL
- **Max Length:** 20 characters
- **Format:** Alphanumeric, spaces, hyphens allowed
- **Validation:** Can be empty or NULL

### **Logo URL**
- **Required:** No
- **Type:** String (URL) or NULL
- **Max Length:** 500 characters
- **Format:** Valid URL format
- **Protocol:** Must use HTTPS (not HTTP)
- **Validation:** URL format validation
- **Error Messages:**
  - "Invalid URL format"
  - "Logo URL must use HTTPS protocol"

### **Website**
- **Required:** No
- **Type:** String (URL) or NULL
- **Max Length:** 255 characters
- **Format:** Valid URL format
- **Protocol:** HTTP or HTTPS allowed
- **Validation:** URL format validation
- **Error Message:** "Invalid URL format"


### **Update-Specific Validation**
- At least one field must be provided for update
- Cannot update immutable fields (hospital_code, created_at, created_by)
- Cannot update soft-deleted hospitals
- Email uniqueness check excludes current hospital

## 2. SUBSCRIPTION CHANGES VALIDATION

### **Plan ID**
- **Required:** Yes
- **Type:** Integer
- **Validation:**
  - Must be positive integer
  - Must exist in `subscription_plans` table
  - Plan must be active (`is_active = 1`)
- **Error Messages:**
  - "Plan ID is required"
  - "Plan does not exist"
  - "Plan is not active"

### **Start Date**
- **Required:** Yes
- **Type:** Date (YYYY-MM-DD)
- **Validation:**
  - Must be valid date format
  - Cannot be more than 1 year in the past
  - Cannot be more than 1 year in the future
  - Must be <= end_date (calculated)
- **Error Messages:**
  - "Invalid date format. Use YYYY-MM-DD"
  - "Start date cannot be more than 1 year in the past"
  - "Start date cannot be more than 1 year in the future"

### **Billing Cycle**
- **Required:** Yes
- **Type:** Enum (MONTHLY, ANNUAL)
- **Validation:** Must be one of allowed values
- **Default:** MONTHLY
- **Error Message:** "Billing cycle must be MONTHLY or ANNUAL"

### **Payment Status**
- **Required:** No
- **Type:** Enum (PENDING, PAID, FAILED)
- **Validation:** Must be one of allowed values
- **Default:** PENDING
- **Error Message:** "Payment status must be PENDING, PAID, or FAILED"


### **Payment Reference**
- **Required:** Yes (if payment_status = PAID), No (otherwise)
- **Type:** String
- **Max Length:** 255 characters
- **Validation:** Required when payment_status is PAID
- **Error Message:** "Payment reference is required when payment status is PAID"

### **Auto Renew**
- **Required:** No
- **Type:** Boolean
- **Validation:** Must be true or false
- **Default:** false

### **Business Validation**
- Hospital must exist and not be soft-deleted
- If hospital has active subscription, new subscription start date must be >= current end date
- End date is calculated automatically (start_date + billing_cycle)

## 3. MODULE ENABLE / DISABLE VALIDATION

### **Module Code**
- **Required:** Yes
- **Type:** String (Enum)
- **Allowed Values:** OP, LAB, PHARMACY, BILLING, IPD, EMERGENCY
- **Validation:**
  - Must be one of allowed values
  - Case-insensitive (converted to uppercase)
- **Error Message:** "Invalid module code. Must be one of: OP, LAB, PHARMACY, BILLING, IPD, EMERGENCY"

### **Reason (for disable)**
- **Required:** Yes (for disable), No (for enable)
- **Type:** String
- **Min Length:** 10 characters
- **Max Length:** 500 characters
- **Validation:** Cannot be only whitespace
- **Error Message:** "Reason must be between 10 and 500 characters"

### **Notes (for enable)**
- **Required:** No
- **Type:** String or NULL
- **Max Length:** 1000 characters
- **Validation:** Can be empty or NULL


### **Business Validation**
- Hospital must exist and not be soft-deleted
- For disable: Cannot disable last module of ACTIVE hospital
- For enable: Module can be enabled regardless of hospital status

### **Bulk Module Update Validation**
- **Modules Array:** Required, must contain at least one module
- **Each Module:**
  - `module_code`: Required, valid module code
  - `is_enabled`: Required, boolean
- **Reason:** Required if any module is being disabled
- **Business Validation:** Cannot disable all modules for ACTIVE hospital

## 4. FILE UPLOADS (HOSPITAL LOGO) VALIDATION

### **File Presence**
- **Required:** Yes
- **Validation:** File must be present in request
- **Error Message:** "Logo file is required"

### **File Type**
- **Allowed Types:** JPEG, PNG
- **MIME Types:** image/jpeg, image/png
- **Validation:** Check MIME type and file extension
- **Error Message:** "Only JPEG and PNG images are allowed"

### **File Size**
- **Max Size:** 2 MB (2,097,152 bytes)
- **Validation:** Check file size before processing
- **Error Message:** "File size exceeds 2MB limit"

### **File Name**
- **Sanitization:** Remove special characters, spaces
- **Format:** `{hospital_code}_logo_{timestamp}.{extension}`
- **Example:** `HSP-001_logo_1705756800.png`

### **Image Validation**
- **Dimensions:** Recommended 500x500 pixels (not enforced)
- **Aspect Ratio:** Square preferred (not enforced)
- **Validation:** Verify file is actually an image (not just extension)
- **Error Message:** "Invalid image file"


### **Upload Security**
- Files are scanned for malware (if antivirus available)
- Files are stored outside web root
- Files are served via CDN or secure URL
- Original filename is not used (prevents path traversal)

### **Storage Path**
- **Pattern:** `/uploads/hospitals/{hospital_code}/logo.{extension}`
- **Example:** `/uploads/hospitals/HSP-001/logo.png`
- **Permissions:** Read-only for web server

## 5. QUERY PARAMETERS VALIDATION

### **Pagination Parameters**

#### **Page**
- **Type:** Integer
- **Min Value:** 1
- **Default:** 1
- **Validation:** Must be positive integer
- **Error Message:** "Page must be a positive integer"

#### **Per Page**
- **Type:** Integer
- **Min Value:** 1
- **Max Value:** 100
- **Default:** 20
- **Validation:** Must be between 1 and 100
- **Error Message:** "Per page must be between 1 and 100"

### **Filter Parameters**

#### **Status**
- **Type:** Enum
- **Allowed Values:** PENDING, ACTIVE, INACTIVE, DELETED
- **Validation:** Must be one of allowed values, case-insensitive
- **Error Message:** "Invalid status value"

#### **Subscription Status**
- **Type:** Enum
- **Allowed Values:** ACTIVE, EXPIRED, TRIAL, CANCELLED
- **Validation:** Must be one of allowed values, case-insensitive
- **Error Message:** "Invalid subscription status value"


#### **City / State**
- **Type:** String
- **Max Length:** 100 characters
- **Validation:** Alphanumeric, spaces, hyphens allowed
- **Error Message:** "Invalid city/state format"

#### **Date Range**
- **date_from / date_to:** Date (YYYY-MM-DD)
- **Validation:**
  - Must be valid date format
  - date_from must be <= date_to
  - Cannot be more than 5 years in the past
- **Error Messages:**
  - "Invalid date format. Use YYYY-MM-DD"
  - "Start date must be before or equal to end date"

### **Search Parameters**

#### **Search Term**
- **Type:** String
- **Max Length:** 255 characters
- **Validation:** Trimmed, special characters escaped
- **SQL Injection Prevention:** Prepared statements used
- **Error Message:** "Search term too long (max 255 characters)"

### **Sort Parameters**

#### **Sort By**
- **Type:** Enum
- **Allowed Values:** Depends on endpoint (e.g., created_at, name, status, city)
- **Default:** created_at
- **Validation:** Must be one of allowed values
- **Error Message:** "Invalid sort field"

#### **Sort Order**
- **Type:** Enum
- **Allowed Values:** ASC, DESC
- **Default:** DESC
- **Validation:** Must be ASC or DESC, case-insensitive
- **Error Message:** "Sort order must be ASC or DESC"

### **Boolean Parameters**

#### **Include Deleted / Auto Renew**
- **Type:** Boolean
- **Allowed Values:** true, false, 1, 0, yes, no
- **Default:** false
- **Validation:** Converted to boolean
- **Error Message:** "Must be a boolean value"

---


# PART C: ERROR HANDLING

## 1. STANDARD ERROR RESPONSE STRUCTURE

### **Error Response Format**
All error responses follow this consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### **Error Response Fields**

#### **success**
- **Type:** Boolean
- **Value:** Always `false` for errors
- **Purpose:** Quick check for success/failure

#### **error.code**
- **Type:** String (UPPERCASE_SNAKE_CASE)
- **Purpose:** Machine-readable error identifier
- **Examples:** VALIDATION_ERROR, UNAUTHORIZED, HOSPITAL_NOT_FOUND
- **Usage:** Client can handle specific errors programmatically

#### **error.message**
- **Type:** String
- **Purpose:** Human-readable error description
- **Language:** English (internationalization future feature)
- **Tone:** Professional, helpful, non-technical
- **Examples:**
  - "Invalid email format"
  - "Hospital with ID 999 does not exist"
  - "Token has expired. Please log in again."

#### **error.details**
- **Type:** Object (optional)
- **Purpose:** Additional context about the error
- **Usage:** Validation errors, field-specific errors
- **Example:**
```json
{
  "details": {
    "name": ["Hospital name is required"],
    "email": ["Invalid email format", "Email already exists"]
  }
}
```


## 2. HTTP STATUS CODE USAGE

### **2xx Success Codes**

#### **200 OK**
- **Usage:** Successful GET, PUT, PATCH, DELETE requests
- **Response:** Includes requested data or confirmation
- **Example:** Hospital details retrieved, hospital updated

#### **201 Created**
- **Usage:** Successful POST requests that create resources
- **Response:** Includes created resource with ID
- **Example:** Hospital created, subscription created

### **4xx Client Error Codes**

#### **400 Bad Request**
- **Usage:** Invalid input data, validation errors
- **Error Codes:**
  - VALIDATION_ERROR
  - INVALID_INPUT
  - MISSING_REQUIRED_FIELD
  - INVALID_FORMAT
- **Examples:**
  - Invalid email format
  - Missing required field
  - Invalid date format
  - Invalid enum value

#### **401 Unauthorized**
- **Usage:** Authentication failures
- **Error Codes:**
  - UNAUTHORIZED
  - INVALID_TOKEN
  - TOKEN_EXPIRED
  - MISSING_TOKEN
- **Examples:**
  - Missing Authorization header
  - Invalid JWT token
  - Expired token
  - Invalid credentials

#### **403 Forbidden**
- **Usage:** Authorization failures, insufficient permissions
- **Error Codes:**
  - FORBIDDEN
  - INSUFFICIENT_PERMISSIONS
  - HOSPITAL_DELETED
  - ACCOUNT_SUSPENDED
- **Examples:**
  - Not a Super Admin
  - Attempting to access deleted hospital
  - Account is inactive
  - IP not whitelisted

#### **404 Not Found**
- **Usage:** Requested resource does not exist
- **Error Codes:**
  - HOSPITAL_NOT_FOUND
  - SUBSCRIPTION_NOT_FOUND
  - PLAN_NOT_FOUND
  - RESOURCE_NOT_FOUND
- **Examples:**
  - Hospital with ID 999 does not exist
  - Subscription plan not found
  - Logo file not found

#### **409 Conflict**
- **Usage:** Request conflicts with current state
- **Error Codes:**
  - DUPLICATE_EMAIL
  - DUPLICATE_HOSPITAL_CODE
  - INVALID_STATE_TRANSITION
  - CANNOT_DISABLE_ALL_MODULES
- **Examples:**
  - Email already exists
  - Cannot transition from INACTIVE to PENDING
  - Cannot disable all modules for ACTIVE hospital
  - Active subscription already exists

#### **413 Payload Too Large**
- **Usage:** Request body or file exceeds size limits
- **Error Codes:**
  - FILE_TOO_LARGE
  - PAYLOAD_TOO_LARGE
- **Examples:**
  - Logo file exceeds 2MB limit
  - Request body exceeds 10MB limit

#### **422 Unprocessable Entity**
- **Usage:** Request is well-formed but semantically incorrect
- **Error Codes:**
  - BUSINESS_RULE_VIOLATION
  - INVALID_OPERATION
  - SUBSCRIPTION_EXPIRED
- **Examples:**
  - Cannot activate hospital without subscription
  - Cannot extend expired subscription by more than 30 days
  - Cannot disable module for DELETED hospital

#### **429 Too Many Requests**
- **Usage:** Rate limit exceeded
- **Error Codes:**
  - RATE_LIMIT_EXCEEDED
- **Response Headers:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Timestamp when limit resets
- **Example:**
  - "Rate limit exceeded. Try again in 60 seconds."

### **5xx Server Error Codes**

#### **500 Internal Server Error**
- **Usage:** Unexpected server errors
- **Error Codes:**
  - INTERNAL_SERVER_ERROR
  - DATABASE_ERROR
  - UNEXPECTED_ERROR
- **Examples:**
  - Database connection failed
  - Unhandled exception
  - File system error
- **Important:** Never expose internal details (stack traces, SQL queries, file paths)

## 3. ERROR HANDLING BY SCENARIO

### **Invalid Input Errors**

#### **Scenario:** Missing required field
- **HTTP Status:** 400 Bad Request
- **Error Code:** MISSING_REQUIRED_FIELD
- **Message:** "{field_name} is required"
- **Details:** Field name and requirement

#### **Scenario:** Invalid format
- **HTTP Status:** 400 Bad Request
- **Error Code:** INVALID_FORMAT
- **Message:** "Invalid {field_name} format"
- **Details:** Expected format, provided value (sanitized)

#### **Scenario:** Value out of range
- **HTTP Status:** 400 Bad Request
- **Error Code:** VALIDATION_ERROR
- **Message:** "{field_name} must be between {min} and {max}"
- **Details:** Min, max, provided value

#### **Scenario:** Multiple validation errors
- **HTTP Status:** 400 Bad Request
- **Error Code:** VALIDATION_ERROR
- **Message:** "Validation failed"
- **Details:** Object with field names as keys, error arrays as values

### **Authentication Errors**

#### **Scenario:** Missing Authorization header
- **HTTP Status:** 401 Unauthorized
- **Error Code:** MISSING_TOKEN
- **Message:** "Authorization token is required"
- **Details:** None

#### **Scenario:** Invalid token format
- **HTTP Status:** 401 Unauthorized
- **Error Code:** INVALID_TOKEN
- **Message:** "Invalid authorization token format"
- **Details:** None (never expose token details)

#### **Scenario:** Expired token
- **HTTP Status:** 401 Unauthorized
- **Error Code:** TOKEN_EXPIRED
- **Message:** "Token has expired. Please log in again."
- **Details:** None

#### **Scenario:** Invalid credentials
- **HTTP Status:** 401 Unauthorized
- **Error Code:** INVALID_CREDENTIALS
- **Message:** "Invalid email or password"
- **Details:** None (never specify which field is wrong)

#### **Scenario:** Account locked
- **HTTP Status:** 401 Unauthorized
- **Error Code:** ACCOUNT_LOCKED
- **Message:** "Account is temporarily locked due to multiple failed login attempts"
- **Details:** Unlock time (if temporary)

### **Authorization Errors**

#### **Scenario:** Not a Super Admin
- **HTTP Status:** 403 Forbidden
- **Error Code:** INSUFFICIENT_PERMISSIONS
- **Message:** "You do not have permission to access this resource"
- **Details:** None (never expose role information)

#### **Scenario:** Account suspended
- **HTTP Status:** 403 Forbidden
- **Error Code:** ACCOUNT_SUSPENDED
- **Message:** "Your account has been suspended. Contact support."
- **Details:** None

#### **Scenario:** IP not whitelisted
- **HTTP Status:** 403 Forbidden
- **Error Code:** FORBIDDEN
- **Message:** "Access denied from this IP address"
- **Details:** None (never expose IP whitelist)

### **Resource Not Found Errors**

#### **Scenario:** Hospital does not exist
- **HTTP Status:** 404 Not Found
- **Error Code:** HOSPITAL_NOT_FOUND
- **Message:** "Hospital with ID {id} does not exist"
- **Details:** Provided ID

#### **Scenario:** Soft-deleted hospital
- **HTTP Status:** 404 Not Found
- **Error Code:** HOSPITAL_NOT_FOUND
- **Message:** "Hospital with ID {id} does not exist"
- **Details:** None (never reveal it was deleted)
- **Rationale:** Treat deleted resources as non-existent

#### **Scenario:** Subscription plan not found
- **HTTP Status:** 404 Not Found
- **Error Code:** PLAN_NOT_FOUND
- **Message:** "Subscription plan with ID {id} does not exist"
- **Details:** Provided ID

### **Business Rule Violation Errors**

#### **Scenario:** Cannot activate hospital without subscription
- **HTTP Status:** 422 Unprocessable Entity
- **Error Code:** BUSINESS_RULE_VIOLATION
- **Message:** "Cannot activate hospital without an active subscription"
- **Details:** Hospital ID, current status

#### **Scenario:** Cannot disable all modules for ACTIVE hospital
- **HTTP Status:** 409 Conflict
- **Error Code:** CANNOT_DISABLE_ALL_MODULES
- **Message:** "Cannot disable all modules for an active hospital"
- **Details:** Hospital ID, current modules

#### **Scenario:** Email already exists
- **HTTP Status:** 409 Conflict
- **Error Code:** DUPLICATE_EMAIL
- **Message:** "Email address is already registered"
- **Details:** None (never expose which hospital has the email)

#### **Scenario:** Invalid status transition
- **HTTP Status:** 422 Unprocessable Entity
- **Error Code:** INVALID_STATE_TRANSITION
- **Message:** "Cannot transition from {current_status} to {new_status}"
- **Details:** Current status, attempted status, allowed transitions

#### **Scenario:** Subscription expired
- **HTTP Status:** 422 Unprocessable Entity
- **Error Code:** SUBSCRIPTION_EXPIRED
- **Message:** "Hospital subscription has expired"
- **Details:** Expiry date, hospital ID

### **File Upload Errors**

#### **Scenario:** File too large
- **HTTP Status:** 413 Payload Too Large
- **Error Code:** FILE_TOO_LARGE
- **Message:** "File size exceeds 2MB limit"
- **Details:** File size, max size

#### **Scenario:** Invalid file type
- **HTTP Status:** 400 Bad Request
- **Error Code:** INVALID_FILE_TYPE
- **Message:** "Only JPEG and PNG images are allowed"
- **Details:** Provided file type, allowed types

#### **Scenario:** Malware detected
- **HTTP Status:** 400 Bad Request
- **Error Code:** MALICIOUS_FILE
- **Message:** "File failed security scan"
- **Details:** None (never expose scan details)

### **Rate Limiting Errors**

#### **Scenario:** Rate limit exceeded
- **HTTP Status:** 429 Too Many Requests
- **Error Code:** RATE_LIMIT_EXCEEDED
- **Message:** "Rate limit exceeded. Try again in {seconds} seconds."
- **Details:** Retry after seconds
- **Headers:**
  - `Retry-After`: Seconds until limit resets
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 0
  - `X-RateLimit-Reset`: Unix timestamp

### **Server Errors**

#### **Scenario:** Database connection failed
- **HTTP Status:** 500 Internal Server Error
- **Error Code:** DATABASE_ERROR
- **Message:** "An unexpected error occurred. Please try again later."
- **Details:** None (never expose database details)
- **Logging:** Full error logged server-side with stack trace

#### **Scenario:** Unhandled exception
- **HTTP Status:** 500 Internal Server Error
- **Error Code:** INTERNAL_SERVER_ERROR
- **Message:** "An unexpected error occurred. Please try again later."
- **Details:** None (never expose exception details)
- **Logging:** Full exception logged with request context

## 4. SECURITY RULES FOR ERROR RESPONSES

### **Never Expose Internal Details**
- Never include stack traces in error responses
- Never include SQL queries or database errors
- Never include file paths or system information
- Never include environment variables or configuration
- Never include internal IDs or system identifiers

### **Sanitize Error Messages**
- Remove sensitive data from error messages
- Remove technical jargon from user-facing messages
- Use generic messages for security-related errors
- Never reveal whether a resource exists for unauthorized users

### **Consistent Error Responses**
- Use same error format for all endpoints
- Use same error codes across the system
- Use same HTTP status codes for same error types
- Never reveal different errors for same scenario (timing attacks)

### **Rate Limiting for Error Responses**
- Failed login attempts are rate-limited
- Validation errors are rate-limited (prevent enumeration)
- 404 errors are rate-limited (prevent resource discovery)

### **Logging vs Response**
- Log detailed errors server-side (with full context)
- Return generic errors to client (minimal information)
- Never log sensitive data (passwords, tokens, PII)
- Log all security-related errors (failed auth, forbidden access)

---

# PART D: AUDIT & LOGGING

## 1. AUDIT LOG REQUIREMENTS

### **What Must Be Logged**

#### **Hospital Lifecycle Actions**
- Hospital created
- Hospital updated (with changed fields)
- Hospital status changed (with old and new status)
- Hospital soft-deleted
- Hospital reactivated (if implemented)

#### **Subscription Actions**
- Subscription created
- Subscription extended
- Subscription renewed
- Subscription cancelled
- Subscription expired (automatic)

#### **Module Configuration Actions**
- Module enabled (with module code)
- Module disabled (with module code and reason)
- Bulk module update (with all changes)

#### **Authentication Actions**
- Super Admin login (successful)
- Super Admin login failed (with reason)
- Super Admin logout
- Token expired
- Account locked
- Account unlocked

#### **Authorization Failures**
- Unauthorized access attempts
- Forbidden resource access attempts
- Invalid token usage
- Expired token usage

#### **File Upload Actions**
- Hospital logo uploaded
- Hospital logo updated
- File upload failed (with reason)

### **What Must NOT Be Logged**

#### **Sensitive Data**
- Passwords (plain or hashed)
- JWT tokens (full token)
- Payment card details
- Personal identification numbers
- Social security numbers
- Medical records (Super Admin never accesses these)

#### **Excessive Data**
- Full request bodies (only relevant fields)
- Full response bodies (only status and summary)
- Binary file contents
- Large payloads

## 2. AUDIT LOG DATA STRUCTURE

### **Required Fields for Every Log Entry**

#### **log_id**
- **Type:** Integer (auto-increment)
- **Purpose:** Unique identifier for log entry

#### **actor_type**
- **Type:** Enum (SUPER_ADMIN, SYSTEM)
- **Purpose:** Who performed the action
- **Values:**
  - SUPER_ADMIN: Action performed by Super Admin
  - SYSTEM: Automated action (e.g., subscription expiry)

#### **actor_id**
- **Type:** Integer (nullable)
- **Purpose:** ID of Super Admin who performed action
- **Nullable:** Yes (for SYSTEM actions)

#### **action**
- **Type:** String (UPPERCASE_SNAKE_CASE)
- **Purpose:** What action was performed
- **Examples:**
  - HOSPITAL_CREATED
  - HOSPITAL_UPDATED
  - HOSPITAL_STATUS_CHANGED
  - SUBSCRIPTION_CREATED
  - MODULE_ENABLED
  - LOGIN_SUCCESS
  - LOGIN_FAILED

#### **resource_type**
- **Type:** Enum (HOSPITAL, SUBSCRIPTION, MODULE, AUTH)
- **Purpose:** What type of resource was affected

#### **resource_id**
- **Type:** Integer (nullable)
- **Purpose:** ID of affected resource
- **Nullable:** Yes (for actions without specific resource)

#### **old_values**
- **Type:** JSON (nullable)
- **Purpose:** Previous state before action
- **Usage:** For UPDATE and STATUS_CHANGE actions
- **Example:**
```json
{
  "status": "PENDING",
  "name": "Old Hospital Name"
}
```

#### **new_values**
- **Type:** JSON (nullable)
- **Purpose:** New state after action
- **Usage:** For CREATE, UPDATE, and STATUS_CHANGE actions
- **Example:**
```json
{
  "status": "ACTIVE",
  "name": "New Hospital Name"
}
```

#### **metadata**
- **Type:** JSON (nullable)
- **Purpose:** Additional context about the action
- **Examples:**
  - IP address
  - User agent
  - Request ID
  - Reason for action
  - Error message (for failures)

#### **ip_address**
- **Type:** String (IPv4 or IPv6)
- **Purpose:** IP address of request origin
- **Usage:** Security auditing, fraud detection

#### **user_agent**
- **Type:** String (nullable)
- **Purpose:** Browser/client information
- **Usage:** Security auditing, device tracking

#### **created_at**
- **Type:** Timestamp
- **Purpose:** When the action occurred
- **Default:** Current timestamp
- **Immutable:** Yes (never updated)

## 3. AUDIT LOG USAGE

### **Dashboard "Recent Activities"**

#### **Data Source**
- Query `platform_audit_logs` table
- Filter by action types relevant to dashboard
- Order by `created_at DESC`
- Limit to last 50 entries

#### **Displayed Information**
- Action description (human-readable)
- Actor name (Super Admin name)
- Resource affected (hospital name, module name)
- Timestamp (relative time: "2 hours ago")
- Status (success, failed)

#### **Example Entries**
- "John Doe created hospital 'City General Hospital' 2 hours ago"
- "Jane Smith changed status of 'Metro Clinic' from PENDING to ACTIVE 5 hours ago"
- "System expired subscription for 'Rural Health Center' 1 day ago"
- "John Doe enabled OP module for 'City General Hospital' 3 hours ago"

### **Audit Trail for Compliance**

#### **Purpose**
- Regulatory compliance (HIPAA, GDPR)
- Security incident investigation
- Dispute resolution
- Performance monitoring

#### **Access Control**
- Only Super Admins can view audit logs
- Audit logs cannot be modified or deleted
- Audit logs are backed up regularly
- Audit logs are retained for 7 years (configurable)

#### **Search and Filter**
- Filter by actor (Super Admin)
- Filter by action type
- Filter by resource type
- Filter by date range
- Search by hospital name or ID
- Export to CSV for external analysis

### **Security Monitoring**

#### **Anomaly Detection**
- Multiple failed login attempts from same IP
- Unusual number of hospital creations
- Bulk module disabling
- Access from new IP addresses
- Actions outside business hours

#### **Alerts**
- Email alerts for critical actions
- Slack/webhook notifications for security events
- Dashboard warnings for suspicious activity

## 4. LOG RETENTION AND IMMUTABILITY

### **Retention Policy**

#### **Active Logs**
- Stored in `platform_audit_logs` table
- Retained for 2 years in primary database
- Indexed for fast querying

#### **Archived Logs**
- Logs older than 2 years moved to archive storage
- Stored in compressed format
- Retained for 7 years total (5 years in archive)
- Accessible via special query interface

#### **Deletion Policy**
- Logs older than 7 years are permanently deleted
- Deletion is automated (scheduled job)
- Deletion is logged in system logs

### **Immutability Rules**

#### **No Updates**
- Audit log entries cannot be updated after creation
- No UPDATE queries allowed on `platform_audit_logs` table
- Database triggers prevent updates

#### **No Deletions**
- Audit log entries cannot be deleted manually
- Only automated retention policy can delete logs
- Deletion attempts are logged and blocked

#### **Append-Only**
- Only INSERT operations allowed
- Each action creates new log entry
- No overwriting of existing entries

### **Backup and Recovery**

#### **Backup Frequency**
- Daily incremental backups
- Weekly full backups
- Monthly archive backups

#### **Backup Storage**
- Stored in separate location from primary database
- Encrypted at rest
- Replicated to multiple regions

#### **Recovery Testing**
- Monthly recovery drills
- Verify backup integrity
- Test restore procedures

## 5. LOGGING BEST PRACTICES

### **Performance Considerations**

#### **Asynchronous Logging**
- Audit logs are written asynchronously
- Does not block main request processing
- Uses message queue (e.g., Redis, RabbitMQ)
- Ensures fast API response times

#### **Batch Inserts**
- Multiple log entries inserted in batches
- Reduces database load
- Improves write performance

#### **Indexing Strategy**
- Index on `created_at` for time-based queries
- Index on `actor_id` for user-based queries
- Index on `resource_type` and `resource_id` for resource-based queries
- Composite index on `action` and `created_at` for dashboard queries

### **Data Privacy**

#### **PII Handling**
- Never log patient data (Super Admin never accesses it)
- Mask sensitive fields (email: j***@example.com)
- Anonymize IP addresses after 90 days (GDPR compliance)
- Remove user agent after 90 days

#### **GDPR Compliance**
- Right to access: Super Admins can view their own audit logs
- Right to erasure: Not applicable (audit logs are exempt)
- Data minimization: Only log necessary information
- Purpose limitation: Logs used only for audit and security

### **Error Logging**

#### **Application Errors**
- Logged separately from audit logs
- Include stack traces and context
- Never exposed to clients
- Monitored for alerting

#### **Security Errors**
- Logged in audit logs
- Include IP address and user agent
- Trigger security alerts
- Reviewed regularly

---

# SUMMARY

This specification defines comprehensive security, validation, and error handling rules for the Super Admin module:

## **Security**
- JWT-based authentication with 8-hour expiration
- Role-based authorization with middleware pipeline
- Protection against unauthorized access and privilege escalation
- Secure token handling with no automatic refresh

## **Validation**
- Comprehensive input validation for all fields
- Business rule validation for state transitions
- File upload validation with security checks
- Query parameter validation with SQL injection prevention

## **Error Handling**
- Consistent error response structure
- Appropriate HTTP status codes for all scenarios
- Security-focused error messages (no internal details)
- Rate limiting for error responses

## **Audit & Logging**
- Immutable audit trail for all Super Admin actions
- Comprehensive logging of lifecycle, subscription, and module changes
- Dashboard integration for recent activities
- 7-year retention with 2-year active + 5-year archive
- GDPR-compliant data privacy practices

All rules are designed to ensure the Super Admin module is secure, reliable, and compliant with industry standards.

