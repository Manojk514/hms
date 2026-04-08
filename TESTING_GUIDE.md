# Step-by-Step Testing Guide for Doctor Profile Update

## Prerequisites
- XAMPP running (Apache + MySQL)
- Database: `hms`
- Browser: Chrome/Firefox

---

## 🔍 STEP 1: Test Database Connection

### Open in Browser:
```
http://localhost/HMS/backend/api/doctor/test_database_connection.php
```

### What to Look For:
- ✅ "Database connected successfully" - Connection works
- ✅ "'doctors' table exists" - Table is present
- ✅ "Doctor DOC001 found" - Test doctor exists
- ✅ "Update executed" with "Affected Rows: 1" - Update works
- ✅ "Current Data" shows updated values

### If You See Errors:

#### Error: "Database connection failed"
**Fix:** 
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Check if database `hms` exists
3. If not, create it: Click "New" → Name: `hms` → Create

#### Error: "'doctors' table does NOT exist"
**Fix:**
1. Open phpMyAdmin
2. Select `hms` database
3. Click "Import" tab
4. Choose file: `HMS/database/hms_database.sql` or `HMS/database/doctor_portal_db.sql`
5. Click "Go"

#### Error: "Doctor DOC001 NOT found"
**Fix:** The script will automatically create it. Refresh the page.

---

## 🐛 STEP 2: Debug Update API

### Open in Browser:
```
http://localhost/HMS/backend/api/doctor/simple_test.html
```

### Click: "🐛 Debug Update API"

### What to Look For:
1. **Request Method:** Should be "POST"
2. **Raw Input:** Should show JSON data
3. **Decoded JSON:** Should show doctor_code, doctor_name, etc.
4. **Database Connection:** Should show "✅ Database connected"
5. **Doctor Code:** Should show "✅ Doctor found"
6. **SQL Query:** Should show UPDATE statement
7. **Execute Update:** Should show "✅ Query executed successfully"
8. **Affected Rows:** Should be 1 (or 0 if data is same)
9. **Updated Doctor Data:** Should show new values

### If You See Errors:

#### "JSON Error"
**Problem:** Data not sent correctly
**Fix:** Use the test page buttons, not direct browser access

#### "doctor_code is missing"
**Problem:** Request format wrong
**Fix:** Ensure you're using POST with JSON body

#### "Doctor not found"
**Problem:** DOC001 doesn't exist
**Fix:** Run Step 1 again to create it

#### "Affected Rows: 0"
**Problem:** Data is already the same
**Fix:** This is normal if you run it twice with same data

---

## 💾 STEP 3: Test Real Update API

### On the same page, Click: "💾 Test Real Update"

### What to Look For:
```json
{
  "status": "success",
  "message": "Doctor profile updated successfully",
  "updated_fields": 3
}
```

### If You See Errors:

#### "Method not allowed"
**Problem:** Not using POST
**Fix:** Use the test page, not direct URL

#### "doctor_code is required"
**Problem:** Missing doctor_code in request
**Fix:** Check the test page is sending correct data

#### "Failed to update profile"
**Problem:** Database or query issue
**Fix:** Check Step 2 debug output for details

---

## ✓ STEP 4: Verify Changes in Database

### Click: "✓ Verify Changes"

### What to Look For:
Should show current database values:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "doctor_code": "DOC001",
    "doctor_name": "Dr. Real Test 14:30:45",
    "qualification": "MBBS, MD, Real Update",
    "experience": 88,
    ...
  }
}
```

### Verify in phpMyAdmin:
1. Open: `http://localhost/phpmyadmin`
2. Select database: `hms`
3. Click table: `doctors`
4. Click "Browse" tab
5. Find row with `doctor_code = 'DOC001'`
6. Check if values match what you updated

---

## 🧪 STEP 5: Test from Frontend

### Open Doctor Profile Page:
```
http://localhost/HMS/frontend/doctor/doctor_profile.html
```

### Test Profile Loading:
1. Open browser console (F12)
2. Look for: "✅ Profile loaded successfully"
3. Check if data displays on page

### Test Profile Update:
1. Click "✏️ Edit" button on Personal Information
2. Change "Doctor Name" to something new
3. Change "Experience" to a different number
4. Click "Save Changes"
5. Look for green notification: "Personal information updated successfully!"
6. Check browser console for: "✅ Profile updated"

### If Update Doesn't Work:

#### Check Browser Console:
Press F12 → Console tab

Look for errors like:
- "Failed to fetch" - Server not running
- "404 Not Found" - Wrong URL
- "500 Internal Server Error" - PHP error
- "CORS error" - Cross-origin issue

#### Check Network Tab:
Press F12 → Network tab
1. Click "Save Changes" again
2. Look for request to `update_profile.php`
3. Click on it
4. Check "Response" tab for error message

---

## 🔧 Common Issues & Solutions

### Issue 1: "CORS policy" error
**Solution:** Already handled in API, but if you see this:
1. Check if you're accessing via `http://localhost/HMS/...`
2. Don't use `file:///` protocol

### Issue 2: Changes don't persist after refresh
**Problem:** Update not reaching database
**Solution:** 
1. Run Step 2 (Debug) to see exact error
2. Check if `doctor_code` is correct in localStorage:
   - Console: `localStorage.getItem('doctorCode')`
   - Should return: `"DOC001"`

### Issue 3: "Loading..." never changes
**Problem:** API not responding
**Solution:**
1. Check XAMPP Apache is running
2. Check URL is correct
3. Check browser console for errors

### Issue 4: Update says success but data unchanged
**Problem:** Updating with same values
**Solution:** Change to different values and try again

---

## 📊 Quick Diagnostic Commands

### In Browser Console (F12):

```javascript
// Check current doctor code
console.log(localStorage.getItem('doctorCode'));

// Test API directly
fetch('http://localhost/HMS/backend/api/doctor/get_profile.php?doctor_code=DOC001')
  .then(r => r.json())
  .then(d => console.log(d));

// Test update directly
fetch('http://localhost/HMS/backend/api/doctor/update_profile.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    doctor_code: 'DOC001',
    doctor_name: 'Dr. Console Test',
    experience: 99
  })
})
.then(r => r.json())
.then(d => console.log(d));
```

---

## ✅ Success Checklist

- [ ] Step 1: Database connection works
- [ ] Step 1: doctors table exists
- [ ] Step 1: DOC001 exists
- [ ] Step 1: UPDATE query works
- [ ] Step 2: Debug shows no errors
- [ ] Step 2: Affected rows > 0
- [ ] Step 3: Real API returns success
- [ ] Step 4: Verify shows updated data
- [ ] Step 5: Frontend loads profile
- [ ] Step 5: Frontend update works
- [ ] phpMyAdmin shows updated data

---

## 🆘 Still Not Working?

### Collect This Information:

1. **From Step 1 (test_database_connection.php):**
   - Screenshot of entire page
   - Any red error messages

2. **From Step 2 (debug_update.php):**
   - Screenshot of "Execute Update" section
   - Value of "Affected Rows"

3. **From Browser Console (F12):**
   - Any red error messages
   - Network tab → update_profile.php → Response

4. **From phpMyAdmin:**
   - Screenshot of doctors table structure
   - Screenshot of DOC001 row data

Share these and I can help identify the exact issue!
