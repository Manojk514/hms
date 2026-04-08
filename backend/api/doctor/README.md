# Doctor Profile API Documentation

## Table of Contents
1. [Get Doctor Profile](#get-doctor-profile)
2. [Update Doctor Profile](#update-doctor-profile)

---

## Get Doctor Profile

Fetch doctor profile details by doctor code.

### Endpoint
```
GET /backend/api/doctor/get_profile.php
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| doctor_code | string | Yes | Unique doctor code (e.g., DOC001) |

### Request Example

```
GET /backend/api/doctor/get_profile.php?doctor_code=DOC001
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "doctor_code": "DOC001",
    "doctor_name": "Dr. John Smith",
    "specialization_id": 5,
    "qualification": "MBBS, MD",
    "experience": 10,
    "license_number": "MED12345",
    "email": "john.smith@hospital.com",
    "phone": "9876543210",
    "address": "123 Medical Street, City"
  }
}
```

### Error Responses

#### Missing Parameter (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "MISSING_PARAMETER",
    "message": "doctor_code parameter is required"
  }
}
```

#### Doctor Not Found (404 Not Found)
```json
{
  "success": false,
  "error": {
    "code": "DOCTOR_NOT_FOUND",
    "message": "Doctor with code DOC001 not found"
  }
}
```

#### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "An error occurred while fetching doctor profile"
  }
}
```

## Usage Examples

### JavaScript (Fetch API)
```javascript
async function getDoctorProfile(doctorCode) {
  try {
    const response = await fetch(
      `http://localhost/HMS/backend/api/doctor/get_profile.php?doctor_code=${doctorCode}`
    );
    const data = await response.json();
    
    if (data.success) {
      console.log('Doctor:', data.data);
      return data.data;
    } else {
      console.error('Error:', data.error.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}

// Usage
getDoctorProfile('DOC001');
```

### jQuery
```javascript
$.ajax({
  url: 'http://localhost/HMS/backend/api/doctor/get_profile.php',
  method: 'GET',
  data: { doctor_code: 'DOC001' },
  success: function(response) {
    if (response.success) {
      console.log('Doctor:', response.data);
    } else {
      console.error('Error:', response.error.message);
    }
  },
  error: function(xhr, status, error) {
    console.error('Request failed:', error);
  }
});
```

### PHP (cURL)
```php
<?php
$doctorCode = 'DOC001';
$url = "http://localhost/HMS/backend/api/doctor/get_profile.php?doctor_code=" . urlencode($doctorCode);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if ($data['success']) {
    print_r($data['data']);
} else {
    echo "Error: " . $data['error']['message'];
}
?>
```

## Testing

1. **Using Browser:**
   - Open: `http://localhost/HMS/backend/api/doctor/test_get_profile.html`
   - Enter doctor code and click "Fetch Profile"

2. **Using cURL:**
   ```bash
   curl "http://localhost/HMS/backend/api/doctor/get_profile.php?doctor_code=DOC001"
   ```

3. **Using Postman:**
   - Method: GET
   - URL: `http://localhost/HMS/backend/api/doctor/get_profile.php`
   - Params: `doctor_code = DOC001`

## Security Features

- ✅ Prepared statements to prevent SQL injection
- ✅ Input validation and sanitization
- ✅ Error logging without exposing sensitive data
- ✅ CORS headers for cross-origin requests
- ✅ Proper HTTP status codes

## Database Schema

```sql
CREATE TABLE doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_code VARCHAR(50) UNIQUE NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    specialization_id INT,
    qualification VARCHAR(255),
    experience INT,
    license_number VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT
);
```

## Notes

- The API uses prepared statements for security
- All responses are in JSON format
- CORS is enabled for cross-origin requests
- Errors are logged to PHP error log
- Connection is automatically closed after response


---

## Update Doctor Profile

Update doctor profile information by doctor code.

### Endpoint
```
POST /backend/api/doctor/update_profile.php
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| doctor_code | string | Yes | Unique doctor code (e.g., DOC001) |
| doctor_name | string | No | Doctor's full name |
| qualification | string | No | Educational qualifications |
| experience | integer | No | Years of experience (must be >= 0) |
| license_number | string | No | Medical license number |
| email | string | No | Email address (must be valid format) |
| phone | string | No | Phone number (10-15 digits) |
| address | string | No | Full address |

**Note:** At least one field (besides doctor_code) must be provided for update.

### Request Example

```json
{
  "doctor_code": "DOC001",
  "doctor_name": "Dr. John Smith",
  "qualification": "MBBS, MD, DM",
  "experience": 12,
  "email": "john.smith@hospital.com",
  "phone": "9876543210"
}
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Doctor profile updated successfully",
  "updated_fields": 5
}
```

### Error Responses

#### Missing Required Field (400 Bad Request)
```json
{
  "status": "error",
  "message": "doctor_code is required"
}
```

#### No Fields to Update (400 Bad Request)
```json
{
  "status": "error",
  "message": "No fields to update. Provide at least one field to update."
}
```

#### Invalid Email Format (400 Bad Request)
```json
{
  "status": "error",
  "message": "Invalid email format"
}
```

#### Invalid Phone Format (400 Bad Request)
```json
{
  "status": "error",
  "message": "Invalid phone number format"
}
```

#### Invalid Experience (400 Bad Request)
```json
{
  "status": "error",
  "message": "Experience must be a positive number"
}
```

#### Doctor Not Found (404 Not Found)
```json
{
  "status": "error",
  "message": "Doctor with code DOC001 not found"
}
```

#### Method Not Allowed (405)
```json
{
  "status": "error",
  "message": "Method not allowed. Use POST request."
}
```

#### Server Error (500 Internal Server Error)
```json
{
  "status": "error",
  "message": "An error occurred while updating doctor profile"
}
```

## Usage Examples

### JavaScript (Fetch API)
```javascript
async function updateDoctorProfile(doctorCode, updates) {
  try {
    const response = await fetch(
      'http://localhost/HMS/backend/api/doctor/update_profile.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctor_code: doctorCode,
          ...updates
        })
      }
    );
    
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('Success:', data.message);
      return true;
    } else {
      console.error('Error:', data.message);
      return false;
    }
  } catch (error) {
    console.error('Network error:', error);
    return false;
  }
}

// Usage
updateDoctorProfile('DOC001', {
  doctor_name: 'Dr. John Smith',
  experience: 12,
  email: 'john.smith@hospital.com'
});
```

### jQuery
```javascript
$.ajax({
  url: 'http://localhost/HMS/backend/api/doctor/update_profile.php',
  method: 'POST',
  contentType: 'application/json',
  data: JSON.stringify({
    doctor_code: 'DOC001',
    doctor_name: 'Dr. John Smith',
    qualification: 'MBBS, MD',
    experience: 12
  }),
  success: function(response) {
    if (response.status === 'success') {
      alert(response.message);
    } else {
      alert('Error: ' + response.message);
    }
  },
  error: function(xhr, status, error) {
    alert('Request failed: ' + error);
  }
});
```

### PHP (cURL)
```php
<?php
$updateData = [
    'doctor_code' => 'DOC001',
    'doctor_name' => 'Dr. John Smith',
    'qualification' => 'MBBS, MD',
    'experience' => 12,
    'email' => 'john.smith@hospital.com'
];

$ch = curl_init('http://localhost/HMS/backend/api/doctor/update_profile.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if ($data['status'] === 'success') {
    echo "Success: " . $data['message'];
} else {
    echo "Error: " . $data['message'];
}
?>
```

## Testing

1. **Using Browser Test Page:**
   - Open: `http://localhost/HMS/backend/api/doctor/test_update_profile.html`
   - Enter doctor code and click "Load Current Profile"
   - Modify fields and click "Update Profile"

2. **Using cURL:**
   ```bash
   curl -X POST http://localhost/HMS/backend/api/doctor/update_profile.php \
     -H "Content-Type: application/json" \
     -d '{
       "doctor_code": "DOC001",
       "doctor_name": "Dr. John Smith",
       "experience": 12
     }'
   ```

3. **Using Postman:**
   - Method: POST
   - URL: `http://localhost/HMS/backend/api/doctor/update_profile.php`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "doctor_code": "DOC001",
       "doctor_name": "Dr. John Smith",
       "experience": 12
     }
     ```

## Validation Rules

### Email
- Must be a valid email format
- Example: `doctor@hospital.com`

### Phone
- Must be 10-15 characters
- Can contain: digits, +, -, spaces, parentheses
- Example: `9876543210` or `+91-98765-43210`

### Experience
- Must be a positive integer (>= 0)
- Example: `10`

### Doctor Code
- Required for all operations
- Must exist in database
- Case-sensitive

## Security Features

- ✅ Prepared statements to prevent SQL injection
- ✅ Input validation for all fields
- ✅ Email format validation
- ✅ Phone number format validation
- ✅ Experience range validation
- ✅ Dynamic field updates (only provided fields are updated)
- ✅ Doctor existence check before update
- ✅ Error logging without exposing sensitive data
- ✅ CORS headers for cross-origin requests
- ✅ Proper HTTP status codes

## Complete Workflow Example

```javascript
// 1. Load current profile
const response = await fetch('get_profile.php?doctor_code=DOC001');
const profile = await response.json();

// 2. Display in form
document.getElementById('name').value = profile.data.doctor_name;
document.getElementById('email').value = profile.data.email;

// 3. User modifies fields

// 4. Update profile
const updateResponse = await fetch('update_profile.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    doctor_code: 'DOC001',
    doctor_name: document.getElementById('name').value,
    email: document.getElementById('email').value
  })
});

const result = await updateResponse.json();
console.log(result.message);
```

## API Files

- `get_profile.php` - Fetch doctor profile
- `update_profile.php` - Update doctor profile
- `test_get_profile.html` - Test page for GET API
- `test_update_profile.html` - Test page for UPDATE API
- `README.md` - This documentation


---

## Doctor Login

Authenticate doctor and create session.

### Endpoint
```
POST /backend/api/doctor/login.php
```

### Request Body (JSON)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Doctor's email address |
| password | string | Yes | Doctor's password |

### Request Example

```json
{
  "email": "doctor@hospital.com",
  "password": "password123"
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "doctor_id": 1,
    "doctor_code": "DOC001",
    "doctor_name": "Dr. John Smith",
    "email": "doctor@hospital.com",
    "session_id": "abc123xyz"
  }
}
```

### Error Responses

#### Missing Fields (400 Bad Request)
```json
{
  "success": false,
  "message": "Email is required"
}
```

#### Invalid Credentials (401 Unauthorized)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

#### Account Inactive (403 Forbidden)
```json
{
  "success": false,
  "message": "Your account is inactive. Please contact administrator."
}
```

## Doctor Logout

Destroy session and logout doctor.

### Endpoint
```
POST /backend/api/doctor/logout.php
```

### Request
No request body required. Session is automatically detected.

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Logout successful",
  "data": {
    "logged_out_user": "Dr. John Smith"
  }
}
```

### Error Responses

#### No Active Session (401 Unauthorized)
```json
{
  "success": false,
  "message": "No active session found"
}
```

## Check Session

Verify if doctor is logged in and get session data.

### Endpoint
```
GET /backend/api/doctor/check_session.php
```

### Success Response (200 OK)

```json
{
  "success": true,
  "logged_in": true,
  "data": {
    "doctor_id": 1,
    "doctor_code": "DOC001",
    "doctor_name": "Dr. John Smith",
    "doctor_email": "doctor@hospital.com",
    "session_duration": 1234
  }
}
```

### Error Responses

#### Not Logged In (401 Unauthorized)
```json
{
  "success": false,
  "logged_in": false,
  "message": "Not logged in"
}
```

#### Session Expired (401 Unauthorized)
```json
{
  "success": false,
  "logged_in": false,
  "message": "Session expired. Please login again."
}
```

## Login System Usage Examples

### JavaScript Login Flow
```javascript
// Login
async function login(email, password) {
  try {
    const response = await fetch('http://localhost/HMS/backend/api/doctor/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Important for session cookies
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store doctor info in localStorage
      localStorage.setItem('doctorCode', data.data.doctor_code);
      localStorage.setItem('doctorName', data.data.doctor_name);
      
      // Redirect to dashboard
      window.location.href = 'doctor_dashboard.html';
    } else {
      alert('Login failed: ' + data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}

// Check Session
async function checkSession() {
  try {
    const response = await fetch('http://localhost/HMS/backend/api/doctor/check_session.php', {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!data.logged_in) {
      // Redirect to login page
      window.location.href = 'doctor_portal.html';
    }
    
    return data.logged_in;
  } catch (error) {
    console.error('Session check error:', error);
    return false;
  }
}

// Logout
async function logout() {
  try {
    const response = await fetch('http://localhost/HMS/backend/api/doctor/logout.php', {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Clear localStorage
      localStorage.clear();
      
      // Redirect to login page
      window.location.href = 'doctor_portal.html';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Protect pages - Add to every protected page
window.addEventListener('load', async () => {
  const isLoggedIn = await checkSession();
  if (!isLoggedIn) {
    window.location.href = 'doctor_portal.html';
  }
});
```

## Session Management

### Session Variables Stored
- `doctor_logged_in` - Boolean flag
- `doctor_id` - Doctor's database ID
- `doctor_code` - Doctor's unique code
- `doctor_name` - Doctor's full name
- `doctor_email` - Doctor's email
- `login_time` - Timestamp of login

### Session Timeout
- Default: 2 hours (7200 seconds)
- Configurable in `check_session.php`

### Security Features
- ✅ Password verification (supports both hashed and plain text)
- ✅ Email validation
- ✅ Account status check
- ✅ Session timeout
- ✅ Prepared statements prevent SQL injection
- ✅ Secure session management
- ✅ CORS support with credentials

## Testing

1. **Using Test Page:**
   - Open: `http://localhost/HMS/backend/api/doctor/test_login.html`
   - Enter credentials
   - Test login, session check, and logout

2. **Using cURL:**
   ```bash
   # Login
   curl -X POST http://localhost/HMS/backend/api/doctor/login.php \
     -H "Content-Type: application/json" \
     -d '{"email":"doctor@hospital.com","password":"password123"}' \
     -c cookies.txt
   
   # Check Session
   curl http://localhost/HMS/backend/api/doctor/check_session.php \
     -b cookies.txt
   
   # Logout
   curl -X POST http://localhost/HMS/backend/api/doctor/logout.php \
     -b cookies.txt
   ```

## Database Requirements

### Doctors Table
```sql
CREATE TABLE doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_code VARCHAR(50) UNIQUE NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    specialization_id INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Password Storage
- Supports both hashed (bcrypt) and plain text passwords
- Recommended: Use `password_hash()` for new passwords
- Example:
  ```php
  $hashedPassword = password_hash('password123', PASSWORD_DEFAULT);
  ```

## API Files

- `login.php` - Doctor login endpoint
- `logout.php` - Doctor logout endpoint
- `check_session.php` - Session verification endpoint
- `get_profile.php` - Fetch doctor profile
- `update_profile.php` - Update doctor profile
- `test_login.html` - Test page for login system
- `test_get_profile.html` - Test page for GET API
- `test_update_profile.html` - Test page for UPDATE API
- `README.md` - This documentation


---

## 6. Dashboard Statistics API

**Endpoint:** `GET /backend/api/doctor/dashboard.php`

**Description:** Fetches dashboard statistics for a doctor including appointments, consultations, followups, and patient counts.

### Request Parameters

**Method:** GET

**Parameters:**
- `doctor_code` (optional) - Doctor's unique code (e.g., "DOC001")
  - If not provided, uses doctor_code from session

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "doctor_code": "DOC001",
    "doctor_name": "Dr. Manoj Kunachi",
    "statistics": {
      "todayAppointments": 8,
      "completedConsultations": 2,
      "pendingFollowups": 2,
      "totalPatients": 156
    }
  }
}
```

**Error Response (400/404/500):**
```json
{
  "success": false,
  "message": "Error description"
}
```

### Statistics Explained

1. **todayAppointments**: Count of appointments scheduled for today for this doctor
2. **completedConsultations**: Total number of consultations completed by this doctor
3. **pendingFollowups**: Count of upcoming followups (today or future) for this doctor's patients
4. **totalPatients**: Total unique patients assigned to this doctor

### Database Queries

```sql
-- Today's Appointments
SELECT COUNT(*) FROM appointment 
WHERE doctor_id = ? AND appointment_date = CURDATE()

-- Completed Consultations
SELECT COUNT(*) FROM consultations 
WHERE doctor_id = ?

-- Pending Followups
SELECT COUNT(*) FROM followups f
INNER JOIN consultations c ON f.consultation_id = c.id
WHERE c.doctor_id = ? AND f.followup_date >= CURDATE()

-- Total Assigned Patients
SELECT COUNT(DISTINCT patient_id) FROM appointment 
WHERE doctor_id = ?
```

### Usage Examples

**Using JavaScript Fetch:**
```javascript
// With doctor_code parameter
fetch('http://localhost/HMS/backend/api/doctor/dashboard.php?doctor_code=DOC001', {
  method: 'GET',
  credentials: 'include'
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Today Appointments:', data.data.statistics.todayAppointments);
    console.log('Total Patients:', data.data.statistics.totalPatients);
  }
});

// Using session (after login)
fetch('http://localhost/HMS/backend/api/doctor/dashboard.php', {
  method: 'GET',
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log(data));
```

**Using cURL:**
```bash
# With doctor_code parameter
curl "http://localhost/HMS/backend/api/doctor/dashboard.php?doctor_code=DOC001"

# Using session cookie
curl -b cookies.txt "http://localhost/HMS/backend/api/doctor/dashboard.php"
```

### Testing

Open the test page in your browser:
```
http://localhost/HMS/backend/api/doctor/test_dashboard.html
```

### Error Handling

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Dashboard data retrieved |
| 400 | Bad Request - Missing doctor_code |
| 404 | Not Found - Doctor not found |
| 405 | Method Not Allowed - Use GET only |
| 500 | Internal Server Error - Database error |

### Security Features

- ✅ Prepared statements to prevent SQL injection
- ✅ Session validation support
- ✅ Input sanitization
- ✅ Error logging without exposing sensitive data
- ✅ CORS headers for cross-origin requests

### Notes

- The API accepts doctor_code from either GET parameter or session
- Session takes precedence if both are provided
- All counts are returned as integers
- Followups query joins with consultations table to filter by doctor
- Uses CURDATE() for date comparisons to ensure timezone consistency


---

## 7. Today's Appointment Schedule API

**Endpoint:** `GET /backend/api/doctor/today_schedule.php`

**Description:** Fetches today's appointment schedule for a doctor with patient details, ordered by appointment time.

### Request Parameters

**Method:** GET

**Parameters:**
- `doctor_id` (required) - Doctor's database ID (integer)
  - Can also use doctor_id from session if logged in

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "doctor_id": 1,
    "date": "2026-03-10",
    "count": 3,
    "appointments": [
      {
        "id": 1,
        "time": "09:00 AM",
        "patient": "Rajesh Kumar",
        "age": 45,
        "gender": "Male",
        "phone": "9876543210",
        "complaint": "Chest pain",
        "status": "PENDING"
      },
      {
        "id": 2,
        "time": "10:30 AM",
        "patient": "Priya Sharma",
        "age": 32,
        "gender": "Female",
        "phone": "9876543211",
        "complaint": "Fever and headache",
        "status": "IN_PROGRESS"
      }
    ]
  }
}
```

**Empty Schedule Response (200):**
```json
{
  "success": true,
  "data": {
    "doctor_id": 1,
    "date": "2026-03-10",
    "count": 0,
    "appointments": []
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "message": "Error description"
}
```

### Appointment Object Fields

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Appointment ID |
| time | string | Appointment time in 12-hour format (e.g., "09:00 AM") |
| patient | string | Patient's full name |
| age | integer | Patient's age in years |
| gender | string | Patient's gender |
| phone | string | Patient's contact number |
| complaint | string | Chief complaint/reason for visit |
| status | string | Appointment status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED) |

### Database Query

```sql
SELECT 
    a.id,
    a.appointment_time,
    a.status,
    p.patient_name,
    p.gender,
    p.age,
    p.patient_phone,
    a.chief_complaint
FROM appointment a
JOIN tblpatient p ON a.patient_id = p.id
WHERE a.doctor_id = ?
AND a.appointment_date = CURDATE()
ORDER BY a.appointment_time ASC
```

### Usage Examples

**Using JavaScript Fetch:**
```javascript
// Fetch today's schedule
fetch('http://localhost/HMS/backend/api/doctor/today_schedule.php?doctor_id=1', {
  method: 'GET',
  credentials: 'include'
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log(`${data.data.count} appointments today`);
    data.data.appointments.forEach(apt => {
      console.log(`${apt.time} - ${apt.patient}: ${apt.complaint}`);
    });
  }
});
```

**Using cURL:**
```bash
curl "http://localhost/HMS/backend/api/doctor/today_schedule.php?doctor_id=1"
```

### Testing

Open the test page in your browser:
```
http://localhost/HMS/backend/api/doctor/test_today_schedule.html
```

The test page features:
- Beautiful card-based UI for each appointment
- Color-coded status badges
- Empty state handling
- Real-time API testing

### Error Handling

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Schedule retrieved (may be empty) |
| 400 | Bad Request - Missing doctor_id |
| 405 | Method Not Allowed - Use GET only |
| 500 | Internal Server Error - Database error |

### Security Features

- ✅ Prepared statements to prevent SQL injection
- ✅ Session validation support
- ✅ Input sanitization and type casting
- ✅ Error logging without exposing sensitive data
- ✅ CORS headers for cross-origin requests

### Notes

- Times are automatically converted to 12-hour format with AM/PM
- Appointments are sorted by time in ascending order
- Empty schedules return success with count: 0 and empty appointments array
- Uses CURDATE() to ensure correct timezone handling
- Handles missing patient data gracefully with "N/A" defaults
