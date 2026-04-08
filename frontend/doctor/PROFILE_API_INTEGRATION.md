# Doctor Profile - API Integration Documentation

## Overview

The doctor profile page has been fully integrated with the backend API to dynamically load and update doctor information in real-time.

## Features Implemented

### 1. Dynamic Profile Loading
- ✅ Fetches doctor data from backend API on page load
- ✅ Uses `doctor_code` from localStorage (default: DOC001)
- ✅ Displays loading state while fetching data
- ✅ Shows error notifications if API fails
- ✅ Falls back to localStorage data if API unavailable

### 2. Edit Personal Information
- ✅ Click "Edit" button to enable editing
- ✅ Modify: Doctor Name, Qualification, Experience
- ✅ Validates all required fields
- ✅ Sends POST request to update API
- ✅ Updates database in real-time
- ✅ Refreshes UI with new values
- ✅ Shows success/error notifications

### 3. Edit Contact Information
- ✅ Click "Edit" button to enable editing
- ✅ Modify: Phone, Address
- ✅ Validates phone number format
- ✅ Sends POST request to update API
- ✅ Updates database in real-time
- ✅ Refreshes UI with new values
- ✅ Shows success/error notifications

### 4. Notification System
- ✅ Success notifications (green)
- ✅ Error notifications (red)
- ✅ Info notifications (blue)
- ✅ Warning notifications (yellow)
- ✅ Auto-dismiss after 5 seconds
- ✅ Smooth animations

## API Endpoints Used

### GET Profile
```
GET /backend/api/doctor/get_profile.php?doctor_code=DOC001
```

**Response:**
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
    "email": "doctor@hospital.com",
    "phone": "9876543210",
    "address": "123 Medical Street"
  }
}
```

### POST Update Profile
```
POST /backend/api/doctor/update_profile.php
Content-Type: application/json

{
  "doctor_code": "DOC001",
  "doctor_name": "Dr. John Smith",
  "qualification": "MBBS, MD, DM",
  "experience": 12,
  "phone": "9876543210",
  "address": "123 Medical Street"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Doctor profile updated successfully",
  "updated_fields": 4
}
```

## Files Modified

### 1. `frontend/doctor/doctor_profile.html`
- Added CSS animations for notifications
- No structural changes (maintains existing design)

### 2. `frontend/doctor/doctor_profile.js`
- Replaced mock data with API calls
- Added `loadDoctorProfile()` - fetches from API
- Added `updateProfileUI()` - updates all UI elements
- Added `showNotification()` - modern notification system
- Updated `savePersonalInfo()` - calls update API
- Updated `saveContactInfo()` - calls update API
- Added error handling and loading states

## How It Works

### Page Load Flow
```
1. Page loads
2. DOMContentLoaded event fires
3. loadDoctorProfile() called
4. Shows "Loading..." in all fields
5. Fetches data from GET API
6. Updates doctorProfile object
7. Calls updateProfileUI()
8. Displays all data in UI
9. Saves to localStorage for fallback
```

### Edit & Save Flow
```
1. User clicks "Edit" button
2. Edit form appears with current values
3. User modifies fields
4. User clicks "Save Changes"
5. Validates input data
6. Shows "Updating..." notification
7. Sends POST request to API
8. API updates database
9. Updates local doctorProfile object
10. Updates UI with new values
11. Closes edit form
12. Shows success notification
```

## Configuration

### Change Doctor Code
To load a different doctor's profile, set the doctor code in localStorage:

```javascript
localStorage.setItem('doctorCode', 'DOC002');
location.reload();
```

### Change API Base URL
Edit the API_BASE_URL constant in `doctor_profile.js`:

```javascript
const API_BASE_URL = 'http://your-domain.com/backend/api/doctor';
```

## Error Handling

### API Unavailable
- Shows error notification
- Falls back to localStorage data
- Logs error to console

### Invalid Data
- Shows validation error notification
- Prevents API call
- Keeps edit form open

### Network Error
- Shows network error notification
- Logs error to console
- Allows user to retry

## Testing

### Test Profile Loading
1. Open: `http://localhost/HMS/frontend/doctor/doctor_profile.html`
2. Check browser console for API calls
3. Verify data displays correctly

### Test Profile Update
1. Click "Edit" on Personal Information
2. Modify any field
3. Click "Save Changes"
4. Check notification appears
5. Verify data updated in UI
6. Refresh page to confirm persistence

### Test Error Handling
1. Stop backend server
2. Try to load profile
3. Verify error notification appears
4. Verify fallback data loads

## Browser Console Commands

### Load Different Doctor
```javascript
localStorage.setItem('doctorCode', 'DOC002');
location.reload();
```

### View Current Profile Data
```javascript
console.log(doctorProfile);
```

### Manually Trigger Profile Load
```javascript
loadDoctorProfile();
```

### Test Notification System
```javascript
showNotification('Test message', 'success');
showNotification('Error message', 'error');
showNotification('Info message', 'info');
showNotification('Warning message', 'warning');
```

## Specialization Mapping

The system maps specialization IDs to names:

| ID | Specialization |
|----|----------------|
| 1  | General Medicine |
| 2  | Pediatrics |
| 3  | Orthopedics |
| 4  | Gynecology |
| 5  | Cardiology |
| 6  | Neurology |
| 7  | Dermatology |
| 8  | ENT |
| 9  | Ophthalmology |
| 10 | Psychiatry |

## Security Features

- ✅ Input validation on frontend
- ✅ Server-side validation on backend
- ✅ Prepared statements prevent SQL injection
- ✅ Email format validation
- ✅ Phone number format validation
- ✅ Experience range validation

## Future Enhancements

- [ ] Add profile photo upload
- [ ] Add email update functionality
- [ ] Add license number update
- [ ] Add password change API integration
- [ ] Add activity log
- [ ] Add profile completion percentage
- [ ] Add real-time validation
- [ ] Add undo functionality

## Troubleshooting

### Profile Not Loading
1. Check browser console for errors
2. Verify backend server is running
3. Check API endpoint URL is correct
4. Verify doctor_code exists in database

### Update Not Working
1. Check browser console for errors
2. Verify POST request is sent
3. Check API response in Network tab
4. Verify database connection
5. Check field validation rules

### Notification Not Showing
1. Check browser console for errors
2. Verify showNotification() is called
3. Check z-index conflicts
4. Clear browser cache

## Support

For issues or questions:
1. Check browser console for errors
2. Review API documentation in `backend/api/doctor/README.md`
3. Test API endpoints using test pages
4. Check database for data integrity
