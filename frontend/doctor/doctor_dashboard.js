const API_BASE_URL = 'http://localhost/HMS/backend/api/doctor';

let dashboardState = {
  doctorCode: '',
  doctorId: null,
  doctorName: 'Doctor',
  specialization: 'Department',
  appointments: []
};

document.addEventListener('DOMContentLoaded', async function() {
  displayCurrentDate();
  await initializeDashboard();
});

function setDashboardReady() {
  document.body.classList.remove('page-loading');
}

async function initializeDashboard() {
  try {
    const doctorCode = localStorage.getItem('doctorCode') || '';
    dashboardState.doctorCode = doctorCode;

    if (!doctorCode) {
      throw new Error('Doctor session not found. Please login again.');
    }

    const profile = await fetchDoctorProfile(doctorCode);
    dashboardState.doctorId = profile.id;
    dashboardState.doctorName = profile.doctor_name || 'Doctor';
    dashboardState.specialization = profile.specialization_name || 'Medical Department';

    updateWelcomeSection();

    await Promise.all([
      loadDashboardStats(doctorCode),
      loadTodaySchedule(profile.id)
    ]);
    setDashboardReady();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    showDashboardError(error.message);
    setDashboardReady();
  }
}

function displayCurrentDate() {
  const dateElement = document.getElementById('currentDate');
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateElement.textContent = today.toLocaleDateString('en-US', options);
}

async function fetchDoctorProfile(doctorCode) {
  const response = await fetch(`${API_BASE_URL}/get_profile.php?doctor_code=${encodeURIComponent(doctorCode)}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to load doctor profile (HTTP ${response.status})`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to load doctor profile');
  }

  return result.data;
}

async function loadDashboardStats(doctorCode) {
  const response = await fetch(`${API_BASE_URL}/dashboard.php?doctor_code=${encodeURIComponent(doctorCode)}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to load dashboard statistics (HTTP ${response.status})`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Failed to load dashboard statistics');
  }

  const stats = result.data?.statistics || {};

  document.getElementById('todayAppointments').textContent = formatNumber(stats.todayAppointments);
  document.getElementById('completedConsultations').textContent = formatNumber(stats.completedConsultations);
  document.getElementById('pendingFollowups').textContent = formatNumber(stats.pendingFollowups);
  document.getElementById('totalPatients').textContent = formatNumber(stats.totalPatients);
}

async function loadTodaySchedule(doctorId) {
  const container = document.getElementById('scheduleContainer');
  container.innerHTML = '<div class="empty-state"><h3>Loading schedule...</h3><p>Please wait while we fetch today\'s appointments.</p></div>';

  const response = await fetch(`${API_BASE_URL}/today_schedule.php?doctor_id=${encodeURIComponent(doctorId)}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to load today schedule (HTTP ${response.status})`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Failed to load today schedule');
  }

  dashboardState.appointments = Array.isArray(result.data?.appointments) ? result.data.appointments : [];
  renderTodaySchedule();
}

function renderTodaySchedule() {
  const container = document.getElementById('scheduleContainer');

  if (dashboardState.appointments.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">No Data</div>
        <h3>No Appointments Today</h3>
        <p>You have no scheduled appointments for today.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  dashboardState.appointments.forEach((appointment) => {
    const statusClass = normalizeStatusClass(appointment.status);
    const actionMarkup = getActionMarkup(appointment);
    const scheduleItem = document.createElement('div');
    scheduleItem.className = 'schedule-item';

    scheduleItem.innerHTML = `
      <div class="schedule-time">
        <div class="time">${appointment.time || '--:--'}</div>
        <div class="duration">30 min</div>
      </div>
      
      <div class="schedule-details">
        <div class="patient-name">${escapeHtml(appointment.patient || 'Unknown Patient')}</div>
        <div class="patient-info">${formatPatientInfo(appointment)}</div>
        <div class="reason">${escapeHtml(appointment.complaint || 'No complaint provided')}</div>
      </div>
      
      <div class="schedule-actions">
        <span class="status-badge ${statusClass}">${formatStatusLabel(appointment.status)}</span>
        ${actionMarkup}
      </div>
    `;

    container.appendChild(scheduleItem);
  });
}

function updateWelcomeSection() {
  document.getElementById('doctorName').textContent = dashboardState.doctorName.replace(/^Dr\.\s*/i, '');
  document.querySelector('.welcome-subtitle').textContent = dashboardState.specialization;
  localStorage.setItem('doctorName', dashboardState.doctorName);
}

function showDashboardError(message) {
  const container = document.getElementById('scheduleContainer');
  container.innerHTML = `
    <div class="empty-state">
      <div class="icon">Error</div>
      <h3>Unable to Load Dashboard</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0);
}

function formatPatientInfo(appointment) {
  const age = appointment.age ? `${appointment.age} years` : 'Age N/A';
  const gender = appointment.gender || 'Gender N/A';
  const phone = appointment.phone || 'Phone N/A';
  return `${escapeHtml(age)} • ${escapeHtml(gender)} • ${escapeHtml(phone)}`;
}

function normalizeStatusClass(status) {
  const normalized = String(status || 'PENDING').toLowerCase().replace(/_/g, '-');
  if (normalized === 'in-progress' || normalized === 'pending' || normalized === 'completed' || normalized === 'cancelled') {
    return normalized;
  }
  return 'pending';
}

function formatStatusLabel(status) {
  return String(status || 'PENDING').replace(/_/g, ' ').toLowerCase();
}

function getActionMarkup(appointment) {
  const normalizedStatus = String(appointment.status || '').toUpperCase();

  if (normalizedStatus === 'PENDING') {
    return `<button class="btn-start" onclick="startConsultation('${appointment.id}')">Start</button>`;
  }

  if (normalizedStatus === 'IN_PROGRESS') {
    return `<button class="btn-start" onclick="continueConsultation('${appointment.id}')">Continue</button>`;
  }

  return '';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function startConsultation(appointmentId) {
  localStorage.setItem('selectedAppointment', appointmentId);
  location.href = 'doctor_appointments.html';
}

function continueConsultation(appointmentId) {
  localStorage.setItem('selectedAppointment', appointmentId);
  location.href = 'doctor_appointments.html';
}

async function refreshSchedule() {
  const btn = document.querySelector('.btn-refresh');
  const originalText = btn.textContent;

  try {
    btn.textContent = 'Refreshing...';
    btn.disabled = true;

    await Promise.all([
      loadDashboardStats(dashboardState.doctorCode),
      loadTodaySchedule(dashboardState.doctorId)
    ]);

    btn.textContent = 'Refreshed';
  } catch (error) {
    console.error('Error refreshing dashboard:', error);
    btn.textContent = 'Retry';
    showDashboardError(error.message);
  } finally {
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 1500);
  }
}

function viewPendingFollowups() {
  localStorage.setItem('filterStatus', 'follow-up');
  location.href = 'doctor_appointments.html';
}

function viewPatientHistory() {
  location.href = 'doctor_appointments.html';
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    location.href = 'doctor_portal.html';
  }
}
