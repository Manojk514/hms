# MODULE 1: SUPER ADMIN - DASHBOARD AND REPORTS

## SPECIFICATION OVERVIEW

**Feature:** Super Admin Dashboard and Reporting System  
**Version:** 1.0  
**Date:** 2024-01-20  
**Status:** Design Phase

## PURPOSE

Provide Super Admin with platform-level insights through a comprehensive dashboard and reporting system. Enable monitoring of hospital onboarding, subscription status, revenue tracking, and system usage without accessing hospital operational data.

## SCOPE

### In Scope
- Platform-level dashboard with key metrics
- Hospital-wise statistics
- Revenue tracking (subscription-based)
- Subscription renewal tracking
- System usage statistics
- Audit trail viewing
- Read-only reporting

### Out of Scope
- Hospital operational data (patients, appointments, billing)
- Hospital-internal financial transactions
- Clinical data or medical records
- Real-time analytics
- Data export/download (future feature)
- Custom report builder (future feature)

---

# PART A: SUPER ADMIN DASHBOARD

## 1. DASHBOARD BUSINESS LOGIC

### **Dashboard Purpose**
Provide Super Admin with a high-level overview of the entire platform's health, including hospital counts, subscription status, revenue, and recent activities.

### **Data Refresh Strategy**
- Dashboard data is cached and refreshed every 5 minutes
- Uses `platform_activity_summary` table for pre-aggregated statistics
- Real-time data not required (acceptable 5-minute delay)
- Manual refresh option available


### **Dashboard Metrics Included**

#### **1. Total Hospitals**
- **Definition:** Count of all hospitals in the system
- **Calculation:** `COUNT(*) FROM hospitals WHERE deleted_at IS NULL`
- **Includes:** PENDING, ACTIVE, INACTIVE hospitals
- **Excludes:** Soft-deleted hospitals (deleted_at IS NOT NULL)
- **Purpose:** Track total platform adoption

#### **2. Active Hospitals**
- **Definition:** Count of hospitals currently operational
- **Calculation:** `COUNT(*) FROM hospitals WHERE status = 'ACTIVE' AND deleted_at IS NULL`
- **Includes:** Only hospitals with status = ACTIVE
- **Excludes:** PENDING, INACTIVE, DELETED hospitals
- **Purpose:** Track operational hospitals

#### **3. Inactive Hospitals**
- **Definition:** Count of hospitals temporarily suspended
- **Calculation:** `COUNT(*) FROM hospitals WHERE status = 'INACTIVE' AND deleted_at IS NULL`
- **Includes:** Only hospitals with status = INACTIVE
- **Excludes:** PENDING, ACTIVE, DELETED hospitals
- **Purpose:** Track suspended hospitals needing attention

#### **4. Pending Hospitals**
- **Definition:** Count of hospitals awaiting activation
- **Calculation:** `COUNT(*) FROM hospitals WHERE status = 'PENDING' AND deleted_at IS NULL`
- **Includes:** Only hospitals with status = PENDING
- **Excludes:** ACTIVE, INACTIVE, DELETED hospitals
- **Purpose:** Track hospitals in onboarding pipeline

#### **5. Total Revenue (Monthly)**
- **Definition:** Sum of all active subscription monthly prices
- **Calculation:** `SUM(monthly_price) FROM hospital_subscriptions WHERE subscription_status = 'ACTIVE'`
- **Includes:** Only ACTIVE subscriptions
- **Excludes:** EXPIRED, CANCELLED, TRIAL subscriptions
- **Purpose:** Track monthly recurring revenue (MRR)
- **Note:** This is subscription revenue, NOT hospital operational revenue


#### **6. Subscriptions Expiring Soon**
- **Definition:** Count of subscriptions expiring within next 30 days
- **Calculation:** `COUNT(*) FROM hospital_subscriptions WHERE subscription_status = 'ACTIVE' AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`
- **Includes:** Only ACTIVE subscriptions with end_date in next 30 days
- **Purpose:** Track renewal pipeline

#### **7. New Hospitals This Month**
- **Definition:** Count of hospitals created in current month
- **Calculation:** `COUNT(*) FROM hospitals WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`
- **Includes:** All hospitals created this month (any status)
- **Excludes:** Soft-deleted hospitals
- **Purpose:** Track growth rate

### **Dashboard Data Explicitly Excluded**

#### **Hospital Operational Data**
- Patient counts
- Appointment counts
- Lab test counts
- Prescription counts
- Hospital-internal revenue (patient billing)
- Staff counts
- Doctor counts

#### **Clinical Data**
- Medical records
- Diagnoses
- Treatments
- Lab results
- Prescriptions

#### **Financial Transactions**
- Patient payments
- Hospital expenses
- Staff salaries
- Vendor payments


### **Treatment of Inactive/Soft-Deleted Hospitals**

#### **Inactive Hospitals**
- **Included in:** Total hospitals count
- **Included in:** Inactive hospitals count
- **Excluded from:** Active hospitals count
- **Subscription Status:** May have ACTIVE or EXPIRED subscription
- **Revenue Impact:** If subscription is ACTIVE, included in total revenue
- **Dashboard Display:** Shown separately as "Inactive Hospitals"

#### **Soft-Deleted Hospitals**
- **Excluded from:** All dashboard counts
- **Excluded from:** All revenue calculations
- **Excluded from:** Hospital-wise statistics table
- **Excluded from:** Recent activities (unless specifically viewing deleted hospitals)
- **Rationale:** Deleted hospitals are not part of active platform operations

#### **Pending Hospitals**
- **Included in:** Total hospitals count
- **Included in:** Pending hospitals count
- **Excluded from:** Active hospitals count
- **Subscription Status:** Typically no subscription yet
- **Revenue Impact:** Not included in revenue (no active subscription)
- **Dashboard Display:** Shown separately as "Pending Hospitals"

### **Subscription Expiry Impact on Metrics**

#### **When Subscription Expires**
- Hospital status automatically changes to INACTIVE
- Hospital is removed from "Active Hospitals" count
- Hospital is added to "Inactive Hospitals" count
- Subscription revenue is removed from "Total Revenue"
- Hospital appears in "Subscriptions Expiring Soon" before expiry

#### **Grace Period Handling**
- If grace period is configured (e.g., 7 days), hospital remains ACTIVE during grace period
- After grace period, hospital becomes INACTIVE
- Revenue is counted until subscription actually expires


### **Total Revenue Definition**

#### **What Total Revenue Represents**
- **Subscription Revenue Only:** Sum of monthly subscription prices for all ACTIVE subscriptions
- **Monthly Recurring Revenue (MRR):** Expected monthly income from subscriptions
- **Platform-Level:** Aggregated across all hospitals
- **Does NOT Include:**
  - Hospital operational revenue (patient billing)
  - One-time setup fees
  - Additional service charges
  - Hospital-internal transactions

#### **Revenue Calculation Rules**
- Only ACTIVE subscriptions are counted
- EXPIRED subscriptions are excluded
- CANCELLED subscriptions are excluded
- TRIAL subscriptions may be included with price = 0
- Price is locked at subscription creation (not affected by plan price changes)

#### **Revenue Breakdown**
- Total MRR (all active subscriptions)
- Revenue by subscription plan (Basic, Standard, Premium)
- Revenue by billing cycle (Monthly, Annual)
- Revenue trend (month-over-month growth)

### **Hospital-Wise Statistics Table**

#### **Purpose**
Display key metrics for each hospital in a tabular format for quick comparison and monitoring.

#### **Columns Included**
1. Hospital Code (e.g., HSP-001)
2. Hospital Name
3. City, State
4. Status (PENDING, ACTIVE, INACTIVE)
5. Subscription Plan Name
6. Subscription Status (ACTIVE, EXPIRED, TRIAL)
7. Subscription End Date
8. Days Until Expiry
9. Monthly Price
10. Enabled Modules Count
11. Created Date
12. Activated Date


#### **Sorting and Filtering**
- Sort by: Hospital Name, Status, Subscription End Date, Monthly Price, Created Date
- Filter by: Status, Subscription Status, City, State, Subscription Plan
- Search by: Hospital Name, Hospital Code, Email
- Pagination: 20 hospitals per page (configurable)

#### **Data Excluded from Table**
- Patient counts
- Appointment counts
- Hospital operational metrics
- Staff information
- Clinical data

### **Recent Activities (Audit Trail)**

#### **Purpose**
Display recent Super Admin actions for monitoring and audit purposes.

#### **Activities Included**
- Hospital created
- Hospital activated
- Hospital deactivated
- Hospital deleted
- Subscription created
- Subscription renewed
- Subscription cancelled
- Module enabled
- Module disabled
- Hospital details updated
- Status changed

#### **Activity Details**
- Action type
- Hospital affected (name and code)
- Super Admin who performed action
- Timestamp
- Action status (SUCCESS, FAILED)
- Brief description

#### **Display Rules**
- Show last 50 activities by default
- Sorted by timestamp (newest first)
- Filter by: Action type, Hospital, Super Admin, Date range
- Pagination: 20 activities per page


#### **Activities Excluded**
- Hospital-internal actions (staff login, patient registration, etc.)
- Hospital Admin actions
- Doctor actions
- Patient actions
- System-generated events (unless significant)

---

## 2. DASHBOARD API DESIGN

### **API ENDPOINT: GET DASHBOARD OVERVIEW**

**HTTP Method:** `GET`

**URL Path:** `/api/platform/admin/dashboard`

**Purpose:** Retrieve complete dashboard overview with all key metrics, hospital statistics, and recent activities.

**Authorization:**
- Requires valid JWT token
- Requires SUPER_ADMIN role
- Super Admin account must be active

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- None (dashboard shows current state)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_hospitals": 45,
      "active_hospitals": 38,
      "inactive_hospitals": 5,
      "pending_hospitals": 2,
      "deleted_hospitals": 3,
      "total_revenue_monthly": 1850000.00,
      "subscriptions_expiring_soon": 8,
      "new_hospitals_this_month": 3
    },
    "revenue_breakdown": {
      "by_plan": {
        "basic": 450000.00,
        "standard": 720000.00,
        "premium": 680000.00
      },
      "by_billing_cycle": {
        "monthly": 850000.00,
        "annual": 1000000.00
      }
    },
    "subscription_summary": {
      "active_subscriptions": 38,
      "expired_subscriptions": 5,
      "trial_subscriptions": 2,
      "cancelled_subscriptions": 0
    }
  }
}
```


**HTTP Status Codes:**
- `200 OK`: Success
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin
- `500 Internal Server Error`: Server error

---

### **API ENDPOINT: GET HOSPITAL-WISE STATISTICS**

**HTTP Method:** `GET`

**URL Path:** `/api/platform/admin/dashboard/hospitals`

**Purpose:** Retrieve detailed statistics for all hospitals in tabular format with sorting, filtering, and pagination.

**Authorization:**
- Requires valid JWT token
- Requires SUPER_ADMIN role

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)
- `status`: Filter by hospital status (PENDING, ACTIVE, INACTIVE)
- `subscription_status`: Filter by subscription status (ACTIVE, EXPIRED, TRIAL)
- `city`: Filter by city
- `state`: Filter by state
- `plan_id`: Filter by subscription plan
- `search`: Search in hospital name, code, email
- `sort_by`: Sort field (name, status, end_date, monthly_price, created_at)
- `sort_order`: Sort direction (ASC, DESC)

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
        "city": "Hyderabad",
        "state": "Telangana",
        "status": "ACTIVE",
        "subscription": {
          "plan_name": "Premium Plan",
          "subscription_status": "ACTIVE",
          "end_date": "2024-12-31",
          "days_until_expiry": 180,
          "monthly_price": 50000.00,
          "billing_cycle": "ANNUAL"
        },
        "enabled_modules_count": 4,
        "created_at": "2024-01-15T10:30:00Z",
        "activated_at": "2024-01-16T09:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_items": 45,
      "total_pages": 3
    }
  }
}
```


**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin
- `500 Internal Server Error`: Server error

---

### **API ENDPOINT: GET RECENT ACTIVITIES**

**HTTP Method:** `GET`

**URL Path:** `/api/platform/admin/dashboard/activities`

**Purpose:** Retrieve recent Super Admin actions from audit logs.

**Authorization:**
- Requires valid JWT token
- Requires SUPER_ADMIN role

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)
- `action_type`: Filter by action type
- `hospital_id`: Filter by hospital
- `super_admin_id`: Filter by Super Admin
- `date_from`: Filter from date (YYYY-MM-DD)
- `date_to`: Filter to date (YYYY-MM-DD)
- `action_status`: Filter by status (SUCCESS, FAILED)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": 125,
        "action_type": "HOSPITAL_ACTIVATED",
        "action_status": "SUCCESS",
        "hospital": {
          "id": 1,
          "hospital_code": "HSP-001",
          "name": "Apollo Hospitals"
        },
        "performed_by": {
          "id": 1,
          "name": "Super Admin",
          "email": "admin@platform.com"
        },
        "timestamp": "2024-01-20T10:30:00Z",
        "description": "Hospital activated successfully",
        "ip_address": "192.168.1.1"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_items": 150
    }
  }
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin
- `500 Internal Server Error`: Server error

---


# PART B: REPORTS

## 1. REPORT: REVENUE BY HOSPITAL

### **Report Purpose**
Provide detailed revenue breakdown by hospital to analyze subscription revenue distribution and identify top revenue-generating hospitals.

### **Data Sources**
- `hospitals` table (hospital metadata)
- `hospital_subscriptions` table (subscription details and pricing)
- `subscription_plans` table (plan names)

### **Report Metrics**
- Hospital name and code
- Current subscription plan
- Monthly subscription price
- Annual subscription value (monthly_price × 12)
- Subscription start and end dates
- Payment status
- Total revenue contributed (historical)

### **Filters Available**
- **Date Range:** Filter by subscription start date or end date
- **Hospital Status:** Filter by ACTIVE, INACTIVE, PENDING
- **Subscription Status:** Filter by ACTIVE, EXPIRED, TRIAL, CANCELLED
- **Subscription Plan:** Filter by plan (Basic, Standard, Premium)
- **City/State:** Filter by location
- **Billing Cycle:** Filter by MONTHLY or ANNUAL

### **Soft-Deleted Hospitals Handling**
- **Excluded by default** from revenue reports
- Option to include deleted hospitals with `include_deleted=true` parameter
- Deleted hospitals clearly marked in report
- Deleted hospitals' revenue counted up to deletion date

### **Output Structure**
- List of hospitals with revenue details
- Sorted by revenue (highest to lowest) by default
- Subtotals by subscription plan
- Grand total revenue
- Average revenue per hospital
- Revenue trend (month-over-month)


### **API ENDPOINT: GET REVENUE BY HOSPITAL REPORT**

**HTTP Method:** `GET`

**URL Path:** `/api/platform/admin/reports/revenue-by-hospital`

**Purpose:** Generate revenue report showing subscription revenue breakdown by hospital.

**Authorization:**
- Requires valid JWT token
- Requires SUPER_ADMIN role

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `date_from`: Start date (YYYY-MM-DD, optional)
- `date_to`: End date (YYYY-MM-DD, optional)
- `status`: Hospital status filter (optional)
- `subscription_status`: Subscription status filter (optional)
- `plan_id`: Subscription plan filter (optional)
- `city`: City filter (optional)
- `state`: State filter (optional)
- `billing_cycle`: Billing cycle filter (MONTHLY, ANNUAL, optional)
- `include_deleted`: Include deleted hospitals (true/false, default: false)
- `sort_by`: Sort field (revenue, name, end_date, default: revenue)
- `sort_order`: Sort direction (ASC, DESC, default: DESC)
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "report_metadata": {
      "report_name": "Revenue by Hospital",
      "generated_at": "2024-01-20T15:00:00Z",
      "date_range": {
        "from": "2024-01-01",
        "to": "2024-12-31"
      },
      "filters_applied": {
        "status": "ACTIVE",
        "subscription_status": "ACTIVE"
      }
    },
    "hospitals": [
      {
        "hospital_id": 1,
        "hospital_code": "HSP-001",
        "hospital_name": "Apollo Hospitals",
        "city": "Hyderabad",
        "state": "Telangana",
        "status": "ACTIVE",
        "subscription": {
          "plan_name": "Premium Plan",
          "subscription_status": "ACTIVE",
          "start_date": "2024-01-16",
          "end_date": "2024-12-31",
          "monthly_price": 50000.00,
          "annual_value": 600000.00,
          "billing_cycle": "ANNUAL",
          "payment_status": "PAID"
        },
        "total_revenue_contributed": 600000.00
      }
    ],
    "summary": {
      "total_hospitals": 38,
      "total_monthly_revenue": 1850000.00,
      "total_annual_value": 22200000.00,
      "average_revenue_per_hospital": 48684.21,
      "revenue_by_plan": {
        "basic": 450000.00,
        "standard": 720000.00,
        "premium": 680000.00
      }
    },
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_items": 38
    }
  }
}
```


**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin
- `500 Internal Server Error`: Server error

---

## 2. REPORT: SUBSCRIPTION RENEWALS DUE

### **Report Purpose**
Identify hospitals with subscriptions expiring soon to proactively manage renewals and prevent service interruptions.

### **Data Sources**
- `hospitals` table (hospital metadata)
- `hospital_subscriptions` table (subscription details and expiry dates)
- `subscription_plans` table (plan names)

### **Report Metrics**
- Hospital name and code
- Current subscription plan
- Subscription end date
- Days until expiry
- Monthly subscription price
- Auto-renew status
- Contact information (email, phone)
- Last renewal date

### **Filters Available**
- **Days Until Expiry:** Filter by days (e.g., 7, 15, 30, 60, 90 days)
- **Hospital Status:** Filter by ACTIVE, INACTIVE
- **Subscription Plan:** Filter by plan
- **Auto-Renew Status:** Filter by auto-renew enabled/disabled
- **City/State:** Filter by location

### **Soft-Deleted Hospitals Handling**
- **Excluded completely** from renewal reports
- Deleted hospitals do not need renewals
- Subscriptions are cancelled upon deletion

### **Output Structure**
- List of hospitals with expiring subscriptions
- Sorted by expiry date (soonest first)
- Grouped by urgency (7 days, 15 days, 30 days, 60+ days)
- Highlight hospitals without auto-renew
- Total count by urgency level


### **API ENDPOINT: GET SUBSCRIPTION RENEWALS DUE REPORT**

**HTTP Method:** `GET`

**URL Path:** `/api/platform/admin/reports/renewals-due`

**Purpose:** Generate report of hospitals with subscriptions expiring soon.

**Authorization:**
- Requires valid JWT token
- Requires SUPER_ADMIN role

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `days_until_expiry`: Days threshold (default: 30, options: 7, 15, 30, 60, 90)
- `status`: Hospital status filter (optional)
- `plan_id`: Subscription plan filter (optional)
- `auto_renew`: Filter by auto-renew status (true/false, optional)
- `city`: City filter (optional)
- `state`: State filter (optional)
- `sort_by`: Sort field (end_date, days_until_expiry, monthly_price, default: end_date)
- `sort_order`: Sort direction (ASC, DESC, default: ASC)
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "report_metadata": {
      "report_name": "Subscription Renewals Due",
      "generated_at": "2024-01-20T15:00:00Z",
      "days_threshold": 30
    },
    "renewals": [
      {
        "hospital_id": 5,
        "hospital_code": "HSP-005",
        "hospital_name": "Max Healthcare",
        "city": "Delhi",
        "state": "Delhi",
        "status": "ACTIVE",
        "contact": {
          "email": "admin@max-delhi.com",
          "phone": "+91 11 2345 6789"
        },
        "subscription": {
          "plan_name": "Premium Plan",
          "end_date": "2024-02-05",
          "days_until_expiry": 15,
          "monthly_price": 50000.00,
          "auto_renew": false,
          "last_renewal_date": "2023-02-05"
        },
        "urgency": "HIGH"
      }
    ],
    "summary": {
      "total_renewals_due": 8,
      "by_urgency": {
        "critical": 2,
        "high": 3,
        "medium": 3
      },
      "auto_renew_enabled": 3,
      "auto_renew_disabled": 5,
      "potential_revenue_at_risk": 400000.00
    },
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_items": 8
    }
  }
}
```


**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin
- `500 Internal Server Error`: Server error

---

## 3. REPORT: SYSTEM USAGE STATISTICS

### **Report Purpose**
Provide insights into platform adoption and usage patterns across hospitals, including module usage, subscription distribution, and growth trends.

### **Data Sources**
- `hospitals` table (hospital counts and status)
- `hospital_subscriptions` table (subscription distribution)
- `hospital_modules` table (module usage)
- `subscription_plans` table (plan distribution)
- `platform_activity_summary` table (historical trends)

### **Report Metrics**

#### **Hospital Statistics**
- Total hospitals by status (PENDING, ACTIVE, INACTIVE)
- Hospitals by city/state distribution
- Growth rate (new hospitals per month)
- Churn rate (deleted hospitals per month)

#### **Subscription Statistics**
- Subscription distribution by plan (Basic, Standard, Premium)
- Subscription distribution by billing cycle (Monthly, Annual)
- Average subscription duration
- Renewal rate
- Cancellation rate

#### **Module Usage Statistics**
- Module adoption rate (% of hospitals using each module)
- Most popular modules
- Least popular modules
- Average modules per hospital
- Module combinations (which modules are used together)

#### **Revenue Statistics**
- Total MRR (Monthly Recurring Revenue)
- MRR growth rate
- Average revenue per hospital
- Revenue by plan
- Revenue by region


### **Filters Available**
- **Date Range:** Filter by time period (last 7 days, 30 days, 90 days, 1 year, custom)
- **Hospital Status:** Filter by ACTIVE, INACTIVE, PENDING
- **Subscription Plan:** Filter by plan
- **City/State:** Filter by location
- **Module:** Filter by specific module usage

### **Soft-Deleted Hospitals Handling**
- **Excluded from current statistics**
- **Included in historical trends** up to deletion date
- Churn rate includes deleted hospitals
- Deleted hospitals counted in "Hospitals Lost" metric

### **Output Structure**
- Summary statistics (totals and averages)
- Trend charts data (time series)
- Distribution breakdowns (by plan, module, location)
- Growth metrics (month-over-month, year-over-year)
- Comparison with previous period

### **API ENDPOINT: GET SYSTEM USAGE STATISTICS REPORT**

**HTTP Method:** `GET`

**URL Path:** `/api/platform/admin/reports/system-usage`

**Purpose:** Generate comprehensive system usage statistics report.

**Authorization:**
- Requires valid JWT token
- Requires SUPER_ADMIN role

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `date_from`: Start date (YYYY-MM-DD, optional)
- `date_to`: End date (YYYY-MM-DD, optional)
- `period`: Predefined period (7d, 30d, 90d, 1y, optional)
- `status`: Hospital status filter (optional)
- `plan_id`: Subscription plan filter (optional)
- `city`: City filter (optional)
- `state`: State filter (optional)
- `module_code`: Module filter (optional)


**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "report_metadata": {
      "report_name": "System Usage Statistics",
      "generated_at": "2024-01-20T15:00:00Z",
      "date_range": {
        "from": "2024-01-01",
        "to": "2024-01-20"
      }
    },
    "hospital_statistics": {
      "total_hospitals": 45,
      "active_hospitals": 38,
      "inactive_hospitals": 5,
      "pending_hospitals": 2,
      "new_hospitals_this_period": 5,
      "deleted_hospitals_this_period": 1,
      "growth_rate": 11.11,
      "churn_rate": 2.22,
      "by_location": {
        "Hyderabad": 12,
        "Mumbai": 10,
        "Delhi": 8,
        "Bangalore": 7,
        "Others": 8
      }
    },
    "subscription_statistics": {
      "total_active_subscriptions": 38,
      "by_plan": {
        "basic": 10,
        "standard": 15,
        "premium": 13
      },
      "by_billing_cycle": {
        "monthly": 18,
        "annual": 20
      },
      "average_subscription_duration_days": 245,
      "renewal_rate": 85.5,
      "cancellation_rate": 5.2
    },
    "module_usage_statistics": {
      "total_modules_enabled": 152,
      "average_modules_per_hospital": 4.0,
      "by_module": {
        "OP": {
          "hospitals_using": 38,
          "adoption_rate": 100.0
        },
        "LAB": {
          "hospitals_using": 35,
          "adoption_rate": 92.1
        },
        "PHARMACY": {
          "hospitals_using": 28,
          "adoption_rate": 73.7
        },
        "BILLING": {
          "hospitals_using": 38,
          "adoption_rate": 100.0
        },
        "IPD": {
          "hospitals_using": 13,
          "adoption_rate": 34.2
        }
      },
      "most_popular_combination": ["OP", "LAB", "BILLING", "PHARMACY"]
    },
    "revenue_statistics": {
      "total_mrr": 1850000.00,
      "mrr_growth_rate": 8.5,
      "average_revenue_per_hospital": 48684.21,
      "by_plan": {
        "basic": 450000.00,
        "standard": 720000.00,
        "premium": 680000.00
      },
      "by_region": {
        "Telangana": 550000.00,
        "Maharashtra": 480000.00,
        "Delhi": 420000.00,
        "Karnataka": 400000.00
      }
    },
    "trends": {
      "hospitals_over_time": [
        {
          "month": "2023-10",
          "total": 35,
          "active": 30,
          "new": 2
        },
        {
          "month": "2023-11",
          "total": 38,
          "active": 33,
          "new": 3
        },
        {
          "month": "2023-12",
          "total": 42,
          "active": 36,
          "new": 4
        },
        {
          "month": "2024-01",
          "total": 45,
          "active": 38,
          "new": 3
        }
      ],
      "revenue_over_time": [
        {
          "month": "2023-10",
          "mrr": 1500000.00
        },
        {
          "month": "2023-11",
          "mrr": 1650000.00
        },
        {
          "month": "2023-12",
          "mrr": 1750000.00
        },
        {
          "month": "2024-01",
          "mrr": 1850000.00
        }
      ]
    }
  }
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: Not Super Admin
- `500 Internal Server Error`: Server error

---


## SUMMARY OF DASHBOARD AND REPORTS

### **Dashboard Features**
1. **Overview Metrics:** Total hospitals, active/inactive counts, revenue, expiring subscriptions
2. **Hospital-Wise Statistics:** Detailed table with sorting, filtering, pagination
3. **Recent Activities:** Audit trail of Super Admin actions
4. **Revenue Breakdown:** By plan and billing cycle
5. **Subscription Summary:** Active, expired, trial counts

### **Report Features**
1. **Revenue by Hospital:** Detailed revenue breakdown with filters
2. **Subscription Renewals Due:** Proactive renewal management
3. **System Usage Statistics:** Comprehensive platform analytics

### **Key Principles**
- **Platform-Level Only:** No hospital operational data
- **Read-Only:** Reports do not modify data
- **Super Admin Only:** Requires SUPER_ADMIN role
- **Soft-Delete Handling:** Excluded by default, optional inclusion
- **Subscription Revenue:** Only subscription fees, not hospital operational revenue
- **Audit Trail:** All actions logged for compliance

### **API Endpoints Summary**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/platform/admin/dashboard` | GET | Get dashboard overview |
| `/api/platform/admin/dashboard/hospitals` | GET | Get hospital-wise statistics |
| `/api/platform/admin/dashboard/activities` | GET | Get recent activities |
| `/api/platform/admin/reports/revenue-by-hospital` | GET | Revenue report |
| `/api/platform/admin/reports/renewals-due` | GET | Renewals report |
| `/api/platform/admin/reports/system-usage` | GET | Usage statistics report |

### **Data Exclusions**
- Patient data
- Appointment data
- Lab test data
- Prescription data
- Hospital operational revenue
- Staff information
- Clinical data
- Hospital-internal transactions

### **Authorization**
- All endpoints require valid JWT token
- All endpoints require SUPER_ADMIN role
- All endpoints require active Super Admin account
- Backend enforces authorization (UI cannot bypass)

---

**End of Dashboard and Reports Specification**
