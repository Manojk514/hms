// ================= MOCK DATA WITH PERSISTENCE =================
const defaultHospitals = [
  {
    id: 'HSP-1001',
    name: 'Apollo Hospitals',
    city: 'Hyderabad',
    state: 'Telangana',
    address: 'Jubilee Hills, Hyderabad',
    phone: '+91 40 2345 6789',
    email: 'admin@apollo-hyd.com',
    plan: 'premium',
    status: 'active',
    modules: ['OP', 'Lab', 'Pharmacy', 'Billing'],
    revenue: 45000,
    logo: 'apollo-logo.png'
  },
  {
    id: 'HSP-1002',
    name: 'Fortis Healthcare',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Andheri West, Mumbai',
    phone: '+91 22 2345 6789',
    email: 'admin@fortis-mumbai.com',
    plan: 'standard',
    status: 'active',
    modules: ['OP', 'Lab', 'Billing'],
    revenue: 38000,
    logo: 'fortis-logo.png'
  },
  {
    id: 'HSP-1003',
    name: 'Max Healthcare',
    city: 'Delhi',
    state: 'Delhi',
    address: 'Saket, New Delhi',
    phone: '+91 11 2345 6789',
    email: 'admin@max-delhi.com',
    plan: 'premium',
    status: 'active',
    modules: ['OP', 'Lab', 'Pharmacy', 'Billing'],
    revenue: 52000,
    logo: 'max-logo.png'
  },
  {
    id: 'HSP-1004',
    name: 'Manipal Hospitals',
    city: 'Bangalore',
    state: 'Karnataka',
    address: 'HAL Airport Road, Bangalore',
    phone: '+91 80 2345 6789',
    email: 'admin@manipal-blr.com',
    plan: 'standard',
    status: 'active',
    modules: ['OP', 'Lab', 'Billing'],
    revenue: 35000,
    logo: 'manipal-logo.png'
  },
  {
    id: 'HSP-1005',
    name: 'AIIMS Delhi',
    city: 'Delhi',
    state: 'Delhi',
    address: 'Ansari Nagar, New Delhi',
    phone: '+91 11 2345 6790',
    email: 'admin@aiims-delhi.gov.in',
    plan: 'basic',
    status: 'inactive',
    modules: ['OP', 'Lab'],
    revenue: 0,
    logo: 'aiims-logo.png'
  }
];

// Load hospitals from localStorage or use defaults
let mockHospitals = JSON.parse(localStorage.getItem('superAdminHospitals')) || [...defaultHospitals];

// Save hospitals to localStorage
function saveHospitalsToStorage() {
  localStorage.setItem('superAdminHospitals', JSON.stringify(mockHospitals));
}

let currentView = 'dashboard';
let currentHospitalPage = 1;
const hospitalsPerPage = 10;
let filteredHospitals = [...mockHospitals];

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', function() {
  console.log('Super Admin Dashboard loaded');
  
  // Check for hash navigation
  const hash = window.location.hash;
  if (hash === '#user-management') {
    showUserManagement();
  } else if (hash === '#hospitals') {
    showHospitals();
  } else if (hash === '#subscriptions') {
    showSubscriptions();
  } else {
    showDashboard();
  }
  
  loadHospitalStats();
  generateHospitalCode();
  
  console.log('Initialization complete');
});

// ================= NAVIGATION =================
function showDashboard() {
  switchView('dashboard');
  setActiveMenu(0);
}

function showHospitals() {
  switchView('hospital');
  setActiveMenu(1);
  loadHospitalsTable();
}

function showUserManagement() {
  switchView('userManagement');
  setActiveMenu(2);
  loadUserManagementData();
}

function showModuleConfig() {
  window.location.href = 'super_admin_modules.html';
}

function showReports() {
  window.location.href = 'super_admin_reports.html';
}

function showSubscriptions() {
  switchView('subscriptions');
  setActiveMenu(4);
  loadSubscriptionsData();
}

function showSettings() {
  // Create a proper settings interface instead of just an alert
  const modal = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    " onclick="closeModal()">
      <div style="
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      " onclick="event.stopPropagation()">
        
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
        ">
          <h3 style="margin: 0; color: #1e4fa1; font-size: 20px;">Platform Settings</h3>
          <button onclick="closeModal()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
          ">&times;</button>
        </div>

        <div style="padding: 32px;">
          <div style="margin-bottom: 24px;">
            <h4 style="margin: 0 0 12px 0;">System Configuration</h4>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
              <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="checkbox" checked> Email Notifications
              </label>
              <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="checkbox" checked> SMS Alerts
              </label>
              <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="checkbox"> Auto Backup
              </label>
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" checked> System Monitoring
              </label>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <h4 style="margin: 0 0 12px 0;">Security Settings</h4>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Session Timeout (minutes)</label>
                <input type="number" value="30" style="width: 100px; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 600;">Password Policy</label>
                <select style="width: 200px; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                  <option>Standard</option>
                  <option>Strong</option>
                  <option>Very Strong</option>
                </select>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button onclick="closeModal()" style="
              background: #6b7280;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Cancel</button>
            <button onclick="saveSettings()" style="
              background: #1e4fa1;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
}

function saveSettings() {
  closeModal();
  alert('Platform settings saved successfully!');
}

function switchView(viewName) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  // Show selected view
  const targetView = document.getElementById(viewName + 'View');
  if (targetView) {
    targetView.classList.add('active');
  }
  
  currentView = viewName;
}

function setActiveMenu(index) {
  document.querySelectorAll('.menu').forEach(menu => {
    menu.classList.remove('active');
  });
  
  document.querySelectorAll('.menu')[index].classList.add('active');
}

// ================= DASHBOARD FUNCTIONS =================
function loadHospitalStats() {
  // Calculate real statistics from hospital data
  const totalHospitals = mockHospitals.length;
  const activeHospitals = mockHospitals.filter(h => h.status === 'active').length;
  const inactiveHospitals = totalHospitals - activeHospitals;
  
  // Calculate total revenue
  const totalRevenue = mockHospitals.reduce((sum, hospital) => sum + hospital.revenue, 0);
  
  // Calculate revenue by plan
  const premiumRevenue = mockHospitals
    .filter(h => h.plan === 'premium')
    .reduce((sum, h) => sum + h.revenue, 0);
  const standardRevenue = mockHospitals
    .filter(h => h.plan === 'standard')
    .reduce((sum, h) => sum + h.revenue, 0);
  
  // Calculate platform usage percentage
  const usagePercentage = totalHospitals > 0 ? Math.round((activeHospitals / totalHospitals) * 100) : 0;
  
  // Update the statistics in the HTML
  document.getElementById('totalHospitals').textContent = totalHospitals;
  document.getElementById('activeHospitals').textContent = activeHospitals;
  document.getElementById('monthlyRevenue').textContent = `₹${totalRevenue.toLocaleString()}`;
  
  // Update sub-text with real data
  const totalCard = document.querySelector('#totalHospitals').parentElement;
  totalCard.querySelector('.sub-text').textContent = `${activeHospitals} Active • ${inactiveHospitals} Inactive`;
  
  const activeCard = document.querySelector('#activeHospitals').parentElement;
  activeCard.querySelector('.sub-text').textContent = `${usagePercentage}% Platform Usage`;
  
  const revenueCard = document.querySelector('#monthlyRevenue').parentElement;
  revenueCard.querySelector('.sub-text').innerHTML = `Premium: ₹${premiumRevenue.toLocaleString()}<br />Standard: ₹${standardRevenue.toLocaleString()}`;
  
  // Load hospital stats table and today's appointments
  loadHospitalStatsTable();
  loadTodayAppointments();
}

function loadHospitalStatsTable() {
  const tbody = document.getElementById('hospitalStatsBody');
  tbody.innerHTML = '';
  
  mockHospitals.slice(0, 5).forEach(hospital => {
    const row = `
      <tr>
        <td>${hospital.id}</td>
        <td>${hospital.name}</td>
        <td>${hospital.city}</td>
        <td>
          <div class="module-badges">
            ${hospital.modules.map(module => `<span class="badge">${module}</span>`).join('')}
          </div>
        </td>
        <td>₹${hospital.revenue.toLocaleString()}</td>
        <td><span class="status ${hospital.status}">${hospital.status.charAt(0).toUpperCase() + hospital.status.slice(1)}</span></td>
        <td>
          <button class="action-btn view" onclick="viewHospital('${hospital.id}')">View</button>
          <button class="action-btn edit" onclick="editHospital('${hospital.id}')">Edit</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

// ================= TODAY'S APPOINTMENTS =================
const todayAppointments = [
  {
    id: 'APT-001',
    time: '09:00 AM',
    patientName: 'Rajesh Kumar',
    phone: '+91 9876543210',
    doctor: 'Dr. Sharma',
    hospital: 'Apollo Hospitals',
    department: 'Cardiology',
    status: 'scheduled'
  },
  {
    id: 'APT-002',
    time: '09:30 AM',
    patientName: 'Priya Singh',
    phone: '+91 9876543211',
    doctor: 'Dr. Patel',
    hospital: 'Fortis Healthcare',
    department: 'Dermatology',
    status: 'in-progress'
  },
  {
    id: 'APT-003',
    time: '10:00 AM',
    patientName: 'Amit Gupta',
    phone: '+91 9876543212',
    doctor: 'Dr. Reddy',
    hospital: 'Max Healthcare',
    department: 'Orthopedics',
    status: 'completed'
  },
  {
    id: 'APT-004',
    time: '10:30 AM',
    patientName: 'Sunita Devi',
    phone: '+91 9876543213',
    doctor: 'Dr. Joshi',
    hospital: 'Apollo Hospitals',
    department: 'Gynecology',
    status: 'scheduled'
  },
  {
    id: 'APT-005',
    time: '11:00 AM',
    patientName: 'Vikram Yadav',
    phone: '+91 9876543214',
    doctor: 'Dr. Mehta',
    hospital: 'Manipal Hospitals',
    department: 'Neurology',
    status: 'cancelled'
  },
  {
    id: 'APT-006',
    time: '11:30 AM',
    patientName: 'Kavita Sharma',
    phone: '+91 9876543215',
    doctor: 'Dr. Agarwal',
    hospital: 'Fortis Healthcare',
    department: 'Pediatrics',
    status: 'scheduled'
  },
  {
    id: 'APT-007',
    time: '02:00 PM',
    patientName: 'Ravi Verma',
    phone: '+91 9876543216',
    doctor: 'Dr. Singh',
    hospital: 'Max Healthcare',
    department: 'ENT',
    status: 'scheduled'
  },
  {
    id: 'APT-008',
    time: '02:30 PM',
    patientName: 'Meera Jain',
    phone: '+91 9876543217',
    doctor: 'Dr. Kumar',
    hospital: 'Apollo Hospitals',
    department: 'Ophthalmology',
    status: 'completed'
  }
];

function loadTodayAppointments() {
  const tbody = document.getElementById('todayAppointmentsBody');
  const countElement = document.getElementById('todayAppointmentCount');
  
  tbody.innerHTML = '';
  countElement.textContent = todayAppointments.length;
  
  todayAppointments.forEach(appointment => {
    const row = `
      <tr>
        <td><strong>${appointment.time}</strong></td>
        <td>${appointment.patientName}</td>
        <td>${appointment.phone}</td>
        <td>${appointment.doctor}</td>
        <td>${appointment.hospital}</td>
        <td>${appointment.department}</td>
        <td><span class="appointment-status ${appointment.status}">${appointment.status.replace('-', ' ')}</span></td>
        <td>
          <button class="action-btn view" onclick="viewAppointment('${appointment.id}')">View</button>
          ${appointment.status === 'scheduled' ? 
            `<button class="action-btn edit" onclick="rescheduleAppointment('${appointment.id}')">Reschedule</button>` : 
            `<button class="action-btn" onclick="viewAppointmentDetails('${appointment.id}')">Details</button>`
          }
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

function viewAppointment(appointmentId) {
  const appointment = todayAppointments.find(apt => apt.id === appointmentId);
  if (appointment) {
    const detailsModal = `
      <div id="appointmentModal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      " onclick="closeAppointmentModal()">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 16px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        " onclick="event.stopPropagation()">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #1e4fa1;">Appointment Details</h3>
            <button onclick="closeAppointmentModal()" style="
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              color: #6b7280;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 4px;
            " onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">&times;</button>
          </div>
          
          <div style="display: grid; gap: 15px;">
            <div style="display: flex; justify-content: space-between;">
              <strong>Patient Name:</strong>
              <span>${appointment.patientName}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <strong>Phone:</strong>
              <span>${appointment.phone}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <strong>Doctor:</strong>
              <span>${appointment.doctor}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <strong>Time:</strong>
              <span>${appointment.time}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <strong>Hospital:</strong>
              <span>${appointment.hospital}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <strong>Department:</strong>
              <span>${appointment.department}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <strong>Status:</strong>
              <span style="
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                background: ${appointment.status === 'scheduled' ? '#eff6ff' : 
                           appointment.status === 'completed' ? '#dcfce7' : 
                           appointment.status === 'in-progress' ? '#fef3c7' : '#fee2e2'};
                color: ${appointment.status === 'scheduled' ? '#1e40af' : 
                        appointment.status === 'completed' ? '#166534' : 
                        appointment.status === 'in-progress' ? '#d97706' : '#dc2626'};
              ">${appointment.status.replace('-', ' ')}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <strong>Appointment ID:</strong>
              <span>${appointment.id}</span>
            </div>
          </div>
          
          <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: flex-end;">
            ${appointment.status === 'scheduled' ? 
              `<button onclick="rescheduleAppointment('${appointment.id}')" style="
                background: #f59e0b;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
              ">Reschedule</button>` : ''
            }
            <button onclick="closeAppointmentModal()" style="
              background: #1e4fa1;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Close</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', detailsModal);
  }
}

// Helper function to close appointment modal
function closeAppointmentModal() {
  const modal = document.getElementById('appointmentModal');
  if (modal) {
    modal.remove();
  }
}

function rescheduleAppointment(appointmentId) {
  const appointment = todayAppointments.find(apt => apt.id === appointmentId);
  if (appointment) {
    const rescheduleModal = `
      <div id="rescheduleModal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      " onclick="closeRescheduleModal()">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 16px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        " onclick="event.stopPropagation()">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #1e4fa1;">Reschedule Appointment</h3>
            <button onclick="closeRescheduleModal()" style="
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              color: #6b7280;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 4px;
            " onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">&times;</button>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p><strong>Patient:</strong> ${appointment.patientName}</p>
            <p><strong>Doctor:</strong> ${appointment.doctor}</p>
            <p><strong>Current Time:</strong> ${appointment.time}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">New Date:</label>
            <input type="date" style="
              width: 100%;
              padding: 10px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              margin-bottom: 15px;
            ">
            
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">New Time:</label>
            <input type="time" style="
              width: 100%;
              padding: 10px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
            ">
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="closeRescheduleModal()" style="
              background: #6b7280;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Cancel</button>
            <button onclick="confirmReschedule('${appointment.id}')" style="
              background: #1e4fa1;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Confirm Reschedule</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', rescheduleModal);
  }
}

// Helper function to close reschedule modal
function closeRescheduleModal() {
  const modal = document.getElementById('rescheduleModal');
  if (modal) {
    modal.remove();
  }
}

function confirmReschedule(appointmentId) {
  // Close the modal
  closeRescheduleModal();
  
  // Show success message
  const appointment = todayAppointments.find(apt => apt.id === appointmentId);
  alert(`Appointment for ${appointment.patientName} has been rescheduled successfully!`);
}

function viewAppointmentDetails(appointmentId) {
  // This is the same as viewAppointment - just call that function
  viewAppointment(appointmentId);
}

function exportTodayAppointments() {
  alert('Exporting today\'s appointments to Excel...');
}

// ================= USER MANAGEMENT =================
function loadUserManagementData() {
  // Update user statistics
  document.getElementById('totalUsers').textContent = '247';
  document.getElementById('activeUsers').textContent = '231';
  document.getElementById('newUsers').textContent = '18';
  document.getElementById('pendingUsers').textContent = '5';
}

// ================= SUBSCRIPTIONS MANAGEMENT =================
function loadSubscriptionsData() {
  // Update subscription statistics
  document.getElementById('totalSubscriptions').textContent = '5';
  document.getElementById('activeSubscriptions').textContent = '4';
  document.getElementById('subscriptionRevenue').textContent = '₹1,70,000';
  document.getElementById('expiringSubscriptions').textContent = '2';
}

function createNewPlan() {
  const modal = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    " onclick="closeModal()">
      <div style="
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      " onclick="event.stopPropagation()">
        
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
        ">
          <h3 style="margin: 0; color: #1e4fa1; font-size: 20px;">Create New Subscription Plan</h3>
          <button onclick="closeModal()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
          ">&times;</button>
        </div>

        <div style="padding: 32px;">
          <form id="createPlanForm">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Plan Name *</label>
                <input type="text" id="planName" placeholder="e.g., Enterprise Plan" required style="
                  width: 100%;
                  padding: 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 8px;
                ">
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Monthly Price *</label>
                <input type="number" id="planPrice" placeholder="e.g., 20000" required style="
                  width: 100%;
                  padding: 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 8px;
                ">
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Included Modules</label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <label style="display: flex; align-items: center; gap: 8px;">
                  <input type="checkbox" value="op" checked> OP Module
                </label>
                <label style="display: flex; align-items: center; gap: 8px;">
                  <input type="checkbox" value="lab" checked> Lab Module
                </label>
                <label style="display: flex; align-items: center; gap: 8px;">
                  <input type="checkbox" value="pharmacy"> Pharmacy Module
                </label>
                <label style="display: flex; align-items: center; gap: 8px;">
                  <input type="checkbox" value="billing"> Billing Module
                </label>
                <label style="display: flex; align-items: center; gap: 8px;">
                  <input type="checkbox" value="ipd"> IPD Module (Coming Soon)
                </label>
                <label style="display: flex; align-items: center; gap: 8px;">
                  <input type="checkbox" value="emergency"> Emergency Module (Coming Soon)
                </label>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Support Level</label>
              <select id="supportLevel" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
              ">
                <option value="email">Email Support</option>
                <option value="phone">Phone Support</option>
                <option value="24x7">24/7 Premium Support</option>
              </select>
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Plan Description</label>
              <textarea id="planDescription" rows="3" placeholder="Describe the plan features and benefits..." style="
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                resize: vertical;
              "></textarea>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button type="button" onclick="closeModal()" style="
                background: #6b7280;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
              ">Cancel</button>
              <button type="submit" style="
                background: #1e4fa1;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
              ">Create Plan</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
  
  // Add form submission handler
  document.getElementById('createPlanForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const planName = document.getElementById('planName').value;
    const planPrice = document.getElementById('planPrice').value;
    closeModal();
    alert(`New plan "${planName}" created successfully!\n\nPrice: ₹${planPrice}/month\nPlan is now available for hospitals to subscribe.`);
  });
}

function bulkRenewal() {
  const modal = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    " onclick="closeModal()">
      <div style="
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      " onclick="event.stopPropagation()">
        
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
        ">
          <h3 style="margin: 0; color: #1e4fa1; font-size: 20px;">Bulk Subscription Renewal</h3>
          <button onclick="closeModal()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
          ">&times;</button>
        </div>

        <div style="padding: 32px;">
          <div style="margin-bottom: 24px;">
            <h4 style="margin: 0 0 12px 0;">Select Hospitals for Renewal</h4>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
              <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="checkbox" value="HSP-1001" checked> Apollo Hospitals (Premium - ₹15,000/month)
              </label>
              <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="checkbox" value="HSP-1002" checked> Fortis Healthcare (Standard - ₹8,000/month)
              </label>
              <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="checkbox" value="HSP-1003"> Max Healthcare (Premium - ₹15,000/month)
              </label>
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" value="HSP-1004"> Manipal Hospitals (Standard - ₹8,000/month)
              </label>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Renewal Period</label>
              <select id="renewalPeriod" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
              ">
                <option value="6">6 Months</option>
                <option value="12" selected>12 Months</option>
                <option value="24">24 Months</option>
              </select>
            </div>
            
            <div>
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Discount (%)</label>
              <input type="number" id="discountPercent" placeholder="e.g., 10" min="0" max="50" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
              ">
            </div>
          </div>

          <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">Renewal Summary</h4>
            <p style="margin: 0; color: #1e40af;">Selected: 2 hospitals</p>
            <p style="margin: 0; color: #1e40af;">Total Cost: ₹2,76,000 (12 months)</p>
            <p style="margin: 0; color: #1e40af;">After Discount: ₹2,76,000</p>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button onclick="closeModal()" style="
              background: #6b7280;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Cancel</button>
            <button onclick="processBulkRenewal()" style="
              background: #16a34a;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Process Renewals</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
}

function exportSubscriptions() {
  const modal = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    " onclick="closeModal()">
      <div style="
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      " onclick="event.stopPropagation()">
        
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
        ">
          <h3 style="margin: 0; color: #16a34a; font-size: 20px;">📊 Export Subscription Data</h3>
          <button onclick="closeModal()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
          ">&times;</button>
        </div>

        <div style="padding: 32px;">
          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0;">Select Export Format</h4>
            <div style="display: flex; gap: 12px;">
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="radio" name="exportFormat" value="excel" checked> Excel (.xlsx)
              </label>
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="radio" name="exportFormat" value="csv"> CSV (.csv)
              </label>
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="radio" name="exportFormat" value="pdf"> PDF Report
              </label>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0;">Include Data</h4>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
              <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="checkbox" checked> Subscription Details
              </label>
              <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="checkbox" checked> Payment History
              </label>
              <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input type="checkbox"> Usage Statistics
              </label>
              <label style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox"> Revenue Analysis
              </label>
            </div>
          </div>

          <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 8px 0; color: #166534;">Export Preview</h4>
            <p style="margin: 0; color: #166534; font-size: 14px;">
              • 5 Hospital subscriptions<br>
              • Payment records from last 12 months<br>
              • Plan comparison data<br>
              • Revenue breakdown by hospital
            </p>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button onclick="closeModal()" style="
              background: #6b7280;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Cancel</button>
            <button onclick="downloadExport()" style="
              background: #16a34a;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Download Export</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
}

// Helper functions
function closeModal() {
  const modal = document.querySelector('div[style*="position: fixed"]');
  if (modal) {
    modal.remove();
  }
}

function processBulkRenewal() {
  closeModal();
  alert('Bulk renewal processed successfully!\n\n• 2 hospitals renewed for 12 months\n• Total amount: ₹2,76,000\n• Payment confirmations sent\n• Services extended automatically');
}

function downloadExport() {
  closeModal();
  alert('Export started!\n\n📊 Generating subscription report...\n📧 Download link will be sent to your email\n⏱️ Estimated time: 2-3 minutes');
}

function viewSubscription(hospitalCode) {
  alert(`Viewing subscription details for ${hospitalCode}:\n\n• Current plan and features\n• Payment history\n• Usage statistics\n• Renewal dates\n• Billing information`);
}

function editSubscription(hospitalCode) {
  alert(`Edit subscription for ${hospitalCode}:\n\n• Change plan\n• Update billing info\n• Modify features\n• Extend/reduce period\n• Apply discounts`);
}

function activateSubscription(hospitalCode) {
  if (confirm(`Activate subscription for ${hospitalCode}?`)) {
    alert(`Subscription activated successfully for ${hospitalCode}!\n\nServices restored and hospital notified.`);
  }
}

function manageRole(roleType) {
  const roleData = {
    'front-desk': {
      name: 'Front Desk / OP Staff',
      users: [
        { name: 'Rajesh Kumar', email: 'rajesh.k@apollo.com', hospital: 'Apollo Hospitals', status: 'active', lastLogin: '2 hours ago' },
        { name: 'Priya Sharma', email: 'priya.s@fortis.com', hospital: 'Fortis Healthcare', status: 'active', lastLogin: '1 hour ago' },
        { name: 'Amit Singh', email: 'amit.s@max.com', hospital: 'Max Healthcare', status: 'inactive', lastLogin: '2 days ago' },
        { name: 'Sunita Devi', email: 'sunita.d@manipal.com', hospital: 'Manipal Hospitals', status: 'active', lastLogin: '30 minutes ago' }
      ],
      permissions: ['Patient Registration', 'Appointment Scheduling', 'Reception Duties', 'Basic Reports']
    },
    'doctor': {
      name: 'Doctors',
      users: [
        { name: 'Dr. Rajesh Sharma', email: 'dr.sharma@apollo.com', hospital: 'Apollo Hospitals', status: 'active', lastLogin: '1 hour ago', specialization: 'Cardiology' },
        { name: 'Dr. Priya Patel', email: 'dr.patel@fortis.com', hospital: 'Fortis Healthcare', status: 'active', lastLogin: '2 hours ago', specialization: 'Dermatology' },
        { name: 'Dr. Amit Reddy', email: 'dr.reddy@max.com', hospital: 'Max Healthcare', status: 'active', lastLogin: '3 hours ago', specialization: 'Orthopedics' }
      ],
      permissions: ['Patient Consultation', 'Diagnosis', 'Treatment Planning', 'Medical Records', 'Prescription Writing']
    },
    'nurse': {
      name: 'Nurses',
      users: [
        { name: 'Nurse Kavita Singh', email: 'kavita.s@apollo.com', hospital: 'Apollo Hospitals', status: 'active', lastLogin: '30 minutes ago' },
        { name: 'Nurse Meera Jain', email: 'meera.j@fortis.com', hospital: 'Fortis Healthcare', status: 'active', lastLogin: '1 hour ago' },
        { name: 'Nurse Ravi Kumar', email: 'ravi.k@max.com', hospital: 'Max Healthcare', status: 'active', lastLogin: '45 minutes ago' }
      ],
      permissions: ['Patient Care', 'Medication Administration', 'Vital Signs Monitoring', 'Patient Records Update']
    },
    'lab-tech': {
      name: 'Lab Technicians',
      users: [
        { name: 'Lab Tech Amit Kumar', email: 'amit.lab@apollo.com', hospital: 'Apollo Hospitals', status: 'active', lastLogin: '2 hours ago' },
        { name: 'Lab Tech Priya Singh', email: 'priya.lab@fortis.com', hospital: 'Fortis Healthcare', status: 'active', lastLogin: '1 hour ago' }
      ],
      permissions: ['Sample Collection', 'Test Processing', 'Result Entry', 'Equipment Maintenance']
    },
    'pharmacist': {
      name: 'Pharmacists',
      users: [
        { name: 'Pharmacist Rajesh Gupta', email: 'rajesh.pharma@apollo.com', hospital: 'Apollo Hospitals', status: 'active', lastLogin: '3 hours ago' },
        { name: 'Pharmacist Sunita Sharma', email: 'sunita.pharma@max.com', hospital: 'Max Healthcare', status: 'active', lastLogin: '2 hours ago' }
      ],
      permissions: ['Medication Dispensing', 'Inventory Management', 'Drug Information', 'Prescription Verification']
    },
    'billing': {
      name: 'Billing Staff',
      users: [
        { name: 'Billing Officer Vikram Yadav', email: 'vikram.billing@apollo.com', hospital: 'Apollo Hospitals', status: 'active', lastLogin: '1 hour ago' },
        { name: 'Billing Clerk Kavita Joshi', email: 'kavita.billing@fortis.com', hospital: 'Fortis Healthcare', status: 'active', lastLogin: '4 hours ago' }
      ],
      permissions: ['Invoice Generation', 'Payment Processing', 'Insurance Claims', 'Financial Reports']
    },
    'patient': {
      name: 'Patients',
      users: [
        { name: 'Patient Ravi Verma', email: 'ravi.patient@gmail.com', hospital: 'Apollo Hospitals', status: 'active', lastLogin: '1 day ago' },
        { name: 'Patient Meera Singh', email: 'meera.patient@gmail.com', hospital: 'Fortis Healthcare', status: 'active', lastLogin: '2 days ago' },
        { name: 'Patient Amit Gupta', email: 'amit.patient@gmail.com', hospital: 'Max Healthcare', status: 'active', lastLogin: '3 days ago' }
      ],
      permissions: ['View Medical Records', 'Book Appointments', 'View Test Results', 'Update Profile']
    },
    'admin': {
      name: 'Hospital Admins',
      users: [
        { name: 'Admin Rajesh Kumar', email: 'admin.rajesh@apollo.com', hospital: 'Apollo Hospitals', status: 'active', lastLogin: '30 minutes ago' },
        { name: 'Admin Priya Sharma', email: 'admin.priya@fortis.com', hospital: 'Fortis Healthcare', status: 'active', lastLogin: '2 hours ago' }
      ],
      permissions: ['Hospital Management', 'Staff Oversight', 'Reporting', 'System Configuration']
    }
  };

  const role = roleData[roleType];
  if (!role) return;

  const modal = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    " onclick="this.remove()">
      <div style="
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      " onclick="event.stopPropagation()">
        
        <!-- Header -->
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
        ">
          <div>
            <h3 style="margin: 0; color: #1e4fa1; font-size: 20px;">Manage ${role.name}</h3>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${role.users.length} users across all hospitals</p>
          </div>
          <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">&times;</button>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          
          <!-- Action Buttons -->
          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            <button onclick="addNewRoleUser('${roleType}')" style="
              background: #1e4fa1;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
            ">+ Add New ${role.name.includes('/') ? role.name.split('/')[0].trim() : role.name.slice(0, -1)}</button>
            
            <button onclick="exportRoleUsers('${roleType}')" style="
              background: #16a34a;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
            ">Export List</button>
            
            <button onclick="bulkActions('${roleType}')" style="
              background: #f59e0b;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
            ">Bulk Actions</button>
          </div>

          <!-- Permissions Section -->
          <div style="margin-bottom: 32px;">
            <h4 style="margin: 0 0 12px 0; color: #374151;">Role Permissions</h4>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${role.permissions.map(permission => `
                <span style="
                  background: #eff6ff;
                  color: #1e40af;
                  padding: 4px 8px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: 600;
                ">${permission}</span>
              `).join('')}
            </div>
          </div>

          <!-- Users Table -->
          <div style="background: #f8fafc; border-radius: 12px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #e5e7eb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Name</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Email</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Hospital</th>
                  ${roleType === 'doctor' ? '<th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Specialization</th>' : ''}
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Status</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Last Login</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${role.users.map(user => `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: 600;">${user.name}</td>
                    <td style="padding: 12px; color: #6b7280;">${user.email}</td>
                    <td style="padding: 12px;">${user.hospital}</td>
                    ${roleType === 'doctor' ? `<td style="padding: 12px;">${user.specialization || '-'}</td>` : ''}
                    <td style="padding: 12px;">
                      <span style="
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                        background: ${user.status === 'active' ? '#dcfce7' : '#fee2e2'};
                        color: ${user.status === 'active' ? '#166534' : '#dc2626'};
                      ">${user.status}</span>
                    </td>
                    <td style="padding: 12px; color: #6b7280;">${user.lastLogin}</td>
                    <td style="padding: 12px;">
                      <button onclick="editUser('${user.email}')" style="
                        background: #fef3c7;
                        color: #d97706;
                        border: 1px solid #fcd34d;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        cursor: pointer;
                        margin-right: 4px;
                      ">Edit</button>
                      <button onclick="toggleUserStatus('${user.email}')" style="
                        background: ${user.status === 'active' ? '#fee2e2' : '#dcfce7'};
                        color: ${user.status === 'active' ? '#dc2626' : '#166534'};
                        border: 1px solid ${user.status === 'active' ? '#fca5a5' : '#86efac'};
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        cursor: pointer;
                      ">${user.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
}

// Helper functions for role management
function addNewRoleUser(roleType) {
  document.querySelector('div[style*="position: fixed"]').remove();
  showAddUser();
  // Pre-select the role
  setTimeout(() => {
    document.getElementById('userRole').value = roleType;
    updateRoleFields();
  }, 100);
}

function exportRoleUsers(roleType) {
  alert(`Exporting all ${roleType} users to Excel...`);
}

function bulkActions(roleType) {
  alert(`Bulk actions for ${roleType} users:\n\n• Bulk activate/deactivate\n• Bulk hospital transfer\n• Bulk permission updates\n• Bulk email notifications`);
}

function editUser(email) {
  alert(`Edit user: ${email}\n\nThis would open the user edit form with:\n• Personal information\n• Role and permissions\n• Hospital assignment\n• Account settings`);
}

function toggleUserStatus(email) {
  if (confirm(`Toggle status for user: ${email}?`)) {
    alert(`User status toggled successfully!`);
    // Refresh the modal or update the status
  }
}

function showAddUser() {
  document.getElementById('addUserModal').classList.add('active');
  generateUsername();
}

function closeAddUser() {
  document.getElementById('addUserModal').classList.remove('active');
  resetAddUserForm();
}

function resetAddUserForm() {
  document.getElementById('addUserForm').reset();
  hideAllRoleFields();
}

function generateUsername() {
  // Generate a random username
  const timestamp = Date.now().toString().slice(-4);
  document.getElementById('userUsername').value = `user${timestamp}`;
}

function updateRoleFields() {
  const role = document.getElementById('userRole').value;
  
  // Hide all role-specific fields first
  hideAllRoleFields();
  
  // Show relevant fields based on selected role
  switch(role) {
    case 'doctor':
      document.getElementById('doctorFields').style.display = 'block';
      document.getElementById('doctorLicense').style.display = 'block';
      break;
    case 'nurse':
      document.getElementById('nurseFields').style.display = 'block';
      break;
    case 'lab-tech':
      document.getElementById('labFields').style.display = 'block';
      break;
  }
}

function hideAllRoleFields() {
  document.getElementById('doctorFields').style.display = 'none';
  document.getElementById('doctorLicense').style.display = 'none';
  document.getElementById('nurseFields').style.display = 'none';
  document.getElementById('labFields').style.display = 'none';
}

// Add User Form Submission
const addUserForm = document.getElementById('addUserForm');
if (addUserForm) {
  addUserForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const userData = {
      firstName: document.getElementById('userFirstName').value,
      lastName: document.getElementById('userLastName').value,
      email: document.getElementById('userEmail').value,
      phone: document.getElementById('userPhone').value,
      dob: document.getElementById('userDOB').value,
      gender: document.getElementById('userGender').value,
      role: document.getElementById('userRole').value,
      hospital: document.getElementById('userHospital').value,
      username: document.getElementById('userUsername').value,
      password: document.getElementById('userPassword').value,
      address: document.getElementById('userAddress').value,
      emergencyContactName: document.getElementById('emergencyContactName').value,
      emergencyContactPhone: document.getElementById('emergencyContactPhone').value,
      specialization: document.getElementById('doctorSpecialization')?.value || '',
      licenseNumber: document.getElementById('doctorLicenseNumber')?.value || 
                     document.getElementById('nurseLicenseNumber')?.value || 
                     document.getElementById('labCertification')?.value || '',
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    
    // Close modal and show success
    closeAddUser();
    
    // Show success message with user details
    const hospitalName = document.querySelector(`#userHospital option[value="${userData.hospital}"]`).textContent;
    const roleName = document.querySelector(`#userRole option[value="${userData.role}"]`).textContent;
    
    alert(`User created successfully!\n\nName: ${userData.firstName} ${userData.lastName}\nRole: ${roleName}\nHospital: ${hospitalName}\nUsername: ${userData.username}\n\nThe user will receive login credentials via email.`);
    
    // In a real application, this would send the data to the server
    console.log('New user data:', userData);
  });
}

function exportUserData() {
  alert('Exporting user data to Excel...\n\nIncludes:\n• All user roles\n• Hospital assignments\n• Activity logs\n• Permission details');
}

function downloadHospitalStats() {
  alert('Exporting hospital statistics to Excel...');
  // In real implementation, this would generate and download an Excel file
}

// ================= HOSPITAL MANAGEMENT =================
function loadHospitalsTable() {
  const tbody = document.getElementById('hospitalsTableBody');
  tbody.innerHTML = '';
  
  const startIndex = (currentHospitalPage - 1) * hospitalsPerPage;
  const endIndex = startIndex + hospitalsPerPage;
  const pageHospitals = filteredHospitals.slice(startIndex, endIndex);
  
  pageHospitals.forEach(hospital => {
    // Dynamic button based on hospital status
    const statusButton = hospital.status === 'active' 
      ? `<button class="action-btn delete" onclick="toggleHospitalStatus('${hospital.id}')">Deactivate</button>`
      : `<button class="action-btn activate" onclick="toggleHospitalStatus('${hospital.id}')">Activate</button>`;
    
    const row = `
      <tr>
        <td>${hospital.id}</td>
        <td>${hospital.name}</td>
        <td>${hospital.city}</td>
        <td>
          <span class="badge ${hospital.plan}">${hospital.plan.charAt(0).toUpperCase() + hospital.plan.slice(1)}</span>
        </td>
        <td>
          <span class="status ${hospital.status}">${hospital.status.charAt(0).toUpperCase() + hospital.status.slice(1)}</span>
        </td>
        <td>
          <button class="action-btn view" onclick="viewHospital('${hospital.id}')">View</button>
          <button class="action-btn edit" onclick="editHospital('${hospital.id}')">Edit</button>
          ${statusButton}
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
  
  updateHospitalPagination();
}

function applyHospitalFilters() {
  const searchTerm = document.getElementById('hospitalSearch').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const planFilter = document.getElementById('planFilter').value;
  
  filteredHospitals = mockHospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm) || 
                         hospital.id.toLowerCase().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || hospital.status === statusFilter;
    const matchesPlan = planFilter === 'all' || hospital.plan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });
  
  currentHospitalPage = 1;
  loadHospitalsTable();
}

function updateHospitalPagination() {
  const totalPages = Math.ceil(filteredHospitals.length / hospitalsPerPage);
  document.getElementById('hospitalPageInfo').textContent = `Page ${currentHospitalPage} of ${totalPages}`;
}

function prevHospitalPage() {
  if (currentHospitalPage > 1) {
    currentHospitalPage--;
    loadHospitalsTable();
  }
}

function nextHospitalPage() {
  const totalPages = Math.ceil(filteredHospitals.length / hospitalsPerPage);
  if (currentHospitalPage < totalPages) {
    currentHospitalPage++;
    loadHospitalsTable();
  }
}

function toggleHospitalStatus(hospitalId) {
  const hospital = mockHospitals.find(h => h.id === hospitalId);
  if (hospital) {
    const newStatus = hospital.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} ${hospital.name}?`)) {
      hospital.status = newStatus;
      
      // Save to localStorage
      saveHospitalsToStorage();
      
      // Update filtered hospitals array
      filteredHospitals = [...mockHospitals];
      
      loadHospitalsTable();
      loadHospitalStats(); // Refresh dashboard stats
      
      const message = newStatus === 'active' 
        ? `${hospital.name} has been activated successfully!`
        : `${hospital.name} has been deactivated successfully!`;
      
      alert(message);
    }
  }
}

// ================= HOSPITAL ACTIONS =================
function viewHospital(hospitalId) {
  const hospital = mockHospitals.find(h => h.id === hospitalId);
  if (hospital) {
    alert(`Viewing details for ${hospital.name}\n\nID: ${hospital.id}\nLocation: ${hospital.city}, ${hospital.state}\nPlan: ${hospital.plan}\nStatus: ${hospital.status}`);
  }
}

function editHospital(hospitalId) {
  const hospital = mockHospitals.find(h => h.id === hospitalId);
  if (hospital) {
    // Fill the edit form with current hospital data
    document.getElementById('editHospitalCode').value = hospital.id;
    document.getElementById('editHospitalName').value = hospital.name;
    document.getElementById('editStreetAddress').value = hospital.address || '';
    document.getElementById('editCity').value = hospital.city;
    document.getElementById('editState').value = hospital.state || '';
    document.getElementById('editPhoneNumber').value = hospital.phone || '';
    document.getElementById('editEmailAddress').value = hospital.email || '';
    document.getElementById('editSubscriptionPlan').value = hospital.plan;
    document.getElementById('editHospitalStatus').value = hospital.status;
    
    // Store the hospital ID for updating
    document.getElementById('editHospitalModal').setAttribute('data-hospital-id', hospitalId);
    
    // Show the edit modal
    document.getElementById('editHospitalModal').classList.add('active');
  }
}

function closeEditHospital() {
  document.getElementById('editHospitalModal').classList.remove('active');
}

function deactivateHospital(hospitalId) {
  const hospital = mockHospitals.find(h => h.id === hospitalId);
  if (hospital && confirm(`Are you sure you want to deactivate ${hospital.name}?\n\nHospital access will be disabled, but data will be retained.`)) {
    hospital.status = 'inactive';
    loadHospitalsTable();
    loadHospitalStats();
    alert(`${hospital.name} has been deactivated successfully.`);
  }
}

// ================= CREATE HOSPITAL MODAL =================
function showCreateHospital() {
  document.getElementById('createHospitalModal').classList.add('active');
  generateHospitalCode();
}

function closeCreateHospital() {
  document.getElementById('createHospitalModal').classList.remove('active');
  resetHospitalForm();
}

function generateHospitalCode() {
  const nextId = mockHospitals.length + 1001;
  document.getElementById('hospitalCode').value = `HSP-${nextId}`;
}

function resetHospitalForm() {
  document.getElementById('createHospitalForm').reset();
  generateHospitalCode();
  document.getElementById('logoPreview').innerHTML = '<span>Click to upload logo</span>';
}

function previewLogo() {
  const fileInput = document.getElementById('hospitalLogo');
  const preview = document.getElementById('logoPreview');
  
  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Logo Preview">`;
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
}

// ================= FORM SUBMISSION =================
const createHospitalForm = document.getElementById('createHospitalForm');
if (createHospitalForm) {
  createHospitalForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
      id: document.getElementById('hospitalCode').value,
      name: document.getElementById('hospitalName').value,
      address: document.getElementById('streetAddress').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      phone: document.getElementById('phoneNumber').value,
      email: document.getElementById('emailAddress').value,
      plan: document.getElementById('subscriptionPlan').value,
      status: 'active',
      modules: ['OP'], // Default modules
      revenue: 0
    };
    
    // Add to mock data
    mockHospitals.push(formData);
    
    // Save to localStorage
    saveHospitalsToStorage();
    
    // Update filtered hospitals array
    filteredHospitals = [...mockHospitals];
    
    // Close modal and refresh
    closeCreateHospital();
    loadHospitalsTable();
    loadHospitalStats();
    
    alert(`${formData.name} has been added successfully!`);
  });
}

// Edit Hospital Form Submission
const editHospitalForm = document.getElementById('editHospitalForm');
if (editHospitalForm) {
  editHospitalForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const hospitalId = document.getElementById('editHospitalModal').getAttribute('data-hospital-id');
    const hospital = mockHospitals.find(h => h.id === hospitalId);
    
    if (hospital) {
      // Update hospital data
      hospital.name = document.getElementById('editHospitalName').value;
      hospital.address = document.getElementById('editStreetAddress').value;
      hospital.city = document.getElementById('editCity').value;
      hospital.state = document.getElementById('editState').value;
      hospital.phone = document.getElementById('editPhoneNumber').value;
      hospital.email = document.getElementById('editEmailAddress').value;
      hospital.plan = document.getElementById('editSubscriptionPlan').value;
      hospital.status = document.getElementById('editHospitalStatus').value;
      
      // Save to localStorage
      saveHospitalsToStorage();
      
      // Update filtered hospitals array
      filteredHospitals = [...mockHospitals];
      
      // Close modal and refresh
      closeEditHospital();
      loadHospitalsTable();
      loadHospitalStats();
      
      alert(`${hospital.name} has been updated successfully!`);
    }
  });
}

// ================= UTILITY FUNCTIONS =================
function goBackHome() {
  window.location.href = 'index.html';
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = 'index.html';
  }
}

// ================= SEARCH FUNCTIONALITY =================
// Only add event listener if the element exists
const hospitalSearchElement = document.getElementById('hospitalSearch');
if (hospitalSearchElement) {
  hospitalSearchElement.addEventListener('input', function() {
    // Auto-apply filters on search input
    setTimeout(applyHospitalFilters, 300);
  });
}

// ================= KEYBOARD SHORTCUTS =================
document.addEventListener('keydown', function(e) {
  // ESC to close modals
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('active');
    });
  }
});

// ================= CLICK OUTSIDE TO CLOSE MODAL =================
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
});