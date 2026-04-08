const API_BASE_URL = 'http://localhost/HMS/backend/api/doctor';

let appointments = [];
let filteredAppointments = [];
let currentAppointmentId = null;
let doctorContext = {
  doctorCode: '',
  doctorId: null
};

document.addEventListener('DOMContentLoaded', async function() {
  await initializeAppointmentsPage();

  const selectedId = localStorage.getItem('selectedAppointment');
  if (selectedId) {
    localStorage.removeItem('selectedAppointment');
    viewPatientDetails(selectedId);
  }

  const filterStatus = localStorage.getItem('filterStatus');
  if (filterStatus) {
    localStorage.removeItem('filterStatus');
    if (filterStatus === 'follow-up') {
      document.getElementById('searchInput').value = 'follow-up';
      filterAppointments();
    }
  }
});

async function initializeAppointmentsPage() {
  try {
    showTableLoadingState();

    const doctorCode = localStorage.getItem('doctorCode') || '';
    doctorContext.doctorCode = doctorCode;

    if (!doctorCode) {
      throw new Error('Doctor session not found. Please login again.');
    }

    const profile = await fetchDoctorProfile(doctorCode);
    doctorContext.doctorId = profile.id;

    await fetchAppointments(profile.id);
    applyStoredStatusOverrides();
    filteredAppointments = [...appointments];
    loadAppointments();
    updateCounts();
  } catch (error) {
    console.error('Error loading appointments:', error);
    showTableError(error.message);
  }
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

async function fetchAppointments(doctorId) {
  const response = await fetch(`${API_BASE_URL}/today_schedule.php?doctor_id=${encodeURIComponent(doctorId)}`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to load appointments (HTTP ${response.status})`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Failed to load appointments');
  }

  appointments = (result.data?.appointments || []).map((appointment) => ({
    id: String(appointment.id),
    time: appointment.time || '--:--',
    patientName: appointment.patient || 'Unknown Patient',
    age: Number(appointment.age) || 0,
    gender: appointment.gender || 'N/A',
    phone: appointment.phone || 'N/A',
    reason: appointment.complaint || 'No complaint provided',
    status: normalizeStatusValue(appointment.status),
    opNumber: `APT-${appointment.id}`,
    appointmentId: Number(appointment.id)
  }));
}

function applyStoredStatusOverrides() {
  const completedId = localStorage.getItem('completedAppointmentId');
  if (completedId) {
    localStorage.removeItem('completedAppointmentId');
    const appointment = appointments.find((apt) => apt.id === String(completedId));
    if (appointment) {
      appointment.status = 'completed';
      showNotification(`Appointment for ${appointment.patientName} marked as completed!`, 'success');
    }
  }

  const draftId = localStorage.getItem('draftAppointmentId');
  if (draftId) {
    localStorage.removeItem('draftAppointmentId');
    const appointment = appointments.find((apt) => apt.id === String(draftId));
    if (appointment && appointment.status === 'in-progress') {
      appointment.status = 'pending';
      showNotification(`Draft saved for ${appointment.patientName}. Status reverted to Pending.`, 'info');
    }
  }
}

function getActionButton(appointment) {
  switch (appointment.status) {
    case 'pending':
      return `
        <button class="btn-action primary" onclick="startConsultation('${appointment.id}')">
          Start Consultation
        </button>
        <button class="btn-action" onclick="viewPatientDetails('${appointment.id}')">
          View
        </button>
      `;

    case 'in-progress':
      return `
        <button class="btn-action success" onclick="continueConsultation('${appointment.id}')">
          Continue Consultation
        </button>
        <button class="btn-action" onclick="viewPatientDetails('${appointment.id}')">
          View
        </button>
      `;

    case 'completed':
      return `
        <button class="btn-action" onclick="viewPatientDetails('${appointment.id}')">
          View Details
        </button>
      `;

    case 'cancelled':
      return `
        <button class="btn-action" onclick="viewPatientDetails('${appointment.id}')">
          View
        </button>
      `;

    default:
      return `
        <button class="btn-action" onclick="viewPatientDetails('${appointment.id}')">
          View
        </button>
      `;
  }
}

function continueConsultation(appointmentId) {
  startConsultation(appointmentId);
}

function loadAppointments() {
  const tbody = document.getElementById('appointmentsBody');

  if (filteredAppointments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <div class="icon">No Data</div>
            <h3>No Appointments Found</h3>
            <p>No appointments match your search criteria.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';

  filteredAppointments.forEach((appointment) => {
    const row = document.createElement('tr');
    row.className = 'appointment-row';

    row.innerHTML = `
      <td><strong>${escapeHtml(appointment.time)}</strong></td>
      <td><strong>${escapeHtml(appointment.patientName)}</strong></td>
      <td>${appointment.age ? escapeHtml(String(appointment.age)) : '--'}</td>
      <td>${escapeHtml(appointment.gender)}</td>
      <td>${escapeHtml(appointment.phone)}</td>
      <td>${escapeHtml(appointment.reason)}</td>
      <td>
        <span class="status-badge ${appointment.status}">
          ${getStatusText(appointment.status)}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          ${getActionButton(appointment)}
        </div>
      </td>
    `;

    tbody.appendChild(row);
  });
}

function getStatusText(status) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'in-progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status.replace('-', ' ');
  }
}

function updateCounts() {
  const total = filteredAppointments.length;
  const pending = filteredAppointments.filter((apt) => apt.status === 'pending').length;
  const completed = filteredAppointments.filter((apt) => apt.status === 'completed').length;

  document.getElementById('totalCount').textContent = total;
  document.getElementById('pendingCount').textContent = pending;
  document.getElementById('completedCount').textContent = completed;
}

function filterAppointments() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;

  filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.patientName.toLowerCase().includes(searchTerm) ||
      appointment.phone.toLowerCase().includes(searchTerm) ||
      appointment.reason.toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === 'all' ||
      appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  loadAppointments();
  updateCounts();
}

function viewPatientDetails(appointmentId) {
  const appointment = appointments.find((apt) => apt.id === String(appointmentId));
  if (!appointment) {
    return;
  }

  currentAppointmentId = String(appointmentId);

  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <div class="patient-detail-grid">
      <div class="detail-item">
        <label>Patient Name</label>
        <div class="value">${escapeHtml(appointment.patientName)}</div>
      </div>
      
      <div class="detail-item">
        <label>Appointment ID</label>
        <div class="value">${escapeHtml(appointment.opNumber)}</div>
      </div>
      
      <div class="detail-item">
        <label>Age</label>
        <div class="value">${appointment.age ? `${escapeHtml(String(appointment.age))} years` : '--'}</div>
      </div>
      
      <div class="detail-item">
        <label>Gender</label>
        <div class="value">${escapeHtml(appointment.gender)}</div>
      </div>
      
      <div class="detail-item">
        <label>Phone</label>
        <div class="value">${escapeHtml(appointment.phone)}</div>
      </div>
      
      <div class="detail-item">
        <label>Appointment Time</label>
        <div class="value">${escapeHtml(appointment.time)}</div>
      </div>
      
      <div class="detail-item" style="grid-column: 1 / -1;">
        <label>Reason for Visit</label>
        <div class="value">${escapeHtml(appointment.reason)}</div>
      </div>
      
      <div class="detail-item">
        <label>Status</label>
        <div class="value">
          <span class="status-badge ${appointment.status}">
            ${getStatusText(appointment.status)}
          </span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('patientModal').classList.add('active');
}

function closePatientModal() {
  document.getElementById('patientModal').classList.remove('active');
  currentAppointmentId = null;
}

function startConsultationFromModal() {
  if (currentAppointmentId) {
    startConsultation(currentAppointmentId);
  }
}

function startConsultation(appointmentId) {
  const appointment = appointments.find((apt) => apt.id === String(appointmentId));
  if (!appointment) {
    return;
  }

  if (appointment.status === 'pending') {
    appointment.status = 'in-progress';
    filterAppointments();
    showNotification('Appointment status changed to In Progress', 'info');
  }

  localStorage.setItem('currentAppointmentId', String(appointmentId));
  window.location.href = `patient_consultation.html?id=${encodeURIComponent(appointmentId)}`;
}

function changeStatus(appointmentId) {
  const appointment = appointments.find((apt) => apt.id === String(appointmentId));
  if (!appointment) {
    return;
  }

  currentAppointmentId = String(appointmentId);

  document.getElementById('statusPatientName').textContent = appointment.patientName;
  document.getElementById('currentStatus').innerHTML = `
    <span class="status-badge ${appointment.status}">
      ${getStatusText(appointment.status)}
    </span>
  `;
  document.getElementById('newStatus').value = appointment.status;
  document.getElementById('statusRemarks').value = '';

  document.getElementById('statusModal').classList.add('active');
}

function closeStatusModal() {
  document.getElementById('statusModal').classList.remove('active');
  currentAppointmentId = null;
}

function confirmStatusChange() {
  if (!currentAppointmentId) {
    return;
  }

  const appointment = appointments.find((apt) => apt.id === currentAppointmentId);
  if (!appointment) {
    return;
  }

  const newStatus = document.getElementById('newStatus').value;
  appointment.status = newStatus;

  closeStatusModal();
  filterAppointments();
  showNotification(`Status updated for ${appointment.patientName}`, 'success');
}

async function refreshAppointments() {
  document.getElementById('searchInput').value = '';
  document.getElementById('statusFilter').value = 'all';

  await initializeAppointmentsPage();
  showNotification('Appointments refreshed successfully!', 'success');
}

function exportToExcel() {
  let csvContent = 'data:text/csv;charset=utf-8,';
  const headers = ['Time', 'Patient Name', 'Age', 'Gender', 'Phone', 'Reason for Visit', 'Status'];
  csvContent += headers.join(',') + '\n';

  filteredAppointments.forEach((appointment) => {
    const row = [
      appointment.time,
      `"${appointment.patientName}"`,
      appointment.age,
      appointment.gender,
      appointment.phone,
      `"${appointment.reason}"`,
      appointment.status.replace('-', ' ').toUpperCase()
    ];
    csvContent += row.join(',') + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `appointments_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showNotification(`Exported ${filteredAppointments.length} appointments to Excel!`, 'success');
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    location.href = 'doctor_portal.html';
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

function showTableLoadingState() {
  const tbody = document.getElementById('appointmentsBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="8">
        <div class="empty-state">
          <div class="icon">Loading</div>
          <h3>Loading Appointments</h3>
          <p>Please wait while we fetch today's appointments.</p>
        </div>
      </td>
    </tr>
  `;
}

function showTableError(message) {
  const tbody = document.getElementById('appointmentsBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="8">
        <div class="empty-state">
          <div class="icon">Error</div>
          <h3>Unable to Load Appointments</h3>
          <p>${escapeHtml(message)}</p>
        </div>
      </td>
    </tr>
  `;
  updateCounts();
}

function normalizeStatusValue(status) {
  return String(status || 'PENDING').toLowerCase().replace(/_/g, '-');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.onclick = function(event) {
  const patientModal = document.getElementById('patientModal');
  const statusModal = document.getElementById('statusModal');

  if (event.target === patientModal) {
    closePatientModal();
  }

  if (event.target === statusModal) {
    closeStatusModal();
  }
};
