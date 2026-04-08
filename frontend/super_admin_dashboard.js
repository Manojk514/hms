// ================= DATA STORAGE =================
// These arrays cache API data only - never hardcoded values
let mockHospitals = [];
let filteredHospitals = [];

let currentView = 'dashboard';
let currentHospitalPage = 1;
const hospitalsPerPage = 10;


// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', function() {
  console.log('Super Admin Dashboard loaded');
  
  // Check for hash navigation or localStorage FIRST (before loading data)
  const hash = window.location.hash || localStorage.getItem('currentView') || '#dashboard';
  
  // Load subscription plans first
  loadSubscriptionPlans();
  
  // Load hospitals from API first
  loadHospitalsFromAPI().then(() => {
    // Now switch to the correct view
    if (hash === '#user-management') {
      showUserManagement();
    } else if (hash === '#hospitals') {
      showHospitals();
    } else if (hash === '#subscriptions') {
      showSubscriptions();
    } else if (hash === '#module-config') {
      showModuleConfigView();
    } else {
      showDashboard();
    }
    
    // Only load dashboard stats if we're on dashboard
    if (hash === '#dashboard' || !hash) {
      loadHospitalStats();
    }
    
    generateHospitalCode();
    
    console.log('Initialization complete');
  });
});

// ================= NAVIGATION =================
function showDashboard() {
  switchView('dashboard');
  setActiveMenu(0);
  window.location.hash = '#dashboard';
  localStorage.setItem('currentView', '#dashboard');
  loadHospitalStats();
}

function showHospitals() {
  switchView('hospital');
  setActiveMenu(1);
  window.location.hash = '#hospitals';
  localStorage.setItem('currentView', '#hospitals');
  loadHospitalsFromAPI();
}

function showUserManagement() {
  switchView('userManagement');
  setActiveMenu(2);
  window.location.hash = '#user-management';
  localStorage.setItem('currentView', '#user-management');
  loadUserManagementData();
}

function showModuleConfig() {
  window.location.href = 'super_admin_modules.html';
}

function showModuleConfigView() {
  switchView('moduleConfig');
  setActiveMenu(3);
  window.location.hash = '#module-config';
  localStorage.setItem('currentView', '#module-config');
  loadModuleConfigData();
}

function showReports() {
  window.location.href = 'super_admin_reports.html';
}

function showSubscriptions() {
  switchView('subscriptions');
  setActiveMenu(5);  // Fixed: Subscriptions is at index 5
  window.location.hash = '#subscriptions';
  localStorage.setItem('currentView', '#subscriptions');
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
async function loadHospitalStats() {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No token found, showing default values");
      // Show ₹0 for all revenue fields
      document.getElementById('totalHospitals').textContent = '0';
      document.getElementById('monthlyRevenue').textContent = '₹0';
      document.getElementById('activeHospitals').textContent = '0';
      document.getElementById('platformUsage').textContent = '0% Platform Usage';
      document.getElementById('hospitalBreakdown').textContent = '0 Active • 0 Inactive';
      document.getElementById('revenueBreakdown').innerHTML = 'No active subscriptions';
      return;
    }

    console.log("Loading dashboard statistics from API...");

    // Fetch dashboard statistics from backend API
    const res = await fetch("http://localhost/HMS/public/api/platform/admin/dashboard/statistics", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    console.log("Dashboard API response status:", res.status);

    if (!res.ok) {
      console.error('Failed to fetch dashboard statistics, status:', res.status);
      const errorText = await res.text();
      console.error('Error response:', errorText);
      // Show ₹0 on error
      document.getElementById('totalHospitals').textContent = '0';
      document.getElementById('monthlyRevenue').textContent = '₹0';
      document.getElementById('activeHospitals').textContent = '0';
      document.getElementById('platformUsage').textContent = '0% Platform Usage';
      document.getElementById('hospitalBreakdown').textContent = '0 Active • 0 Inactive';
      document.getElementById('revenueBreakdown').innerHTML = 'Failed to load data';
      return;
    }

    const result = await res.json();
    console.log("Dashboard API result:", result);
    
    if (!result.success) {
      console.error('Invalid response from dashboard API:', result);
      // Show ₹0 on error
      document.getElementById('totalHospitals').textContent = '0';
      document.getElementById('monthlyRevenue').textContent = '₹0';
      document.getElementById('activeHospitals').textContent = '0';
      document.getElementById('platformUsage').textContent = '0% Platform Usage';
      document.getElementById('hospitalBreakdown').textContent = '0 Active • 0 Inactive';
      document.getElementById('revenueBreakdown').innerHTML = 'Failed to load data';
      return;
    }

    const stats = result.data.statistics;
    console.log('Loaded dashboard statistics:', stats);

    // Update Monthly Revenue (from API)
    const monthlyRevenue = stats.total_monthly_revenue || 0;
    document.getElementById('monthlyRevenue').textContent = stats.formatted?.total_monthly_revenue || '₹0';
    
    // Update Active Hospitals (from API)
    const activeHospitalCount = stats.active_hospital_count || 0;
    document.getElementById('activeHospitals').textContent = activeHospitalCount;
    
    // Calculate total hospitals from mockHospitals array (for breakdown)
    const totalHospitals = mockHospitals.length;
    const inactiveHospitals = totalHospitals - activeHospitalCount;
    
    // Update Total Hospitals
    document.getElementById('totalHospitals').textContent = totalHospitals;
    
    // Update hospital breakdown
    document.getElementById('hospitalBreakdown').textContent = `${activeHospitalCount} Active • ${inactiveHospitals} Inactive`;
    
    // Update platform usage percentage
    const usagePercentage = totalHospitals > 0 ? Math.round((activeHospitalCount / totalHospitals) * 100) : 0;
    document.getElementById('platformUsage').textContent = `${usagePercentage}% Platform Usage`;
    
    // Update revenue breakdown
    if (stats.top_performing_plan) {
      const topPlan = stats.top_performing_plan;
      document.getElementById('revenueBreakdown').innerHTML = 
        `Top Plan: ${topPlan.plan_name}<br/>₹${topPlan.total_monthly_revenue.toLocaleString()} from ${topPlan.active_hospital_count} hospitals`;
    } else {
      document.getElementById('revenueBreakdown').innerHTML = 'No active subscriptions';
    }
    
    console.log("Dashboard statistics updated successfully");
    console.log("Total Hospitals:", totalHospitals, "Active:", activeHospitalCount, "Inactive:", inactiveHospitals);

  } catch (err) {
    console.error('Error loading dashboard statistics:', err);
    // Show ₹0 on error
    document.getElementById('totalHospitals').textContent = '0';
    document.getElementById('monthlyRevenue').textContent = '₹0';
    document.getElementById('activeHospitals').textContent = '0';
    document.getElementById('platformUsage').textContent = '0% Platform Usage';
    document.getElementById('hospitalBreakdown').textContent = '0 Active • 0 Inactive';
    document.getElementById('revenueBreakdown').innerHTML = 'Error loading data';
  }
  
  // Load hospital stats table and activities
  loadHospitalStatsTable();
  loadActivitySummary();
  loadRecentActivities();
}

async function loadRecentActivities() {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No token found, skipping recent activities");
      return;
    }

    const res = await fetch("http://localhost/HMS/public/api/platform/admin/dashboard", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const result = await res.json();
    
    if (!res.ok || !result.success) {
      console.error("Failed to load dashboard data:", result);
      return;
    }

    const activities = result.data.recent_activities || [];
    const container = document.getElementById('recentActivitiesContainer');
    
    if (!container) return;

    if (activities.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No recent activities</p>';
      return;
    }

    container.innerHTML = activities.map(activity => {
      const icon = getActivityIcon(activity.action);
      const timeAgo = formatTimeAgo(activity.timestamp);
      
      return `
        <div class="activity-item">
          <div class="activity-icon ${icon.class}">${icon.symbol}</div>
          <div class="activity-content">
            <h4>${formatActivityTitle(activity.action)}</h4>
            <p>${activity.description}</p>
            <span class="activity-time">${timeAgo}</span>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error("Error loading recent activities:", err);
  }
}

function getActivityIcon(action) {
  const icons = {
    'HOSPITAL_CREATED': { class: 'create', symbol: '+' },
    'HOSPITAL_UPDATED': { class: 'upgrade', symbol: '↗' },
    'HOSPITAL_DELETED': { class: 'delete', symbol: '×' },
    'HOSPITAL_STATUS_CHANGED': { class: 'upgrade', symbol: '↗' },
    'SUBSCRIPTION_CREATED': { class: 'renew', symbol: '⟳' },
    'SUBSCRIPTION_RENEWED': { class: 'renew', symbol: '⟳' },
    'SUBSCRIPTION_EXTENDED': { class: 'renew', symbol: '⟳' },
    'SUBSCRIPTION_UPGRADED': { class: 'upgrade', symbol: '↗' },
    'MODULE_ENABLED': { class: 'upgrade', symbol: '✓' },
    'MODULE_DISABLED': { class: 'delete', symbol: '×' },
    'MODULES_BULK_UPDATED': { class: 'upgrade', symbol: '⚙' },
  };
  
  return icons[action] || { class: 'create', symbol: '•' };
}

function formatActivityTitle(action) {
  const titles = {
    'HOSPITAL_CREATED': 'New Hospital Added',
    'HOSPITAL_UPDATED': 'Hospital Updated',
    'HOSPITAL_DELETED': 'Hospital Deleted',
    'HOSPITAL_STATUS_CHANGED': 'Hospital Status Changed',
    'SUBSCRIPTION_CREATED': 'Subscription Created',
    'SUBSCRIPTION_RENEWED': 'Plan Renewed',
    'SUBSCRIPTION_EXTENDED': 'Subscription Extended',
    'SUBSCRIPTION_UPGRADED': 'Plan Upgraded',
    'MODULE_ENABLED': 'Module Enabled',
    'MODULE_DISABLED': 'Module Disabled',
    'MODULES_BULK_UPDATED': 'Modules Updated',
  };
  
  return titles[action] || action.replace(/_/g, ' ');
}

function formatTimeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return past.toLocaleDateString();
}

function loadHospitalStatsTable() {
  console.log('loadHospitalStatsTable called, mockHospitals:', mockHospitals);
  const tbody = document.getElementById('hospitalStatsBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!Array.isArray(mockHospitals)) {
    console.warn("mockHospitals is not an array");
    return;
  }

  mockHospitals.slice(0, 5).forEach(hospital => {
    const modules = Array.isArray(hospital.modules) ? hospital.modules : [];

    const row = `
      <tr>
        <td>${hospital.hospital_code ?? '-'}</td>
        <td>${hospital.name ?? '-'}</td>
        <td>${hospital.city ?? '-'}</td>
        <td>
          <div class="module-badges">
            ${modules.map(module => `<span class="badge">${module}</span>`).join('')}
          </div>
        </td>
        <td>₹${(hospital.revenue || 0).toLocaleString()}</td>
        <td>
          <span class="status ${hospital.status || 'inactive'}">
            ${(hospital.status || 'inactive').charAt(0).toUpperCase() + (hospital.status || 'inactive').slice(1)}
          </span>
        </td>
        <td>
          <button class="action-btn view" onclick="viewHospitalDetails(${hospital.id})">View</button>
        </td>
      </tr>
    `;

    console.log('Generated row HTML:', row);
    tbody.innerHTML += row;
  });
  console.log('Hospital stats table loaded with', mockHospitals.length, 'hospitals');
}

async function viewHospitalDetails(hospitalId) {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = "super_admin_login.html";
      return;
    }

    // Fetch hospital details from API using numeric ID
    const res = await fetch(`http://localhost/HMS/public/api/platform/admin/hospitals/${hospitalId}`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const result = await res.json();
    
    if (!res.ok || !result.success) {
      alert(result.error?.message || "Failed to load hospital details");
      return;
    }

    const hospital = result.data.hospital;
    
    // Create modal with hospital details
    const modal = `
      <style>
        @media (max-width: 640px) {
          #hospitalLogoContainer {
            width: 60px !important;
            height: 60px !important;
          }
          #hospitalLogoPlaceholder {
            font-size: 24px !important;
          }
          .hospital-details-header {
            padding: 16px 20px !important;
          }
          .hospital-details-header h3 {
            font-size: 18px !important;
          }
        }
      </style>
      <div id="hospitalDetailsModal" style="
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
        overflow-y: auto;
      " onclick="closeHospitalDetailsModal()">
        <div style="
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          margin: 20px;
        " onclick="event.stopPropagation()">
          
          <div class="hospital-details-header" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 32px;
            border-bottom: 1px solid #e5e7eb;
            background: #f8fafc;
            position: sticky;
            top: 0;
            z-index: 1;
            gap: 16px;
          ">
            <h3 style="margin: 0; color: #1e4fa1; font-size: 20px; flex: 1;">Hospital Details</h3>
            
            <!-- Hospital Logo Container -->
            <div id="hospitalLogoContainer" style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 80px;
              height: 80px;
              border-radius: 12px;
              background: white;
              border: 2px solid #e5e7eb;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            ">
              <img id="hospitalLogoImage" 
                   src="" 
                   alt="Hospital Logo" 
                   style="
                     width: 100%;
                     height: 100%;
                     object-fit: contain;
                     display: none;
                   ">
              <div id="hospitalLogoPlaceholder" style="
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #1e4fa1 0%, #3b82f6 100%);
                color: white;
                font-size: 32px;
                font-weight: 700;
              ">
                ${hospital.name ? hospital.name.charAt(0).toUpperCase() : 'H'}
              </div>
            </div>
            
            <button onclick="closeHospitalDetailsModal()" style="
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              color: #6b7280;
              padding: 0;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">&times;</button>
          </div>

          <div style="padding: 32px;">
            <!-- Basic Information -->
            <div style="margin-bottom: 30px;">
              <h4 style="margin: 0 0 16px 0; color: #1e4fa1; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Basic Information</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">Hospital Code</label>
                  <p style="margin: 0; font-size: 14px;">${hospital.hospital_code || '-'}</p>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">Hospital Name</label>
                  <p style="margin: 0; font-size: 14px;">${hospital.name || '-'}</p>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">Email</label>
                  <p style="margin: 0; font-size: 14px;">${hospital.email || '-'}</p>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">Phone</label>
                  <p style="margin: 0; font-size: 14px;">${hospital.phone || '-'}</p>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">Status</label>
                  <span style="
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    background: ${hospital.status === 'ACTIVE' ? '#dcfce7' : hospital.status === 'PENDING' ? '#fef3c7' : '#fee2e2'};
                    color: ${hospital.status === 'ACTIVE' ? '#166534' : hospital.status === 'PENDING' ? '#d97706' : '#dc2626'};
                  ">${hospital.status || 'INACTIVE'}</span>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">Website</label>
                  <p style="margin: 0; font-size: 14px;">${hospital.website || '-'}</p>
                </div>
              </div>
            </div>

            <!-- Address Information -->
            <div style="margin-bottom: 30px;">
              <h4 style="margin: 0 0 16px 0; color: #1e4fa1; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Address</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="grid-column: 1 / -1;">
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">Street Address</label>
                  <p style="margin: 0; font-size: 14px;">${hospital.address_line1 || '-'}</p>
                  ${hospital.address_line2 ? `<p style="margin: 4px 0 0 0; font-size: 14px;">${hospital.address_line2}</p>` : ''}
                </div>
                <div>
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">City</label>
                  <p style="margin: 0; font-size: 14px;">${hospital.city || '-'}</p>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">State</label>
                  <p style="margin: 0; font-size: 14px;">${hospital.state || '-'}</p>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">Postal Code</label>
                  <p style="margin: 0; font-size: 14px;">${hospital.postal_code || '-'}</p>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">Country</label>
                  <p style="margin: 0; font-size: 14px;">${hospital.country || 'India'}</p>
                </div>
              </div>
            </div>

            <!-- Statistics -->
            <div style="margin-bottom: 30px;">
              <h4 style="margin: 0 0 16px 0; color: #1e4fa1; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Real-time Statistics</h4>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                <div style="background: #f8fafc; padding: 16px; border-radius: 8px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #6b7280; font-weight: 600;">Total Patients</p>
                  <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #1e4fa1;">-</p>
                </div>
                <div style="background: #f8fafc; padding: 16px; border-radius: 8px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #6b7280; font-weight: 600;">Active Doctors</p>
                  <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #1e4fa1;">-</p>
                </div>
                <div style="background: #f8fafc; padding: 16px; border-radius: 8px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #6b7280; font-weight: 600;">Appointments Today</p>
                  <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #1e4fa1;">-</p>
                </div>
              </div>
              <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280; text-align: center;">
                <em>Statistics will be available once the hospital starts using the system</em>
              </p>
            </div>

            <!-- Timestamps -->
            <div style="margin-bottom: 20px;">
              <h4 style="margin: 0 0 16px 0; color: #1e4fa1; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">System Information</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">Created At</label>
                  <p style="margin: 0; font-size: 14px;">${new Date(hospital.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; color: #6b7280; font-size: 12px; margin-bottom: 4px;">Last Updated</label>
                  <p style="margin: 0; font-size: 14px;">${new Date(hospital.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
              <button onclick="closeHospitalDetailsModal()" style="
                background: #6b7280;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
              ">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);

    // Bind hospital logo dynamically after modal is inserted
    const logoImg = document.getElementById('hospitalLogoImage');
    const logoPlaceholder = document.getElementById('hospitalLogoPlaceholder');
    
    // Defensive rendering: Check if elements exist
    if (!logoImg || !logoPlaceholder) {
      console.warn('Logo elements not found in modal');
      return;
    }
    
    // Check if hospital has logo_url
    if (hospital.logo_url && typeof hospital.logo_url === 'string' && hospital.logo_url.trim() !== '') {
      // Logo URL exists - attempt to load image
      console.log('Loading hospital logo:', hospital.logo_url);
      
      // SAFETY: Ensure image starts hidden to prevent broken image flash
      logoImg.style.display = 'none';
      logoPlaceholder.style.display = 'flex';
      
      // Set up error handler BEFORE setting src (important!)
      logoImg.onerror = function() {
        console.warn('Failed to load hospital logo:', hospital.logo_url);
        console.warn('Falling back to placeholder avatar');
        // SAFETY: Ensure broken image is hidden
        logoImg.style.display = 'none';
        logoImg.src = ''; // Clear broken src
        logoPlaceholder.style.display = 'flex';
      };
      
      // Set up success handler
      logoImg.onload = function() {
        console.log('Hospital logo loaded successfully:', hospital.logo_url);
        // SAFETY: Only show image if it actually loaded
        if (logoImg.complete && logoImg.naturalWidth > 0) {
          logoImg.style.display = 'block';
          logoPlaceholder.style.display = 'none';
        } else {
          // Image didn't load properly, show placeholder
          console.warn('Image loaded but has no dimensions, using placeholder');
          logoImg.style.display = 'none';
          logoPlaceholder.style.display = 'flex';
        }
      };
      
      // Set the image source (triggers loading)
      try {
        // Files are in public/storage/uploads/, logo_url is /storage/uploads/...
        // So we need: http://localhost/HMS/public + /storage/uploads/...
        logoImg.src = `http://localhost/HMS/public${hospital.logo_url}`;
      } catch (error) {
        console.error('Error setting logo src:', error);
        // SAFETY: Show placeholder, hide image, clear src
        logoImg.style.display = 'none';
        logoImg.src = '';
        logoPlaceholder.style.display = 'flex';
      }
      
    } else {
      // No logo URL - show placeholder immediately
      console.log('No logo URL for hospital, showing placeholder');
      logoImg.style.display = 'none';
      logoImg.src = ''; // Clear any previous src
      logoPlaceholder.style.display = 'flex';
    }

  } catch (err) {
    console.error("Error loading hospital details:", err);
    alert("Failed to load hospital details. Please try again.");
  }
}

function closeHospitalDetailsModal() {
  const modal = document.getElementById('hospitalDetailsModal');
  if (modal) {
    modal.remove();
  }
}




// ================= USER MANAGEMENT =================
async function loadUserManagementData() {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No token found, showing placeholder data");
      showUserManagementPlaceholders();
      return;
    }

    // TODO: Implement API endpoint for user statistics
    // const res = await fetch("http://localhost/HMS/public/api/platform/admin/users/stats", {
    //   headers: { "Authorization": "Bearer " + token }
    // });
    
    // For now, show placeholders until API is implemented
    showUserManagementPlaceholders();
    
  } catch (err) {
    console.error("Error loading user management data:", err);
    showUserManagementPlaceholders();
  }
}

function showUserManagementPlaceholders() {
  // Show zeros or loading state instead of fake data
  document.getElementById('totalUsers').textContent = '0';
  document.getElementById('activeUsers').textContent = '0';
  document.getElementById('newUsers').textContent = '0';
  document.getElementById('pendingUsers').textContent = '0';
}

// ================= SUBSCRIPTIONS MANAGEMENT =================
async function loadSubscriptionsData() {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No token found, showing placeholder data");
      showSubscriptionsPlaceholders();
      return;
    }

    // Load subscription plans dynamically
    await loadSubscriptionPlansCards();

    // Load subscription statistics
    await loadSubscriptionStatistics();
    
    // Load active subscriptions table
    await loadActiveSubscriptionsTable();
    
  } catch (err) {
    console.error("Error loading subscriptions data:", err);
    showSubscriptionsPlaceholders();
  }
}

/**
 * Load subscription statistics from backend
 */
async function loadSubscriptionStatistics() {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No token found for loading statistics");
      return;
    }

    const res = await fetch("http://localhost/HMS/public/api/platform/admin/subscriptions/statistics", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) {
      console.error('Failed to fetch subscription statistics, status:', res.status);
      return;
    }

    const result = await res.json();
    
    if (!result.success) {
      console.error('Invalid response from statistics API');
      return;
    }

    const stats = result.data;
    console.log('Loaded subscription statistics:', stats);

    // Update statistics cards
    document.getElementById('totalSubscriptions').textContent = stats.total_subscriptions || 0;
    document.getElementById('activeSubscriptions').textContent = stats.active_subscriptions || 0;
    document.getElementById('subscriptionRevenue').textContent = '₹' + (stats.monthly_revenue || 0).toLocaleString();

    // Store plan statistics for use in plan cards
    window.planStatistics = stats.plan_statistics || {};

    // Re-render plan cards with statistics
    await loadSubscriptionPlansCards();

  } catch (err) {
    console.error('Error loading subscription statistics:', err);
  }
}

/**
 * Load subscription plan cards from backend API
 * Replaces static HTML with dynamic data
 */
async function loadSubscriptionPlansCards() {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No token found for loading subscription plans");
      return;
    }

    console.log('Fetching subscription plans from API...');

    const res = await fetch("http://localhost/HMS/public/api/platform/admin/plans", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) {
      console.error('Failed to fetch subscription plans, status:', res.status);
      showPlansError();
      return;
    }

    const result = await res.json();
    
    if (!result.success || !result.data.plans) {
      console.error('Invalid response from subscription plans API');
      showPlansError();
      return;
    }

    const plans = result.data.plans;
    console.log('Loaded', plans.length, 'subscription plans');

    // Render plan cards
    renderSubscriptionPlanCards(plans);

  } catch (err) {
    console.error('Error loading subscription plans:', err);
    showPlansError();
  }
}

/**
 * Render subscription plan cards dynamically
 */
function renderSubscriptionPlanCards(plans) {
  const plansGrid = document.getElementById('plansGrid');
  
  if (!plansGrid) {
    console.error('Plans grid container not found');
    return;
  }

  if (plans.length === 0) {
    plansGrid.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #6b7280; grid-column: 1 / -1;">
        No subscription plans available
      </div>
    `;
    return;
  }

  // Clear loading message
  plansGrid.innerHTML = '';

  // Render each plan
  plans.forEach(plan => {
    const planCard = createPlanCard(plan);
    plansGrid.innerHTML += planCard;
  });
}

/**
 * Create HTML for a single plan card
 */
function createPlanCard(plan) {
  // Determine plan class based on code
  const planClass = plan.code.toLowerCase();
  
  // Show badge for featured plans
  const badge = plan.features.is_featured 
    ? '<div class="plan-badge">Most Popular</div>' 
    : '';

  // Format modules as features
  const moduleFeatures = plan.modules.length > 0
    ? plan.modules.map(module => `<div class="feature">✓ ${module} Module</div>`).join('')
    : '<div class="feature">✓ Core Features</div>';

  // Format limits as features
  const limitFeatures = `
    <div class="feature">✓ Up to ${plan.limits.max_users} Users</div>
    <div class="feature">✓ Up to ${plan.limits.max_patients.toLocaleString()} Patients</div>
    <div class="feature">✓ ${plan.limits.storage_gb} GB Storage</div>
  `;

  // Get statistics for this plan from global variable
  const planStats = window.planStatistics && window.planStatistics[plan.code] 
    ? window.planStatistics[plan.code]
    : { hospital_count: 0, monthly_revenue: 0 };

  const hospitalCount = planStats.hospital_count || 0;
  const monthlyRevenue = planStats.monthly_revenue || 0;
  
  // Calculate annual revenue (monthly * 12)
  const annualRevenue = monthlyRevenue * 12;

  return `
    <div class="plan-card ${planClass}">
      <div class="plan-header">
        <h3>${plan.name}</h3>
        <div class="plan-price">${plan.pricing.formatted}</div>
        ${badge}
      </div>
      <div class="plan-features">
        ${moduleFeatures}
        ${limitFeatures}
      </div>
      <div class="plan-stats">
        <div class="stat">${hospitalCount} Hospital${hospitalCount !== 1 ? 's' : ''}</div>
        <div class="stat">₹${Math.round(annualRevenue).toLocaleString()}/year</div>
      </div>
      <div class="plan-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <button onclick="deletePlan(${plan.id}, '${plan.name}')" style="
          width: 100%;
          padding: 10px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        ">Delete Plan</button>
      </div>
    </div>
  `;
}

/**
 * Show error message when plans fail to load
 */
function showPlansError() {
  const plansGrid = document.getElementById('plansGrid');
  
  if (plansGrid) {
    plansGrid.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #dc2626; grid-column: 1 / -1;">
        <p>Failed to load subscription plans</p>
        <button onclick="loadSubscriptionPlansCards()" style="
          margin-top: 16px;
          padding: 8px 16px;
          background: #1e4fa1;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        ">Retry</button>
      </div>
    `;
  }
}

function showSubscriptionsPlaceholders() {
  // Show zeros or loading state instead of fake data
  document.getElementById('totalSubscriptions').textContent = '0';
  document.getElementById('activeSubscriptions').textContent = '0';
  document.getElementById('subscriptionRevenue').textContent = '₹0';
}

/**
 * Load active subscriptions table from backend
 */
async function loadActiveSubscriptionsTable() {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No token found for loading active subscriptions");
      return;
    }

    const res = await fetch("http://localhost/HMS/public/api/platform/admin/subscriptions/active", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!res.ok) {
      console.error('Failed to fetch active subscriptions, status:', res.status);
      return;
    }

    const result = await res.json();
    
    if (!result.success) {
      console.error('Invalid response from active subscriptions API');
      return;
    }

    const subscriptions = result.data.subscriptions || [];
    console.log('Loaded', subscriptions.length, 'active subscriptions');

    // Render subscriptions table
    renderActiveSubscriptionsTable(subscriptions);

  } catch (err) {
    console.error('Error loading active subscriptions:', err);
  }
}

/**
 * Render active subscriptions table
 */
function renderActiveSubscriptionsTable(subscriptions) {
  const tbody = document.getElementById('subscriptionsTableBody');
  
  if (!tbody) {
    console.error('Active subscriptions table body not found');
    return;
  }

  if (subscriptions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
          Subscription data will be displayed here once hospitals are assigned subscription plans
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = subscriptions.map(sub => {
    const statusClass = sub.status === 'ACTIVE' ? 'active' : 'pending';
    const statusText = sub.status.charAt(0) + sub.status.slice(1).toLowerCase();
    
    // Format dates
    const startDate = new Date(sub.start_date).toLocaleDateString();
    const endDate = new Date(sub.end_date).toLocaleDateString();
    
    // Format monthly cost
    const monthlyCost = '₹' + Math.round(sub.monthly_cost).toLocaleString();
    
    return `
      <tr>
        <td>${sub.hospital_name} (${sub.hospital_code})</td>
        <td>${sub.plan_name}</td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td>${monthlyCost}</td>
        <td><span class="status ${statusClass}">${statusText}</span></td>
        <td>
          <button class="action-btn view" onclick="viewHospitalDetails(${sub.id})">View</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Delete a subscription plan
 */
async function deletePlan(planId, planName) {
  // Confirm deletion
  if (!confirm(`Are you sure you want to delete "${planName}"?\n\nThis action cannot be undone. Hospitals currently using this plan will not be affected.`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = "super_admin_login.html";
      return;
    }
    
    // Delete plan via API
    const res = await fetch(`http://localhost/HMS/public/api/platform/admin/plans/${planId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    
    const result = await res.json();
    
    if (!res.ok || !result.success) {
      alert("Failed to delete plan: " + (result.error?.message || "Unknown error"));
      return;
    }
    
    alert(`Plan "${planName}" deleted successfully!`);
    
    // Reload subscription plans and statistics
    await loadSubscriptionPlansCards();
    await loadSubscriptionStatistics();
    
  } catch (err) {
    console.error("Error deleting plan:", err);
    alert("Failed to delete plan. Please try again.");
  }
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
  document.getElementById('createPlanForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const planName = document.getElementById('planName').value;
    const planPrice = document.getElementById('planPrice').value;
    const supportLevel = document.getElementById('supportLevel').value;
    const planDescription = document.getElementById('planDescription').value;
    
    // Get selected modules
    const moduleCheckboxes = document.querySelectorAll('#createPlanForm input[type="checkbox"]:checked');
    const modules = Array.from(moduleCheckboxes).map(cb => cb.value.toUpperCase());
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "super_admin_login.html";
        return;
      }
      
      // Create plan via API
      const res = await fetch("http://localhost/HMS/public/api/platform/admin/plans", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan_name: planName,
          description: planDescription,
          price: parseFloat(planPrice),
          billing_cycle: "ANNUAL",
          modules: modules,
          max_users: 50,
          max_patients: 10000,
          storage_gb: 10
        })
      });
      
      const result = await res.json();
      
      if (!res.ok || !result.success) {
        alert("Failed to create plan: " + (result.error?.message || "Unknown error"));
        return;
      }
      
      closeModal();
      alert(`New plan "${planName}" created successfully!\n\nPrice: ₹${planPrice}/year\nPlan is now available for hospitals to subscribe.`);
      
      // Reload subscription plans
      await loadSubscriptionPlansCards();
      await loadSubscriptionStatistics();
      
    } catch (err) {
      console.error("Error creating plan:", err);
      alert("Failed to create plan. Please try again.");
    }
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
  if (mockHospitals.length === 0) {
    alert('No hospital data to export');
    return;
  }

  // Prepare CSV data
  const headers = ['Hospital Code', 'Hospital Name', 'Location', 'Email', 'Phone', 'Enabled Modules', 'Status', 'Created At'];
  const csvRows = [headers.join(',')];

  mockHospitals.forEach(hospital => {
    const location = `${hospital.city}, ${hospital.state}`;
    const modules = hospital.modules ? hospital.modules.filter(m => m.is_enabled).map(m => m.module_code).join('; ') : 'None';
    const createdAt = new Date(hospital.created_at).toLocaleDateString();
    
    const row = [
      hospital.hospital_code,
      `"${hospital.name}"`, // Wrap in quotes to handle commas
      `"${location}"`,
      hospital.email,
      hospital.phone,
      `"${modules}"`,
      hospital.status,
      createdAt
    ];
    csvRows.push(row.join(','));
  });

  // Create CSV content
  const csvContent = csvRows.join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `hospital_statistics_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ================= HOSPITAL MANAGEMENT =================
function loadHospitalsTable() {
  const tbody = document.getElementById('hospitalsTableBody');
  tbody.innerHTML = '';
  
  const startIndex = (currentHospitalPage - 1) * hospitalsPerPage;
  const endIndex = startIndex + hospitalsPerPage;
  const pageHospitals = filteredHospitals.slice(startIndex, endIndex);
  
  pageHospitals.forEach(hospital => {
    // Render action buttons based strictly on backend status
    // Status comes from API response - never stored locally
    const actionButtons = renderActionButtons(hospital);
    
    // Get subscription display value
    const subscription = hospital.subscription || 'Not Set';
    const subscriptionClass = subscription.toLowerCase().replace(' ', '-');
    
    // DEBUG: Log subscription for HSP-0009
    if (hospital.hospital_code === 'HSP-0009') {
      console.log('HSP-0009 subscription:', hospital.subscription);
      console.log('HSP-0009 full data:', hospital);
    }

    const row = `
      <tr>
        <td>${hospital.hospital_code || hospital.id}</td>
        <td>${hospital.name}</td>
        <td>${hospital.city}</td>
        <td>
          <span class="badge ${subscriptionClass}">${subscription}</span>
        </td>
        <td>
          <span class="status ${hospital.status.toLowerCase()}">${hospital.status.toUpperCase()}</span>
        </td>
        <td>
          <button class="action-btn view" onclick="viewHospitalDetails(${hospital.id})">View</button>
          <button class="action-btn edit" onclick="editHospital(${hospital.id})">Edit</button>
          ${actionButtons}
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
  
  updateHospitalPagination();
}

/**
 * Render action buttons based strictly on backend hospital status
 * Rules:
 * - If status == ACTIVE → show Deactivate button
 * - If status == PENDING or INACTIVE → show Activate button
 * - Status is always derived from API response, never stored locally
 * - Always show Delete button
 * 
 * @param {Object} hospital - Hospital object from API response
 * @returns {string} HTML for action buttons
 */
function renderActionButtons(hospital) {
  // Normalize status to uppercase for comparison (backend returns uppercase)
  const status = hospital.status ? hospital.status.toUpperCase() : 'PENDING';
  
  // Determine activate/deactivate button based on current status from API
  let statusButton = '';
  if (status === 'ACTIVE') {
    // Hospital is active → show Deactivate button
    statusButton = `<button class="action-btn deactivate" onclick="toggleHospitalStatus(${hospital.id}, 'inactive')">Deactivate</button>`;
  } else {
    // Hospital is PENDING or INACTIVE → show Activate button
    statusButton = `<button class="action-btn activate" onclick="toggleHospitalStatus(${hospital.id}, 'active')">Activate</button>`;
  }
  
  // Always show delete button with proper styling
  const deleteButton = `<button class="action-btn" onclick="deleteHospital(${hospital.id}, '${hospital.name.replace(/'/g, "\\'")}');" style="background-color: #dc2626; color: white; margin-left: 4px;">Delete</button>`;
  
  return statusButton + deleteButton;
}

function applyHospitalFilters() {
  const searchTerm = document.getElementById('hospitalSearch').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const planFilter = document.getElementById('planFilter').value;
  
  filteredHospitals = mockHospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm) || 
                         hospital.hospital_code.toLowerCase().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || hospital.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPlan = planFilter === 'all' || (hospital.subscription && hospital.subscription.toLowerCase().includes(planFilter.toLowerCase()));
    
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
    loadHospitalsFromAPI();
  }
}

function nextHospitalPage() {
  const totalPages = Math.ceil(filteredHospitals.length / hospitalsPerPage);
  if (currentHospitalPage < totalPages) {
    currentHospitalPage++;
    loadHospitalsFromAPI();
  }
}

// ================= HOSPITAL ACTIONS =================
function viewHospital(hospitalId) {
  // Redirect to the proper viewHospitalDetails function
  viewHospitalDetails(hospitalId);
}

async function editHospital(hospitalId) {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = "super_admin_login.html";
      return;
    }

    // Fetch fresh hospital data from API
    const res = await fetch(`http://localhost/HMS/public/api/platform/admin/hospitals/${hospitalId}`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const result = await res.json();
    
    if (!res.ok || !result.success) {
      alert(result.error?.message || "Failed to load hospital details");
      return;
    }

    const hospital = result.data.hospital;

    // Open the edit modal (Modal 1)
    const modal = document.getElementById("editHospitalModal");
    if (modal) {
      modal.classList.add("active");
    }

    // Populate all form fields with fresh data from API
    document.getElementById("editHospitalCode").value = hospital.hospital_code || '';
    document.getElementById("editHospitalName").value = hospital.name || '';
    document.getElementById("editEmailAddress").value = hospital.email || '';
    document.getElementById("editPhoneNumber").value = hospital.phone || '';
    document.getElementById("editStreetAddress").value = hospital.address_line1 || '';
    document.getElementById("editAddressLine2").value = hospital.address_line2 || '';
    document.getElementById("editCity").value = hospital.city || '';
    document.getElementById("editState").value = hospital.state || '';
    document.getElementById("editPostalCode").value = hospital.postal_code || '';
    document.getElementById("editCountry").value = hospital.country || 'India';
    document.getElementById("editWebsite").value = hospital.website || '';

    // Save hospital ID for submission
    window.editingHospitalId = hospitalId;
    
  } catch (err) {
    console.error("Error loading hospital for edit:", err);
    alert("Failed to load hospital details. Please try again.");
  }
}




function closeEditHospital() {
  document.getElementById('editHospitalModal').classList.remove('active');
  window.editingHospitalId = null;
}

// Submit handler for edit hospital form
async function submitEditHospitalForm(event) {
  event.preventDefault();
  
  const token = localStorage.getItem("token");
  const hospitalId = window.editingHospitalId;

  if (!hospitalId) {
    alert("No hospital selected for editing");
    return;
  }

  if (!token) {
    alert("Session expired. Please login again.");
    window.location.href = "super_admin_login.html";
    return;
  }

  // Create FormData object for multipart/form-data
  const formData = new FormData();
  
  // Append all text fields
  formData.append('name', document.getElementById("editHospitalName").value.trim());
  formData.append('email', document.getElementById("editEmailAddress").value.trim());
  formData.append('phone', document.getElementById("editPhoneNumber").value.trim());
  formData.append('address_line1', document.getElementById("editStreetAddress").value.trim());
  
  const addressLine2 = document.getElementById("editAddressLine2").value.trim();
  if (addressLine2) {
    formData.append('address_line2', addressLine2);
  }
  
  formData.append('city', document.getElementById("editCity").value.trim());
  formData.append('state', document.getElementById("editState").value.trim());
  
  const postalCode = document.getElementById("editPostalCode").value.trim();
  if (postalCode) {
    formData.append('postal_code', postalCode);
  }
  
  formData.append('country', document.getElementById("editCountry").value.trim());
  
  const website = document.getElementById("editWebsite").value.trim();
  if (website) {
    formData.append('website', website);
  }
  
  // Append logo file if selected
  const logoInput = document.getElementById('editHospitalLogo');
  if (logoInput.files && logoInput.files[0]) {
    formData.append('logo', logoInput.files[0]);
    console.log('Logo file attached for update:', logoInput.files[0].name);
  }

  try {
    const res = await fetch(`http://localhost/HMS/public/api/platform/admin/hospitals/${hospitalId}`, {
      method: "PUT",
      headers: {
        // Don't set Content-Type - browser will set it with boundary for multipart
        "Authorization": "Bearer " + token
      },
      body: formData  // Send FormData instead of JSON
    });

    const result = await res.json();

    if (!res.ok) {
      let errorMsg = "Failed to update hospital";
      
      if (result.error && result.error.message) {
        errorMsg = result.error.message;
      } else if (result.message) {
        errorMsg = result.message;
      }
      
      alert(errorMsg);
      return;
    }

    alert("Hospital updated successfully!");
    closeEditHospital();
    
    // Reload hospitals from API
    await loadHospitalsFromAPI();

  } catch (err) {
    console.error("Error updating hospital:", err);
    alert("Server error while updating hospital. Please try again.");
  }
}

// ================= CREATE HOSPITAL MODAL =================
function showCreateHospital() {
  document.getElementById('createHospitalModal').classList.add('active');
  generateHospitalCode();
  loadSubscriptionPlans();
}

function closeCreateHospital() {
  document.getElementById('createHospitalModal').classList.remove('active');
  resetHospitalForm();
}

async function generateHospitalCode() {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      // Fallback if no token
      document.getElementById('hospitalCode').value = 'HSP-XXXX';
      return;
    }

    // Fetch next hospital code from API
    const res = await fetch("http://localhost/HMS/public/api/platform/admin/hospitals/next-code", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (res.ok) {
      const result = await res.json();
      document.getElementById('hospitalCode').value = result.data.hospital_code || 'HSP-XXXX';
    } else {
      // Fallback: Generate based on current count + 1
      const count = mockHospitals.length;
      document.getElementById('hospitalCode').value = `HSP-${String(count + 1).padStart(4, '0')}`;
    }
  } catch (err) {
    console.error('Error generating hospital code:', err);
    // Fallback
    const count = mockHospitals.length;
    document.getElementById('hospitalCode').value = `HSP-${String(count + 1).padStart(4, '0')}`;
  }
}

async function loadSubscriptionPlans() {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No token found, using default subscription plans");
      return;
    }

    // Fetch subscription plans from API
    const res = await fetch("http://localhost/HMS/public/api/platform/admin/subscription-plans", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (res.ok) {
      const result = await res.json();
      const plans = result.data.plans || [];
      
      console.log('Fetched subscription plans from API:', plans);
      
      // Populate subscription dropdown
      const subscriptionSelect = document.getElementById('subscriptionPlan');
      if (subscriptionSelect) {
        // Clear existing options
        subscriptionSelect.innerHTML = '<option value="">Select Plan</option>';
        
        // Add plans from API
        plans.forEach(plan => {
          const option = document.createElement('option');
          option.value = plan.plan_name; // This will be "Basic Plan", "Standard Plan", "Premium Plan"
          option.textContent = `${plan.plan_name} - ₹${parseFloat(plan.price).toLocaleString()}/${plan.billing_cycle.toLowerCase()}`;
          subscriptionSelect.appendChild(option);
          console.log('Added plan option:', option.value, '-', option.textContent);
        });
        
        console.log('✓ Loaded', plans.length, 'subscription plans into dropdown');
      } else {
        console.warn('⚠ subscriptionPlan dropdown not found in DOM');
      }
    } else {
      console.error('Failed to load subscription plans, status:', res.status);
    }
  } catch (err) {
    console.error('Error loading subscription plans:', err);
  }
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

function previewEditLogo() {
  const fileInput = document.getElementById('editHospitalLogo');
  const preview = document.getElementById('editLogoPreview');
  
  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Logo Preview">`;
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
}

// ================= FORM SUBMISSION =================
// const createHospitalForm = document.getElementById('createHospitalForm');
// if (createHospitalForm) {
//   createHospitalForm.addEventListener('submit', function(e) {
//     e.preventDefault();
    
//     const formData = {
//       id: document.getElementById('hospitalCode').value,
//       name: document.getElementById('hospitalName').value,
//       address: document.getElementById('streetAddress').value,
//       city: document.getElementById('city').value,
//       state: document.getElementById('state').value,
//       phone: document.getElementById('phoneNumber').value,
//       email: document.getElementById('emailAddress').value,
//       plan: document.getElementById('subscriptionPlan').value,
//       status: 'active',
//       modules: ['OP'], // Default modules
//       revenue: 0
//     };
    
//     // Add to mock data
//     mockHospitals.push(formData);
    
//     // Save to localStorage
//     saveHospitalsToStorage();
    
//     // Update filtered hospitals array
//     filteredHospitals = [...mockHospitals];
    
//     // Close modal and refresh
//     closeCreateHospital();
//     loadHospitalsTable();
//     loadHospitalStats();
    
//     alert(`${formData.name} has been added successfully!`);
//   });
// }

const createHospitalForm = document.getElementById('createHospitalForm');
if (createHospitalForm) {
  createHospitalForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = "index.html";
      return;
    }

    // Create FormData object for multipart/form-data
    const formData = new FormData();
    
    // Get subscription value
    const subscriptionValue = document.getElementById('subscriptionPlan').value;
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Subscription dropdown value:', subscriptionValue);
    console.log('Subscription dropdown element:', document.getElementById('subscriptionPlan'));
    
    // Append all text fields
    formData.append('name', document.getElementById('hospitalName').value);
    formData.append('hospital_code', document.getElementById('hospitalCode').value);
    formData.append('address_line1', document.getElementById('streetAddress').value);
    formData.append('city', document.getElementById('city').value);
    formData.append('state', document.getElementById('state').value);
    formData.append('phone', document.getElementById('phoneNumber').value);
    formData.append('email', document.getElementById('emailAddress').value);
    formData.append('subscription', subscriptionValue);
    formData.append('country', 'India');
    
    console.log('FormData subscription value:', formData.get('subscription'));
    
    // Append logo file if selected
    const logoInput = document.getElementById('hospitalLogo');
    if (logoInput.files && logoInput.files[0]) {
      formData.append('logo', logoInput.files[0]);
      console.log('Logo file attached:', logoInput.files[0].name);
    }

    try {
      const res = await fetch("http://localhost/HMS/public/api/platform/admin/hospitals", {
        method: "POST",
        headers: {
          // Don't set Content-Type - browser will set it with boundary for multipart
          "Authorization": "Bearer " + token
        },
        body: formData  // Send FormData instead of JSON
      });

      const result = await res.json();

      if (!res.ok) {
        console.error(result);
        alert(result.message || "Failed to create hospital");
        return;
      }

      alert("Hospital saved in database successfully ✅");

      closeCreateHospital();

      // Reload hospitals from backend
      loadHospitalsFromAPI();

    } catch (err) {
      console.error(err);
      alert("Server error. Check console.");
    }
  });
}

// Edit Hospital Form Submission - Use submitEditHospital() function instead
// The form should call submitEditHospital() which has proper API integration

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

async function loadHospitalsFromAPI() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = "super_admin_login.html";
      return;
    }

    const res = await fetch("http://localhost/HMS/public/api/platform/admin/hospitals", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const result = await res.json();
    console.log("API Result:", result);

    if (!res.ok) {
      alert(result.error?.message || "Failed to fetch hospitals");
      return;
    }

    // ✅ FIXED: Correct key from API
    const hospitals = result.data.items || [];

    if (hospitals.length === 0) {
      mockHospitals = [];
      filteredHospitals = [];
      loadHospitalsTable();
      return;
    }

    mockHospitals = hospitals.map(h => ({
      id: h.id,  // Store numeric ID
      hospital_code: h.hospital_code,  // Store hospital code with correct key
      name: h.name,
      city: h.city || "",
      subscription: h.subscription || "",  // Use subscription field from API
      status: h.status || "active",
      phone: h.phone || "",
      email: h.email || ""
    }));

    filteredHospitals = [...mockHospitals];
    loadHospitalsTable();   // 🔁 refresh UI

  } catch (err) {
    console.error(err);
    alert("Server error while loading hospitals");
  }
}

async function toggleHospitalStatus(hospitalId, newStatus) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Session expired. Please login again.");
    window.location.href = "super_admin_login.html";
    return;
  }

  // Convert to uppercase as backend expects ACTIVE/INACTIVE/PENDING
  const statusUpper = newStatus.toUpperCase();
  
  // Validate status
  if (!['ACTIVE', 'INACTIVE', 'PENDING'].includes(statusUpper)) {
    console.error('Invalid status:', newStatus);
    alert('Invalid status value');
    return;
  }

  // Confirm action
  const actionText = statusUpper === 'ACTIVE' ? 'activate' : 'deactivate';
  if (!confirm(`Are you sure you want to ${actionText} this hospital?`)) {
    return;
  }

  try {
    // Call API to update status
    const res = await fetch(`http://localhost/HMS/public/api/platform/admin/hospitals/${hospitalId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ status: statusUpper })
    });

    const result = await res.json();

    // Check for errors
    if (!res.ok) {
      // Extract error message from various possible formats
      let errorMsg = "Failed to update hospital status";
      
      if (result.error && result.error.message) {
        errorMsg = result.error.message;
      } else if (result.message) {
        errorMsg = result.message;
      } else if (result.error && typeof result.error === 'string') {
        errorMsg = result.error;
      }
      
      console.error('API Error Response:', result);
      alert(errorMsg);
      return;
    }

    // Success - show message
    alert(`Hospital status updated to ${statusUpper} successfully!`);

    // Re-fetch hospital list from API - backend is the authority
    await loadHospitalsFromAPI();

  } catch (err) {
    console.error('Error updating hospital status:', err);
    alert("Server error while updating hospital status. Please try again.");
  }
}

/**
 * Delete a hospital
 */
async function deleteHospital(hospitalId, hospitalName) {
  // Confirm deletion
  if (!confirm(`Are you sure you want to delete "${hospitalName}"?\n\nThis action cannot be undone. All hospital data will be permanently deleted.`)) {
    return;
  }
  
  // Double confirmation for safety
  if (!confirm(`FINAL CONFIRMATION\n\nDeleting "${hospitalName}" will remove:\n- All hospital information\n- All patient records\n- All appointments\n- All billing data\n\nType the hospital name to confirm deletion.`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = "super_admin_login.html";
      return;
    }
    
    // Delete hospital via API
    const res = await fetch(`http://localhost/HMS/public/api/platform/admin/hospitals/${hospitalId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    
    const result = await res.json();
    
    if (!res.ok || !result.success) {
      alert("Failed to delete hospital: " + (result.error?.message || "Unknown error"));
      return;
    }
    
    alert(`Hospital "${hospitalName}" deleted successfully!`);
    
    // Reload hospitals list
    await loadHospitalsFromAPI();
    
    // Reload dashboard statistics if on dashboard
    if (currentView === 'dashboard') {
      loadHospitalStats();
    }
    
  } catch (err) {
    console.error("Error deleting hospital:", err);
    alert("Failed to delete hospital. Please try again.");
  }
}




function loadActivitySummary() {
  // Update with data from mockHospitals
  const totalHospitals = mockHospitals.length;
  
  document.getElementById('hospitalsTotal').textContent = totalHospitals;
  document.getElementById('subscriptionsTotal').textContent = '-';
  document.getElementById('revenueTotal').textContent = '₹0';
}
