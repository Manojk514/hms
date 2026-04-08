# MODULE 1: SUPER ADMIN - MODULE CONFIGURATION MANAGEMENT

## SPECIFICATION OVERVIEW

**Feature:** Hospital Module Configuration Management  
**Version:** 1.0  
**Date:** 2024-01-20  
**Status:** Design Phase

## PURPOSE

Enable Super Admin to control which modules (OP, Lab, Pharmacy, Billing, IPD) are enabled or disabled for each hospital. Backend enforces module access system-wide, preventing unauthorized access to disabled modules.

## SCOPE

### In Scope
- Enable/disable modules per hospital
- View enabled modules for a hospital
- Default module configuration for new hospitals
- Module access enforcement at backend level
- Module state during hospital lifecycle changes

### Out of Scope
- Module-specific functionality (OP workflows, Lab tests, etc.)
- Module pricing or billing
- Module feature flags within a module
- Hospital-level module configuration (only Super Admin)

---

# PART 1: BUSINESS LOGIC RULES

## 1. MODULE DEFINITIONS

### **Available Modules**

| Module Code | Module Name | Description | Status |
|------------|-------------|-------------|--------|
| `OP` | Outpatient Management | Patient registration, appointments, consultations | Available |
| `LAB` | Laboratory Management | Lab test orders, results, reports | Available |
| `PHARMACY` | Pharmacy Management | Medication dispensing, inventory | Available |
| `BILLING` | Billing & Payments | Patient billing, invoices, payments | Available |
| `IPD` | Inpatient Department | Admissions, ward management, discharge | Future |
| `EMERGENCY` | Emergency Department | Emergency cases, triage | Future |

### **Module Dependencies**
- No module has dependencies on other modules
- Each module operates independently
- Modules can be enabled/disabled in any combination
- At least one module must be enabled for hospital to be ACTIVE

---

## 2. DEFAULT MODULE STATES FOR NEW HOSPITALS

### **On Hospital Creation (Status: PENDING)**
- **No modules are enabled by default**
- Hospital has zero enabled modules
- Module records do NOT exist in `hospital_modules` table
- Hospital cannot be activated without at least one module

### **Rationale**
- Modules are tied to subscription plans
- Hospital must subscribe to a plan before modules are enabled
- Prevents hospitals from accessing modules without payment

---

## 3. MODULE ENABLEMENT RULES

### **Preconditions for Enabling a Module**
- Hospital must exist in the system
- Hospital must NOT be soft-deleted (`deleted_at IS NULL`)
- Module code must be valid (OP, LAB, PHARMACY, BILLING, IPD, EMERGENCY)
- Super Admin must be authenticated with SUPER_ADMIN role

### **Business Rules for Enabling**

#### **Rule 1: Module Can Be Enabled Regardless of Hospital Status**
- Modules can be enabled when hospital is PENDING, ACTIVE, or INACTIVE
- Enabling a module does NOT automatically activate the hospital
- Super Admin must separately activate the hospital

#### **Rule 2: Module Enablement Creates/Updates Record**
- If module record does NOT exist in `hospital_modules`:
  - Create new record with `is_enabled = 1`
  - Set `enabled_at` to current timestamp
  - Set `enabled_by` to current Super Admin ID
- If module record exists with `is_enabled = 0`:
  - Update `is_enabled = 1`
  - Update `enabled_at` to current timestamp
  - Update `enabled_by` to current Super Admin ID
- If module record exists with `is_enabled = 1`:
  - No change (already enabled)
  - Return success with message "Module already enabled"

#### **Rule 3: Module Enablement is Immediate**
- Module becomes accessible immediately after enablement
- If hospital is ACTIVE, users can access the module immediately
- If hospital is INACTIVE or PENDING, module is enabled but not accessible until hospital is activated

#### **Rule 4: Subscription Plan Modules**
- When hospital subscribes to a plan, all modules in that plan are automatically enabled
- Super Admin can manually enable additional modules not in the plan
- Super Admin can manually disable modules even if they are in the plan

#### **Rule 5: Audit Trail**
- Module enablement is logged in `platform_audit_logs`
- Log includes: super_admin_id, action_type = 'MODULE_ENABLED', hospital_id, module_code
- Log includes timestamp and reason (if provided)

### **State Changes on Module Enablement**
- Record created/updated in `hospital_modules` table
- `is_enabled` set to 1
- `enabled_at` set to current timestamp
- `enabled_by` set to current Super Admin ID
- `disabled_at` set to NULL
- `notes` updated with reason (if provided)

### **Post-Enablement Behavior**
- Module appears in hospital's enabled modules list
- If hospital is ACTIVE, hospital users can access the module
- Backend middleware allows requests to module endpoints
- Module-specific features become available in UI

---

## 4. MODULE DISABLEMENT RULES

### **Preconditions for Disabling a Module**
- Hospital must exist in the system
- Hospital must NOT be soft-deleted (`deleted_at IS NULL`)
- Module must currently be enabled (`is_enabled = 1`)
- Super Admin must be authenticated with SUPER_ADMIN role

### **Business Rules for Disabling**

#### **Rule 1: Cannot Disable All Modules if Hospital is ACTIVE**
- If hospital status is ACTIVE, at least one module must remain enabled
- Attempting to disable the last enabled module returns error
- Error message: "Cannot disable all modules for an active hospital. Deactivate hospital first."
- Rationale: Active hospitals must have at least one operational module

#### **Rule 2: Can Disable All Modules if Hospital is INACTIVE or PENDING**
- If hospital status is INACTIVE or PENDING, all modules can be disabled
- No minimum module requirement for non-active hospitals

#### **Rule 3: Module Disablement is Immediate**
- Module becomes inaccessible immediately after disablement
- All active user sessions accessing the module are terminated
- Users receive "Module not available" error on next request
- Existing data in the module is preserved but not accessible

#### **Rule 4: Reason is Required for Disablement**
- Super Admin must provide a reason for disabling a module
- Reason minimum length: 10 characters
- Reason maximum length: 500 characters
- Reason is stored in `notes` field of `hospital_modules` table

#### **Rule 5: Module Disablement Updates Record**
- Update `is_enabled = 0`
- Set `disabled_at` to current timestamp
- Set `enabled_by` to current Super Admin ID (who disabled it)
- Update `notes` with reason
- Record is NOT deleted (preserves history)

#### **Rule 6: Audit Trail**
- Module disablement is logged in `platform_audit_logs`
- Log includes: super_admin_id, action_type = 'MODULE_DISABLED', hospital_id, module_code
- Log includes reason and timestamp

### **State Changes on Module Disablement**
- Record updated in `hospital_modules` table
- `is_enabled` set to 0
- `disabled_at` set to current timestamp
- `enabled_by` set to current Super Admin ID
- `notes` updated with reason

### **Post-Disablement Behavior**
- Module disappears from hospital's enabled modules list
- Hospital users cannot access the module
- Backend middleware blocks requests to module endpoints
- Module-specific features are hidden in UI
- Existing data is preserved but not accessible

---

## 5. MODULE BEHAVIOR DURING HOSPITAL LIFECYCLE

### **When Hospital is PENDING**
- Modules can be enabled or disabled
- Enabled modules are NOT accessible (hospital not operational)
- Module configuration is prepared for activation
- At least one module must be enabled before hospital can be activated

### **When Hospital is ACTIVE**
- Enabled modules are fully accessible to hospital users
- Modules can be enabled or disabled by Super Admin
- At least one module must remain enabled
- Disabling a module immediately blocks access

### **When Hospital is INACTIVE**
- All modules become inaccessible regardless of enabled state
- Module enabled/disabled state is preserved
- Modules can be enabled or disabled by Super Admin
- When hospital is reactivated, previously enabled modules become accessible again

### **When Hospital is SOFT-DELETED**
- All modules are automatically disabled
- `is_enabled` set to 0 for all modules
- `disabled_at` set to deletion timestamp
- Module records are preserved (not deleted)
- Modules cannot be enabled while hospital is deleted
- If hospital is restored, modules must be manually re-enabled

---

## 6. BACKEND MODULE ACCESS ENFORCEMENT

### **Enforcement Layer: Middleware**

#### **Module Access Middleware**
- Runs after authentication and authorization middleware
- Runs before controller logic
- Checks if requested module is enabled for the hospital
- Blocks request if module is disabled

#### **Enforcement Logic**
1. Extract hospital_id from JWT token or request context
2. Extract module_code from request URL (e.g., `/api/hospital/op/*` → module = OP)
3. Query `hospital_modules` table:
   - `WHERE hospital_id = ? AND module_code = ? AND is_enabled = 1`
4. If record exists: Allow request to proceed
5. If record does NOT exist: Block request with 403 Forbidden

#### **Error Response for Disabled Module**
```json
{
  "success": false,
  "error": {
    "code": "MODULE_DISABLED",
    "message": "The OP module is not enabled for your hospital",
    "details": {
      "module_code": "OP",
      "module_name": "Outpatient Management"
    }
  }
}
```

### **Enforcement Points**

#### **Hospital-Level API Endpoints**
- All endpoints under `/api/hospital/{module}/*` are protected
- Examples:
  - `/api/hospital/op/appointments` → Requires OP module
  - `/api/hospital/lab/tests` → Requires LAB module
  - `/api/hospital/pharmacy/medications` → Requires PHARMACY module
  - `/api/hospital/billing/invoices` → Requires BILLING module

#### **Module-Specific Features**
- UI can hide/show features based on enabled modules (for UX)
- Backend MUST enforce access regardless of UI state
- Malicious users bypassing UI will be blocked by backend

#### **Cross-Module Access**
- If a feature requires multiple modules, ALL must be enabled
- Example: Billing for lab tests requires both LAB and BILLING modules
- Backend checks all required modules before allowing access

### **Enforcement During Hospital Status Changes**

#### **Hospital Deactivation**
- Module enabled state is preserved
- Backend blocks all module access (hospital is inactive)
- Module middleware returns "Hospital is inactive" error

#### **Hospital Reactivation**
- Module enabled state is restored
- Backend allows access to enabled modules
- Module middleware checks enabled state as normal

#### **Hospital Deletion**
- All modules are disabled automatically
- Backend blocks all module access
- Module middleware returns "Hospital has been deleted" error

---

## 7. MODULE CONFIGURATION VALIDATION RULES

### **Module Code Validation**
- Must be one of: OP, LAB, PHARMACY, BILLING, IPD, EMERGENCY
- Case-insensitive (converted to uppercase)
- Invalid module codes return 400 Bad Request

### **Hospital Validation**
- Hospital must exist
- Hospital must not be soft-deleted
- Hospital ID must be positive integer

### **Reason Validation (for disablement)**
- Required when disabling a module
- Minimum length: 10 characters
- Maximum length: 500 characters
- Cannot be only whitespace

### **Minimum Module Requirement**
- ACTIVE hospitals must have at least one enabled module
- INACTIVE/PENDING hospitals can have zero enabled modules
- Attempting to disable last module of ACTIVE hospital returns 422 error

---

## 8. MODULE CONFIGURATION ERROR SCENARIOS

### **Enabling a Module**

#### **Error 1: Hospital Not Found**
- Hospital ID does not exist
- Returns 404 Not Found

#### **Error 2: Hospital is Deleted**
- Hospital has `deleted_at` timestamp
- Returns 403 Forbidden
- Message: "Cannot enable modules for a deleted hospital"

#### **Error 3: Invalid Module Code**
- Module code is not in allowed list
- Returns 400 Bad Request
- Message: "Invalid module code"

#### **Error 4: Module Already Enabled**
- Module is already enabled (`is_enabled = 1`)
- Returns 200 OK with message "Module already enabled"
- No state change

### **Disabling a Module**

#### **Error 1: Hospital Not Found**
- Hospital ID does not exist
- Returns 404 Not Found

#### **Error 2: Hospital is Deleted**
- Hospital has `deleted_at` timestamp
- Returns 403 Forbidden
- Message: "Cannot disable modules for a deleted hospital"

#### **Error 3: Module Not Enabled**
- Module is already disabled (`is_enabled = 0`)
- Returns 200 OK with message "Module already disabled"
- No state change

#### **Error 4: Last Module of Active Hospital**
- Attempting to disable the only enabled module of an ACTIVE hospital
- Returns 422 Unprocessable Entity
- Message: "Cannot disable all modules for an active hospital"

#### **Error 5: Missing Reason**
- Reason not provided or too short
- Returns 400 Bad Request
- Message: "Reason is required and must be at least 10 characters"

---

## 9. MODULE CONFIGURATION AUDIT TRAIL

### **Actions Logged**
- `MODULE_ENABLED`: Module was enabled for a hospital
- `MODULE_DISABLED`: Module was disabled for a hospital
- `MODULES_AUTO_ENABLED`: Modules auto-enabled from subscription plan
- `MODULES_AUTO_DISABLED`: Modules auto-disabled on hospital deletion

### **Log Details**
- Super Admin ID who performed the action
- Hospital ID affected
- Module code
- Action timestamp
- Reason (for disablement)
- Old state and new state
- IP address and user agent

---

# PART 2: REST API DESIGN

## API NAMESPACE

**Base URL:** `/api/platform/admin/hospitals/{hospital_id}/modules`

All module configuration endpoints are under the Super Admin namespace.

---

## API ENDPOINT 1: LIST ENABLED MODULES

### **HTTP Method**
`GET`

### **URL Path**
`/api/platform/admin/hospitals/{hospital_id}/modules`

### **Purpose**
Retrieve list of all modules and their enabled/disabled status for a specific hospital.

### **Authorization**
- Requires valid JWT token
- Requires SUPER_ADMIN role
- Super Admin account must be active

### **Request Headers**
```
Authorization: Bearer <jwt_token>
```

### **URL Parameters**
- `hospital_id`: Hospital ID (required, positive integer)

### **Query Parameters**
- None

### **Success Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "hospital_id": 1,
    "hospital_code": "HSP-001",
    "hospital_name": "Apollo Hospitals",
    "hospital_status": "ACTIVE",
    "modules": [
      {
        "module_code": "OP",
        "module_name": "Outpatient Management",
        "is_enabled": true,
        "enabled_at": "2024-01-16T09:30:00Z",
        "enabled_by": {
          "id": 1,
          "name": "Super Admin"
        },
        "disabled_at": null,
        "notes": null
      },
      {
        "module_code": "LAB",
        "module_name": "Laboratory Management",
        "is_enabled": true,
        "enabled_at": "2024-01-16T09:30:00Z",
        "enabled_by": {
          "id": 1,
          "name": "Super Admin"
        },
        "disabled_at": null,
        "notes": null
      },
      {
        "module_code": "PHARMACY",
        "module_name": "Pharmacy Management",
        "is_enabled": false,
        "enabled_at": null,
        "enabled_by": null,
        "disabled_at": "2024-01-18T14:00:00Z",
        "notes": "Pharmacy operations suspended temporarily"
      },
      {
        "module_code": "BILLING",
        "module_name": "Billing & Payments",
        "is_enabled": true,
        "enabled_at": "2024-01-16T09:30:00Z",
        "enabled_by": {
          "id": 1,
          "name": "Super Admin"
        },
        "disabled_at": null,
        "notes": null
      },
      {
        "module_code": "IPD",
        "module_name": "Inpatient Department",
        "is_enabled": false,
        "enabled_at": null,
        "enabled_by": null,
        "disabled_at": null,
        "notes": "Module not yet available"
      }
    ],
    "summary": {
      "total_modules": 5,
      "enabled_modules": 3,
      "disabled_modules": 2
    }
  }
}
```

### **Error Responses**

#### **Hospital Not Found (404 Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "HOSPITAL_NOT_FOUND",
    "message": "Hospital with ID 999 does not exist"
  }
}
```

#### **Invalid Hospital ID (400 Bad Request)**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid hospital ID",
    "details": {
      "hospital_id": ["Must be a positive integer"]
    }
  }
}
```

#### **Unauthorized (401 Unauthorized)**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token"
  }
}
```

#### **Forbidden (403 Forbidden)**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Super Admin access required"
  }
}
```

### **HTTP Status Codes**
- `200 OK`: Success
- `400 Bad Request`: Invalid hospital ID
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin
- `404 Not Found`: Hospital not found
- `500 Internal Server Error`: Server error

---

## API ENDPOINT 2: ENABLE MODULE

### **HTTP Method**
`POST`

### **URL Path**
`/api/platform/admin/hospitals/{hospital_id}/modules/{module_code}/enable`

### **Purpose**
Enable a specific module for a hospital.

### **Authorization**
- Requires valid JWT token
- Requires SUPER_ADMIN role
- Super Admin account must be active

### **Request Headers**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **URL Parameters**
- `hospital_id`: Hospital ID (required, positive integer)
- `module_code`: Module code (required, one of: OP, LAB, PHARMACY, BILLING, IPD, EMERGENCY)

### **Optional Request Fields**
```json
{
  "notes": "string"  // Optional notes (max 1000 chars)
}
```

### **Example Request**
```
POST /api/platform/admin/hospitals/1/modules/PHARMACY/enable
```
```json
{
  "notes": "Enabling pharmacy module as per hospital request"
}
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Module enabled successfully",
  "data": {
    "hospital_id": 1,
    "hospital_code": "HSP-001",
    "module_code": "PHARMACY",
    "module_name": "Pharmacy Management",
    "is_enabled": true,
    "enabled_at": "2024-01-20T10:00:00Z",
    "enabled_by": {
      "id": 1,
      "name": "Super Admin"
    },
    "notes": "Enabling pharmacy module as per hospital request"
  }
}
```

### **Success Response - Already Enabled (200 OK)**
```json
{
  "success": true,
  "message": "Module is already enabled",
  "data": {
    "hospital_id": 1,
    "module_code": "PHARMACY",
    "is_enabled": true,
    "enabled_at": "2024-01-16T09:30:00Z"
  }
}
```

### **Error Responses**

#### **Invalid Module Code (400 Bad Request)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_MODULE_CODE",
    "message": "Invalid module code. Must be one of: OP, LAB, PHARMACY, BILLING, IPD, EMERGENCY",
    "details": {
      "provided": "INVALID_MODULE",
      "allowed": ["OP", "LAB", "PHARMACY", "BILLING", "IPD", "EMERGENCY"]
    }
  }
}
```

#### **Hospital Not Found (404 Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "HOSPITAL_NOT_FOUND",
    "message": "Hospital with ID 999 does not exist"
  }
}
```

#### **Hospital is Deleted (403 Forbidden)**
```json
{
  "success": false,
  "error": {
    "code": "HOSPITAL_DELETED",
    "message": "Cannot enable modules for a deleted hospital"
  }
}
```

#### **Unauthorized (401 Unauthorized)**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token"
  }
}
```

#### **Forbidden (403 Forbidden)**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Super Admin access required"
  }
}
```

### **HTTP Status Codes**
- `200 OK`: Success (including already enabled)
- `400 Bad Request`: Invalid module code
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin or hospital deleted
- `404 Not Found`: Hospital not found
- `500 Internal Server Error`: Server error

---

## API ENDPOINT 3: DISABLE MODULE

### **HTTP Method**
`POST`

### **URL Path**
`/api/platform/admin/hospitals/{hospital_id}/modules/{module_code}/disable`

### **Purpose**
Disable a specific module for a hospital.

### **Authorization**
- Requires valid JWT token
- Requires SUPER_ADMIN role
- Super Admin account must be active

### **Request Headers**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **URL Parameters**
- `hospital_id`: Hospital ID (required, positive integer)
- `module_code`: Module code (required, one of: OP, LAB, PHARMACY, BILLING, IPD, EMERGENCY)

### **Required Request Fields**
```json
{
  "reason": "string"  // Required, 10-500 chars
}
```

### **Example Request**
```
POST /api/platform/admin/hospitals/1/modules/PHARMACY/disable
```
```json
{
  "reason": "Pharmacy operations suspended due to licensing issues"
}
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Module disabled successfully",
  "data": {
    "hospital_id": 1,
    "hospital_code": "HSP-001",
    "module_code": "PHARMACY",
    "module_name": "Pharmacy Management",
    "is_enabled": false,
    "disabled_at": "2024-01-20T11:00:00Z",
    "disabled_by": {
      "id": 1,
      "name": "Super Admin"
    },
    "reason": "Pharmacy operations suspended due to licensing issues"
  }
}
```

### **Success Response - Already Disabled (200 OK)**
```json
{
  "success": true,
  "message": "Module is already disabled",
  "data": {
    "hospital_id": 1,
    "module_code": "PHARMACY",
    "is_enabled": false,
    "disabled_at": "2024-01-18T14:00:00Z"
  }
}
```

### **Error Responses**

#### **Missing Reason (400 Bad Request)**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Reason is required when disabling a module",
    "details": {
      "reason": ["Reason must be at least 10 characters"]
    }
  }
}
```

#### **Last Module of Active Hospital (422 Unprocessable Entity)**
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_DISABLE_LAST_MODULE",
    "message": "Cannot disable all modules for an active hospital. Deactivate the hospital first.",
    "details": {
      "hospital_id": 1,
      "hospital_status": "ACTIVE",
      "enabled_modules_count": 1,
      "module_being_disabled": "OP"
    }
  }
}
```

#### **Invalid Module Code (400 Bad Request)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_MODULE_CODE",
    "message": "Invalid module code"
  }
}
```

#### **Hospital Not Found (404 Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "HOSPITAL_NOT_FOUND",
    "message": "Hospital with ID 999 does not exist"
  }
}
```

#### **Hospital is Deleted (403 Forbidden)**
```json
{
  "success": false,
  "error": {
    "code": "HOSPITAL_DELETED",
    "message": "Cannot disable modules for a deleted hospital"
  }
}
```

#### **Unauthorized (401 Unauthorized)**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token"
  }
}
```

#### **Forbidden (403 Forbidden)**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Super Admin access required"
  }
}
```

### **HTTP Status Codes**
- `200 OK`: Success (including already disabled)
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin or hospital deleted
- `404 Not Found`: Hospital not found
- `422 Unprocessable Entity`: Business rule violations
- `500 Internal Server Error`: Server error

---

## API ENDPOINT 4: BULK ENABLE/DISABLE MODULES

### **HTTP Method**
`PATCH`

### **URL Path**
`/api/platform/admin/hospitals/{hospital_id}/modules`

### **Purpose**
Enable or disable multiple modules in a single request.

### **Authorization**
- Requires valid JWT token
- Requires SUPER_ADMIN role
- Super Admin account must be active

### **Request Headers**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **URL Parameters**
- `hospital_id`: Hospital ID (required, positive integer)

### **Required Request Fields**
```json
{
  "modules": [
    {
      "module_code": "string",  // OP, LAB, PHARMACY, BILLING, IPD, EMERGENCY
      "is_enabled": boolean     // true to enable, false to disable
    }
  ]
}
```

### **Optional Request Fields**
```json
{
  "reason": "string"  // Required if disabling any module (10-500 chars)
}
```

### **Example Request**
```
PATCH /api/platform/admin/hospitals/1/modules
```
```json
{
  "modules": [
    {
      "module_code": "OP",
      "is_enabled": true
    },
    {
      "module_code": "LAB",
      "is_enabled": true
    },
    {
      "module_code": "PHARMACY",
      "is_enabled": false
    },
    {
      "module_code": "BILLING",
      "is_enabled": true
    }
  ],
  "reason": "Reconfiguring modules based on new subscription plan"
}
```

### **Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Modules updated successfully",
  "data": {
    "hospital_id": 1,
    "hospital_code": "HSP-001",
    "updated_modules": [
      {
        "module_code": "OP",
        "module_name": "Outpatient Management",
        "is_enabled": true,
        "action": "enabled"
      },
      {
        "module_code": "LAB",
        "module_name": "Laboratory Management",
        "is_enabled": true,
        "action": "already_enabled"
      },
      {
        "module_code": "PHARMACY",
        "module_name": "Pharmacy Management",
        "is_enabled": false,
        "action": "disabled"
      },
      {
        "module_code": "BILLING",
        "module_name": "Billing & Payments",
        "is_enabled": true,
        "action": "enabled"
      }
    ],
    "summary": {
      "total_modules": 4,
      "enabled": 3,
      "disabled": 1,
      "unchanged": 1
    },
    "updated_at": "2024-01-20T12:00:00Z"
  }
}
```

### **Error Responses**

#### **Validation Error (400 Bad Request)**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "modules": ["At least one module must be provided"],
      "reason": ["Reason is required when disabling modules"]
    }
  }
}
```

#### **All Modules Disabled for Active Hospital (422 Unprocessable Entity)**
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_DISABLE_ALL_MODULES",
    "message": "Cannot disable all modules for an active hospital",
    "details": {
      "hospital_status": "ACTIVE",
      "requested_enabled_modules": 0
    }
  }
}
```

#### **Hospital Not Found (404 Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "HOSPITAL_NOT_FOUND",
    "message": "Hospital with ID 999 does not exist"
  }
}
```

### **HTTP Status Codes**
- `200 OK`: Success
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin or hospital deleted
- `404 Not Found`: Hospital not found
- `422 Unprocessable Entity`: Business rule violations
- `500 Internal Server Error`: Server error

---

## SUMMARY OF MODULE CONFIGURATION RULES

### **Key Business Rules**
1. New hospitals have zero enabled modules by default
2. Modules are enabled when hospital subscribes to a plan
3. Super Admin can manually enable/disable modules
4. ACTIVE hospitals must have at least one enabled module
5. Module access is enforced by backend middleware
6. Soft-deleted hospitals have all modules disabled
7. Module state is preserved during hospital status changes

### **Key API Endpoints**
1. `GET /hospitals/{id}/modules` - List all modules and their status
2. `POST /hospitals/{id}/modules/{code}/enable` - Enable a module
3. `POST /hospitals/{id}/modules/{code}/disable` - Disable a module
4. `PATCH /hospitals/{id}/modules` - Bulk enable/disable modules

### **Backend Enforcement**
- Module access middleware checks enabled state
- Disabled modules return 403 Forbidden
- UI cannot bypass backend enforcement
- All module actions are logged for audit

---

**End of Module Configuration Specification**
