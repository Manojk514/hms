// ===== API CONFIGURATION =====
const API_BASE_URL = 'http://localhost/HMS/backend/api/doctor';

console.log('🚀 Doctor Profile JS Loaded - Version 2.0');
console.log('📍 API Base URL:', API_BASE_URL);

// ===== DOCTOR PROFILE DATA =====
let doctorProfile = {
  id: '',
  doctor_code: 'DOC001', // Correct doctor code from database
  name: '',
  specializationId: 1,
  specialization: '',
  qualification: '',
  experience: 0,
  licenseNumber: '',
  joiningDate: '01 Jan 2020',
  email: '',
  phone: '',
  emergencyContact: '',
  address: '',
  stats: {
    totalPatients: 0,
    completedConsultations: 0,
    pendingFollowups: 0,
    todayAppointments: 0
  }
};

let specializationOptions = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  initializePasswordToggles();
  loadDoctorProfile();
});

function setPageReady() {
  document.body.classList.remove('page-loading');
}

function stripDoctorTitle(name) {
  return String(name || '').replace(/^Dr\.?\s*/i, '').trim();
}

function formatDoctorName(name) {
  const cleanName = stripDoctorTitle(name);
  return cleanName ? `Dr. ${cleanName}` : 'Dr.';
}

function initializePasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle');

  toggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.target);

      if (!input) {
        return;
      }

      const isVisible = input.type === 'text';
      input.type = isVisible ? 'password' : 'text';
      button.classList.toggle('is-visible', !isVisible);
      button.setAttribute('aria-pressed', String(!isVisible));
      button.setAttribute('aria-label', `${isVisible ? 'Show' : 'Hide'} password`);
      button.setAttribute('title', isVisible ? 'Show password' : 'Hide password');
    });
  });
}

// ===== LOAD DOCTOR PROFILE FROM API =====
async function loadDoctorProfile() {
  try {
    // Get doctor code from localStorage or use default
    const doctorCode = localStorage.getItem('doctorCode') || doctorProfile.doctor_code;
    
    // Fetch profile from API
    const response = await fetch(`${API_BASE_URL}/get_profile.php?doctor_code=${encodeURIComponent(doctorCode)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to load profile');
    }

    await loadSpecializations();
    
    // Update profile data from API
    const data = result.data;
    doctorProfile = {
      ...doctorProfile,
      id: data.id,
      doctor_code: data.doctor_code,
      name: data.doctor_name,
      specializationId: data.specialization_id,
      specialization: data.specialization_name || getSpecializationName(data.specialization_id),
      qualification: data.qualification,
      experience: data.experience,
      licenseNumber: data.license_number,
      email: data.email,
      phone: data.phone,
      emergencyContact: data.emergency_contact || '',
      address: data.address
    };

    await loadDoctorStatistics(doctorProfile.doctor_code);
    
    // Update UI with fetched data
    updateProfileUI();
    setPageReady();
    
    console.log('✅ Profile loaded successfully:', doctorProfile);
    
  } catch (error) {
    console.error('❌ Error loading profile:', error);
    showErrorMessage('Failed to load profile: ' + error.message);
    
    // Load fallback data from localStorage if available
    loadFallbackData();
    setPageReady();
  }
}

async function loadDoctorStatistics(doctorCode) {
  const response = await fetch(`${API_BASE_URL}/dashboard.php?doctor_code=${encodeURIComponent(doctorCode)}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to load statistics (HTTP ${response.status})`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Failed to load statistics');
  }

  const stats = result.data?.statistics || {};

  doctorProfile.stats = {
    totalPatients: Number(stats.totalPatients) || 0,
    completedConsultations: Number(stats.completedConsultations) || 0,
    pendingFollowups: Number(stats.pendingFollowups) || 0,
    todayAppointments: Number(stats.todayAppointments) || 0
  };
}

async function loadSpecializations() {
  const response = await fetch(`${API_BASE_URL}/get_specializations.php`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to load specializations (HTTP ${response.status})`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Failed to load specializations');
  }

  specializationOptions = Array.isArray(result.data) ? result.data : [];
  populateSpecializationSelect();
}

function populateSpecializationSelect() {
  const select = document.getElementById('editSpecialization');
  if (!select) {
    return;
  }

  select.innerHTML = '';

  specializationOptions.forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = String(option.id);
    optionElement.textContent = option.name;
    select.appendChild(optionElement);
  });
}
// ===== UPDATE PROFILE UI =====
function updateProfileUI() {
  // Header section
  document.getElementById('doctorName').textContent = doctorProfile.name;
  document.getElementById('doctorId').textContent = doctorProfile.doctor_code;
  document.getElementById('profileSpecialization').textContent = doctorProfile.specialization;
  
  // Set avatar initials
  const initials = doctorProfile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  document.getElementById('avatarInitials').textContent = initials;
  
  // Personal Information section
  document.getElementById('fullName').textContent = doctorProfile.name;
  document.getElementById('specialization').textContent = doctorProfile.specialization;
  document.getElementById('qualification').textContent = doctorProfile.qualification;
  document.getElementById('experience').textContent = `${doctorProfile.experience} years`;
  document.getElementById('licenseNumber').textContent = doctorProfile.licenseNumber;
  
  // Contact Information section
  document.getElementById('email').textContent = doctorProfile.email;
  document.getElementById('phone').textContent = doctorProfile.phone;
  document.getElementById('emergencyContact').textContent = doctorProfile.emergencyContact || 'Not provided';
  document.getElementById('address').textContent = doctorProfile.address || 'Not provided';
  
  // Update edit form fields
  document.getElementById('editFullName').value = stripDoctorTitle(doctorProfile.name);
  document.getElementById('editSpecialization').value = String(doctorProfile.specializationId || 1);
  document.getElementById('editQualification').value = doctorProfile.qualification;
  document.getElementById('editExperience').value = doctorProfile.experience;
  document.getElementById('editEmail').value = doctorProfile.email || '';
  document.getElementById('editPhone').value = doctorProfile.phone;
  document.getElementById('editEmergencyContact').value = doctorProfile.emergencyContact || '';
  document.getElementById('editAddress').value = doctorProfile.address;

  document.getElementById('statTotalPatients').textContent = formatStatNumber(doctorProfile.stats.totalPatients);
  document.getElementById('statCompletedConsultations').textContent = formatStatNumber(doctorProfile.stats.completedConsultations);
  document.getElementById('statPendingFollowups').textContent = formatStatNumber(doctorProfile.stats.pendingFollowups);
  document.getElementById('statTodayAppointments').textContent = formatStatNumber(doctorProfile.stats.todayAppointments);
  
  // Save to localStorage for fallback
  localStorage.setItem('doctorName', doctorProfile.name);
  localStorage.setItem('doctorCode', doctorProfile.doctor_code);
}

// ===== LOAD FALLBACK DATA =====
function formatStatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0);
}

// ===== LOAD FALLBACK DATA =====
function loadFallbackData() {
  const storedName = localStorage.getItem('doctorName');
  const storedCode = localStorage.getItem('doctorCode');
  
  if (storedName) {
    document.getElementById('doctorName').textContent = storedName;
    document.getElementById('fullName').textContent = storedName;
    
    const initials = storedName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('avatarInitials').textContent = initials;
  }
  
  if (storedCode) {
    document.getElementById('doctorId').textContent = storedCode;
  }

  const profileSpecialization = document.getElementById('profileSpecialization');
  if (profileSpecialization && !profileSpecialization.textContent.trim()) {
    profileSpecialization.textContent = '--';
  }

  ['statTotalPatients', 'statCompletedConsultations', 'statPendingFollowups', 'statTodayAppointments'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = '--';
    }
  });
}

// ===== SHOW NOTIFICATION =====
function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.getElementById('notification');
  if (existing) {
    existing.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'notification';
  
  // Set colors based on type
  const colors = {
    success: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: '✓' },
    error: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b', icon: '✕' },
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', icon: 'ℹ' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '⚠' }
  };
  
  const color = colors[type] || colors.info;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${color.bg};
    color: ${color.text};
    padding: 15px 25px;
    border-radius: 8px;
    border-left: 4px solid ${color.border};
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    max-width: 500px;
    font-size: 14px;
    animation: slideDown 0.3s ease;
  `;
  
  notification.innerHTML = `
    <strong>${color.icon}</strong> ${message}
    <button onclick="this.parentElement.remove()" style="
      margin-left: 15px;
      background: transparent;
      border: none;
      color: ${color.text};
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      padding: 0 5px;
    ">×</button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (notification && notification.parentElement) {
      notification.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// ===== SHOW ERROR MESSAGE (Legacy support) =====
function showErrorMessage(message) {
  showNotification(message, 'error');
}

// ===== GET SPECIALIZATION NAME =====
function getSpecializationName(specializationId) {
  const match = specializationOptions.find((option) => Number(option.id) === Number(specializationId));
  return match ? match.name : `Specialization ${specializationId}`;
}

// ===== TOGGLE EDIT MODE =====
function toggleEdit(section) {
  const editForm = document.getElementById(`${section}EditForm`);
  const infoGrid = editForm.previousElementSibling;
  
  if (editForm.style.display === 'none') {
    editForm.style.display = 'block';
    infoGrid.style.display = 'none';
  } else {
    editForm.style.display = 'none';
    infoGrid.style.display = 'grid';
  }
}

function cancelEdit(section) {
  toggleEdit(section);
}

// ===== SAVE PERSONAL INFO =====
async function savePersonalInfo() {
  const editableName = document.getElementById('editFullName').value.trim();
  const name = formatDoctorName(editableName);
  const specializationId = parseInt(document.getElementById('editSpecialization').value, 10);
  const specialization = getSpecializationName(specializationId);
  const qualification = document.getElementById('editQualification').value.trim();
  const experience = document.getElementById('editExperience').value;
  
  console.log('🔍 Save Personal Info Called');
  console.log('Current doctorProfile:', doctorProfile);
  console.log('Doctor Code:', doctorProfile.doctor_code);
  
  if (!editableName || !qualification || !experience) {
    showNotification('Please fill all required fields', 'error');
    return;
  }

  if (!specializationId) {
    showNotification('Please select a specialization', 'error');
    return;
  }
  
  if (experience < 0) {
    showNotification('Experience must be a positive number', 'error');
    return;
  }
  
  try {
    // Show loading notification
    showNotification('Updating profile...', 'info');
    
    // Prepare update data
    const updateData = {
      doctor_code: doctorProfile.doctor_code,
      doctor_name: name,
      specialization_id: specializationId,
      qualification: qualification,
      experience: parseInt(experience)
    };
    
    console.log('📤 Sending update data:', updateData);
    console.log('📍 API URL:', `${API_BASE_URL}/update_profile.php`);
    
    // Call update API
    const response = await fetch(`${API_BASE_URL}/update_profile.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response OK:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('📥 API Response:', result);
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to update profile');
    }
    
    // Update local profile data
    doctorProfile.name = name;
    doctorProfile.specializationId = specializationId;
    doctorProfile.specialization = specialization;
    doctorProfile.qualification = qualification;
    doctorProfile.experience = parseInt(experience);
    
    // Update display
    document.getElementById('doctorName').textContent = name;
    document.getElementById('fullName').textContent = name;
    document.getElementById('specialization').textContent = specialization;
    document.getElementById('qualification').textContent = qualification;
    document.getElementById('experience').textContent = `${experience} years`;
    
    // Update avatar initials
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('avatarInitials').textContent = initials;
    
    // Save to localStorage
    localStorage.setItem('doctorName', name);
    
    // Close edit form
    toggleEdit('personal');
    
    // Show success notification
    showNotification('Personal information updated successfully!', 'success');
    
    console.log('✅ Profile updated successfully:', result);
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    showNotification('Failed to update profile: ' + error.message, 'error');
  }
}

// ===== SAVE CONTACT INFO =====
async function saveContactInfo() {
  const email = document.getElementById('editEmail').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  const emergencyContact = document.getElementById('editEmergencyContact').value.trim();
  const address = document.getElementById('editAddress').value.trim();
  
  if (!email || !phone) {
    showNotification('Email and phone number are required', 'error');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }
  
  // Validate phone number format
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  if (!phoneRegex.test(phone)) {
    showNotification('Please enter a valid phone number', 'error');
    return;
  }
  
  try {
    // Show loading notification
    showNotification('Updating contact information...', 'info');
    
    // Prepare update data
    const updateData = {
      doctor_code: doctorProfile.doctor_code,
      email: email,
      phone: phone,
      emergency_contact: emergencyContact,
      address: address
    };
    
    // Call update API
    const response = await fetch(`${API_BASE_URL}/update_profile.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status !== 'success') {
      throw new Error(result.message || 'Failed to update contact information');
    }
    
    // Update local profile data
    doctorProfile.email = email;
    doctorProfile.phone = phone;
    doctorProfile.emergencyContact = emergencyContact;
    doctorProfile.address = address;
    
    // Update display
    document.getElementById('email').textContent = email;
    document.getElementById('phone').textContent = phone;
    document.getElementById('emergencyContact').textContent = emergencyContact || 'Not provided';
    document.getElementById('address').textContent = address || 'Not provided';
    
    // Close edit form
    toggleEdit('contact');
    
    // Show success notification
    showNotification('Contact information updated successfully!', 'success');
    
    console.log('✅ Contact info updated:', result);
    
  } catch (error) {
    console.error('❌ Error updating contact info:', error);
    showNotification('Failed to update contact information: ' + error.message, 'error');
  }
}

// ===== CHANGE PASSWORD =====
async function changePassword() {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  console.log('Change Password Called');
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    showNotification('Please fill all password fields', 'error');
    return;
  }
  
  if (newPassword.length < 6) {
    showNotification('New password must be at least 6 characters long', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showNotification('New password and confirm password do not match', 'error');
    return;
  }
  
  if (currentPassword === newPassword) {
    showNotification('New password must be different from current password', 'error');
    return;
  }
  
  try {
    showNotification('Changing password...', 'info');
    
    console.log("Sending:", {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
    
    const response = await fetch(`${API_BASE_URL}/change_password.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
    });
    
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Unexpected server response (${response.status}). Check API path or backend output.`);
    }

    console.log('API Response:', result);
    
    if (result.status === 'success') {
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
      
      showNotification('Password changed successfully! Please use your new password for future logins.', 'success');
      console.log('Password changed successfully');
      return;
    }
    
    showNotification(result.message || 'Failed to change password', 'error');
    
  } catch (error) {
    console.error('Error changing password:', error);
    showNotification('Failed to change password: ' + error.message, 'error');
  }
}
// ===== LOGOUT =====
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('doctorName');
    localStorage.removeItem('doctorId');
    location.href = 'doctor_portal.html';
  }
}


