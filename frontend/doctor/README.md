# Doctor Module

This folder contains all doctor-related files for the ITiVAT MED Hospital Management System.

## 🔐 Login Credentials

Use any of these credentials to login:

| Doctor ID | Password | Name |
|-----------|----------|------|
| `doctor` | `doctor` | Dr. Demo User |
| `DOC001` | `doctor123` | Dr. Rajesh Sharma |
| `DOC002` | `doctor123` | Dr. Priya Patel |
| `DOC003` | `doctor123` | Dr. Amit Reddy |

**Quick Login:** 
- Doctor ID: `doctor`
- Password: `doctor`

## Files Structure

### Login & Portal
- `doctor_portal.html` - Doctor login page
- `doctor_portal.css` - Login page styling
- `doctor.js` - Login functionality and animations
- `doctor-bg.jpg` - Background image for login page

### Dashboard
- `doctor_dashboard.html` - Main doctor dashboard
- `doctor_dashboard.css` - Dashboard styling
- `doctor_dashboard.js` - Dashboard functionality with mock data

### Appointments Management
- `doctor_appointments.html` - Today's appointments page
- `doctor_appointments.css` - Appointments page styling
- `doctor_appointments.js` - Appointments management functionality

### Patient Consultation
- `patient_consultation.html` - Patient consultation and prescription page
- `patient_consultation.css` - Consultation page styling
- `patient_consultation.js` - Consultation functionality with prescription management

### Doctor Profile
- `doctor_profile.html` - Doctor profile and settings page
- `doctor_profile.css` - Profile page styling
- `doctor_profile.js` - Profile management functionality

## Features

### Doctor Dashboard
- Summary cards showing:
  - Today's Appointments
  - Completed Consultations
  - Pending Follow-ups
  - Total Assigned Patients
- Today's schedule with time-based list view
- Quick action buttons
- Real-time appointment status

### Appointments Page
- Complete appointments table with filtering
- Search by patient name/phone
- Status filter (Pending/In Progress/Completed/Cancelled)
- Change appointment status
- View patient details
- Start consultation (navigates to consultation page)
- Export to Excel (coming soon)

### Patient Consultation Page
- **Patient Details Panel:**
  - Basic information (Name, Age, Gender, Blood Group, Contact)
  - Current vitals (BP, Temperature, Pulse, Weight)
  - Medical history (Previous visits, diagnoses, prescriptions)
- **Consultation Form:**
  - Chief complaint display
  - Add/remove symptoms dynamically
  - Diagnosis textarea
  - Clinical notes textarea
  - Dynamic medicine prescription:
    - Medicine name, dosage, frequency
    - Duration, timing, route
    - Special instructions
    - Add/remove medicines
  - **Lab Orders:**
    - Select from dropdown of common tests
    - Add multiple lab tests
    - Add lab notes/instructions
    - Remove tests
  - **Follow-up Scheduling:**
    - Select follow-up date and time
    - Add follow-up remarks
    - View scheduled follow-ups
    - Remove follow-ups
  - Action buttons:
    - Save as Draft
    - Save Prescription
    - Complete Consultation
- **Keyboard Shortcuts:**
  - Ctrl/Cmd + S: Save draft
  - Ctrl/Cmd + Enter: Save prescription

### Doctor Profile Page
- **Personal Information:**
  - View and edit name, specialization, qualification
  - View experience, license number, joining date
  - Edit mode with save/cancel
- **Contact Information:**
  - View and edit phone number
  - Edit emergency contact and address
  - Phone number validation
- **Security Settings:**
  - Change password functionality
  - Password validation (min 6 characters)
  - Confirm password matching
- **Statistics Dashboard:**
  - Total patients
  - Total consultations
  - Success rate
  - Patient rating
- **Account Restrictions Notice:**
  - Clear display of what doctors cannot do
  - Transparency about system limitations

## Navigation Flow

1. **Login** → `doctor_portal.html`
2. **Dashboard** → `doctor_dashboard.html`
3. **Appointments** → `doctor_appointments.html`

## Technology Stack

- Pure HTML5, CSS3, JavaScript (ES6+)
- No backend - Frontend only with mock data
- Responsive design
- Modern UI/UX patterns

## Mock Data

All data is stored in JavaScript arrays within the respective JS files:
- 12 sample appointments
- Various patient demographics
- Different appointment statuses
- Realistic medical scenarios

## Future Enhancements

- Prescription management
- Lab test ordering
- Patient medical history
- Real-time notifications
- Integration with backend API

## Restrictions & Permissions

### Doctors CAN:
✅ View patient medical records  
✅ Add consultations and prescriptions  
✅ Order lab tests for their patients  
✅ Schedule follow-up appointments  
✅ Update their own profile  
✅ Change their password  

### Doctors CANNOT:
❌ Delete patient records  
❌ Access billing details  
❌ Modify other doctor's notes  
❌ Modify other doctor's prescriptions  
❌ Delete consultation history  
❌ Access financial reports  

These restrictions are enforced in the UI by not displaying delete buttons, billing sections, or edit options for other doctors' work.
