// ================= MOCK DATA =================
const revenueData = [
  {
    name: 'Max Healthcare',
    code: 'HSP-1003',
    plan: 'premium',
    monthlyRevenue: 52000,
    ytdRevenue: 624000,
    growth: 15.2,
    status: 'active'
  },
  {
    name: 'Apollo Hospitals',
    code: 'HSP-1001',
    plan: 'premium',
    monthlyRevenue: 45000,
    ytdRevenue: 540000,
    growth: 8.7,
    status: 'active'
  },
  {
    name: 'Fortis Healthcare',
    code: 'HSP-1002',
    plan: 'standard',
    monthlyRevenue: 38000,
    ytdRevenue: 456000,
    growth: 12.1,
    status: 'active'
  },
  {
    name: 'Manipal Hospitals',
    code: 'HSP-1004',
    plan: 'standard',
    monthlyRevenue: 35000,
    ytdRevenue: 420000,
    growth: -2.3,
    status: 'active'
  }
];

const renewalData = [
  {
    name: 'City Hospital',
    code: 'HSP-1005',
    plan: 'basic',
    expiryDate: '2026-02-05',
    daysRemaining: 3,
    status: 'overdue'
  },
  {
    name: 'Metro Medical Center',
    code: 'HSP-1006',
    plan: 'standard',
    expiryDate: '2026-02-15',
    daysRemaining: 13,
    status: 'pending'
  },
  {
    name: 'Apollo Hospitals',
    code: 'HSP-1001',
    plan: 'premium',
    expiryDate: '2026-03-15',
    daysRemaining: 43,
    status: 'active'
  }
];

let currentReportTab = 'revenue';

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', function() {
  console.log("Reports page loaded, initializing...");
  loadRevenueDataFromAPI();
  loadHospitalRevenueTable();
});

// ================= DATA LOADING =================
async function loadRevenueDataFromAPI() {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No token found, showing placeholder");
      return;
    }

    console.log("Fetching revenue summary from API...");

    // Fetch revenue summary from API
    const res = await fetch("http://localhost/HMS/public/api/platform/admin/revenue/summary", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    console.log("Revenue API response status:", res.status);

    if (!res.ok) {
      console.error('Failed to fetch revenue data, status:', res.status);
      const errorText = await res.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await res.json();
    console.log("Revenue API result:", result);
    
    if (!result.success) {
      console.error('Invalid response from revenue API:', result);
      return;
    }

    const summary = result.data.summary;
    console.log('Loaded revenue summary:', summary);

    // Update the UI with real data
    updateRevenueUI(summary);

  } catch (err) {
    console.error('Error loading revenue data:', err);
  }
}

function updateRevenueUI(summary) {
  console.log("Updating revenue UI with summary:", summary);
  
  // Update total revenue - find the first summary card
  const summaryCards = document.querySelectorAll('.summary-card');
  console.log("Found summary cards:", summaryCards.length);
  
  if (summaryCards.length >= 3) {
    // Update Total Revenue (first card)
    const totalRevenueH3 = summaryCards[0].querySelector('h3');
    if (totalRevenueH3) {
      const oldValue = totalRevenueH3.textContent;
      totalRevenueH3.textContent = summary.formatted.total_monthly_revenue;
      console.log("Updated Total Revenue:", oldValue, "->", totalRevenueH3.textContent);
    } else {
      console.error("Could not find h3 in first summary card");
    }
    
    // Update the trend for total revenue
    const totalTrendDiv = summaryCards[0].querySelector('.trend');
    if (totalTrendDiv) {
      totalTrendDiv.textContent = `${summary.active_hospital_count} active hospitals`;
      totalTrendDiv.className = 'trend neutral';
    }
    
    // Update Average per Hospital (second card)
    const avgRevenueH3 = summaryCards[1].querySelector('h3');
    if (avgRevenueH3) {
      const oldValue = avgRevenueH3.textContent;
      avgRevenueH3.textContent = summary.formatted.average_monthly_revenue_per_hospital;
      console.log("Updated Average Revenue:", oldValue, "->", avgRevenueH3.textContent);
    } else {
      console.error("Could not find h3 in second summary card");
    }
    
    // Update the trend for average revenue
    const avgTrendDiv = summaryCards[1].querySelector('.trend');
    if (avgTrendDiv) {
      avgTrendDiv.textContent = `Based on ${summary.active_hospital_count} hospitals`;
      avgTrendDiv.className = 'trend neutral';
    }
    
    // Update Top Performing Plan (third card)
    const topPlanH3 = summaryCards[2].querySelector('h3');
    if (topPlanH3 && summary.top_performing_plan) {
      const oldValue = topPlanH3.textContent;
      topPlanH3.textContent = summary.top_performing_plan.plan_name;
      console.log("Updated Top Plan:", oldValue, "->", topPlanH3.textContent);
      
      // Update the trend text
      const trendDiv = summaryCards[2].querySelector('.trend');
      if (trendDiv && summary.total_annual_revenue > 0) {
        const percentage = ((summary.top_performing_plan.total_revenue / summary.total_annual_revenue) * 100).toFixed(1);
        trendDiv.textContent = `${percentage}% of total revenue`;
        trendDiv.className = 'trend neutral';
        console.log("Updated Top Plan percentage:", percentage + "%");
      }
    } else {
      if (!topPlanH3) console.error("Could not find h3 in third summary card");
      if (!summary.top_performing_plan) console.error("No top performing plan data");
    }
  } else {
    console.error("Expected 3 summary cards, found:", summaryCards.length);
  }

  console.log("Revenue UI update completed");
}

async function loadHospitalRevenueTable() {
  try {
    console.log("Loading hospital revenue table...");
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No token found for loading hospital revenue table");
      return;
    }

    // Fetch hospitals with subscriptions
    const res = await fetch("http://localhost/HMS/public/api/platform/admin/subscriptions/active", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    console.log("Hospital subscriptions API response status:", res.status);

    if (!res.ok) {
      console.error('Failed to fetch hospital subscriptions, status:', res.status);
      const errorText = await res.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await res.json();
    console.log("Hospital subscriptions API result:", result);
    
    if (!result.success) {
      console.error('Invalid response from subscriptions API:', result);
      return;
    }

    const subscriptions = result.data.subscriptions || [];
    console.log("Found subscriptions:", subscriptions.length);
    
    // Render hospital revenue table
    renderHospitalRevenueTable(subscriptions);

  } catch (err) {
    console.error('Error loading hospital revenue table:', err);
  }
}

function renderHospitalRevenueTable(subscriptions) {
  console.log("Rendering hospital revenue table with", subscriptions.length, "subscriptions");
  const tbody = document.getElementById('revenueTableBody');
  
  if (!tbody) {
    console.error('Revenue table body not found (id: revenueTableBody)');
    return;
  }

  if (subscriptions.length === 0) {
    console.log("No subscriptions to display");
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
          No active subscriptions found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = subscriptions.map((sub, index) => {
    console.log(`Rendering subscription ${index + 1}:`, sub);
    const monthlyRevenue = Math.round(sub.monthly_cost);
    const ytdRevenue = Math.round(sub.annual_cost);
    const statusClass = sub.status === 'ACTIVE' ? 'active' : 'pending';
    
    return `
      <tr>
        <td>${sub.hospital_name}</td>
        <td>${sub.hospital_code}</td>
        <td>${sub.plan_name}</td>
        <td>₹${monthlyRevenue.toLocaleString()}</td>
        <td>₹${ytdRevenue.toLocaleString()}</td>
        <td>-</td>
        <td><span class="status ${statusClass}">${sub.status}</span></td>
      </tr>
    `;
  }).join('');
  
  console.log("Hospital revenue table rendered successfully");
}

// ================= NAVIGATION =================
function goBack() {
  window.location.href = 'super_admin_dashboard.html';
}

function goToDashboard() {
  window.location.href = 'super_admin_dashboard.html';
}

function goToHospitals() {
  window.location.href = 'super_admin_dashboard.html#hospitals';
}

function goToModules() {
  window.location.href = 'super_admin_modules.html';
}

function goToUserManagement() {
  window.location.href = 'super_admin_dashboard.html#user-management';
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = 'index.html';
  }
}

// ================= REPORT TAB MANAGEMENT =================
function showRevenueReport() {
  switchReportTab('revenue');
  setActiveReportTab(0);
  loadRevenueDataFromAPI();
}

function showSubscriptionReport() {
  switchReportTab('subscription');
  setActiveReportTab(1);
  loadSubscriptionData();
}

function showUsageReport() {
  switchReportTab('usage');
  setActiveReportTab(2);
  loadUsageData();
}

function showGrowthReport() {
  switchReportTab('growth');
  setActiveReportTab(3);
  loadGrowthData();
}

function switchReportTab(tabName) {
  // Hide all report sections
  document.querySelectorAll('.report-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show selected report section
  const targetSection = document.getElementById(tabName + 'Report');
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  currentReportTab = tabName;
}

function setActiveReportTab(index) {
  document.querySelectorAll('.report-tabs .tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.querySelectorAll('.report-tabs .tab')[index].classList.add('active');
}

// ================= REVENUE REPORT =================
function loadRevenueData() {
  // This function is now replaced by loadRevenueDataFromAPI
  // Keeping for backward compatibility
  loadHospitalRevenueTable();
}

function applyRevenueFilter() {
  const timeFilter = document.getElementById('revenueTimeFilter').value;
  
  // In a real application, this would filter the data based on the selected time period
  showSuccessMessage(`Revenue report filtered by: ${timeFilter}`);
  loadRevenueData();
}

async function exportRevenueReport() {
  console.log("Exporting revenue report with scope=current...");
  
  const token = localStorage.getItem("token");
  
  if (!token) {
    alert("Please login first");
    return;
  }
  
  // Confirm export
  if (!confirm('Export current revenue report to CSV?')) {
    return;
  }
  
  // Find the export button and disable it
  const exportBtn = document.querySelector('.excel-btn[onclick*="exportRevenueReport"]');
  const originalText = exportBtn ? exportBtn.textContent : '';
  
  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting...';
    exportBtn.style.opacity = '0.6';
    exportBtn.style.cursor = 'not-allowed';
  }
  
  try {
    // Build export URL with scope=current
    const baseUrl = "http://localhost/HMS/public/api/platform/admin/reports/revenue/export";
    const params = new URLSearchParams({
      scope: 'current'
    });
    
    const exportUrl = `${baseUrl}?${params.toString()}`;
    
    console.log("Fetching export from:", exportUrl);
    
    // Show loading message
    showSuccessMessage('Starting export...');
    
    // Fetch with authentication
    const response = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    console.log("Export response status:", response.status);
    
    if (!response.ok) {
      // Handle error response
      const errorText = await response.text();
      console.error("Export error:", errorText);
      alert("Export failed: " + errorText);
      return;
    }
    
    // Get the blob
    const blob = await response.blob();
    
    // Get filename from Content-Disposition header or use default
    let filename = 'revenue_report.csv';
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log("Export completed successfully");
    showSuccessMessage('Export completed successfully!');
    
  } catch (error) {
    console.error("Export error:", error);
    alert("Export failed: " + error.message);
  } finally {
    // Re-enable button
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.textContent = originalText;
      exportBtn.style.opacity = '1';
      exportBtn.style.cursor = 'pointer';
    }
  }
}

// ================= SUBSCRIPTION RENEWAL REPORT =================
function loadSubscriptionData() {
  const tbody = document.getElementById('renewalTableBody');
  tbody.innerHTML = '';
  
  renewalData.forEach(hospital => {
    const urgencyClass = hospital.daysRemaining <= 7 ? 'urgent-row' : 
                        hospital.daysRemaining <= 30 ? 'warning-row' : '';
    
    const daysClass = hospital.daysRemaining <= 7 ? 'urgent' : 
                     hospital.daysRemaining <= 30 ? 'warning' : 'safe';
    
    const actionButton = hospital.status === 'overdue' ? 
      `<button class="action-btn urgent" onclick="contactHospital('${hospital.code}')">Contact Now</button>` :
      hospital.daysRemaining <= 30 ?
      `<button class="action-btn warning" onclick="sendReminder('${hospital.code}')">Send Reminder</button>` :
      `<button class="action-btn view" onclick="viewDetails('${hospital.code}')">View Details</button>`;
    
    const row = `
      <tr class="${urgencyClass}">
        <td>${hospital.name}</td>
        <td><span class="plan-badge ${hospital.plan}">${hospital.plan.charAt(0).toUpperCase() + hospital.plan.slice(1)}</span></td>
        <td>${hospital.expiryDate}</td>
        <td><span class="days-remaining ${daysClass}">${hospital.daysRemaining} days</span></td>
        <td><span class="renewal-status ${hospital.status}">${hospital.status.charAt(0).toUpperCase() + hospital.status.slice(1)}</span></td>
        <td>${actionButton}</td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

function applyRenewalFilter() {
  const timeFilter = document.getElementById('renewalTimeFilter').value;
  showSuccessMessage(`Renewal report filtered for next ${timeFilter} days`);
  loadSubscriptionData();
}

function exportRenewalReport() {
  showSuccessMessage('Subscription renewal report exported successfully!');
}

function contactHospital(hospitalCode) {
  const contactModal = `
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
        padding: 30px;
        border-radius: 16px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      " onclick="event.stopPropagation()">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #dc2626;">🚨 Urgent: Contact Hospital</h3>
          <button onclick="closeModal()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
          ">&times;</button>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Hospital:</strong> ${hospitalCode}</p>
          <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: 600;">Subscription Overdue</span></p>
          <p><strong>Action Required:</strong> Immediate renewal needed</p>
        </div>
        
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
          <h4 style="margin: 0 0 8px 0; color: #dc2626;">Contact Methods:</h4>
          <div style="display: grid; gap: 8px;">
            <button onclick="makePhoneCall('${hospitalCode}')" style="
              background: #16a34a;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
            ">📞 Call Hospital Admin</button>
            
            <button onclick="sendUrgentEmail('${hospitalCode}')" style="
              background: #dc2626;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
            ">📧 Send Urgent Email</button>
            
            <button onclick="sendSMS('${hospitalCode}')" style="
              background: #f59e0b;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
            ">💬 Send SMS Alert</button>
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="closeModal()" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Close</button>
          <button onclick="scheduleFollowUp('${hospitalCode}')" style="
            background: #1e4fa1;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Schedule Follow-up</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', contactModal);
}

function sendReminder(hospitalCode) {
  const reminderModal = `
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
        padding: 30px;
        border-radius: 16px;
        max-width: 600px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      " onclick="event.stopPropagation()">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #f59e0b;">📋 Send Renewal Reminder</h3>
          <button onclick="closeModal()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
          ">&times;</button>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Hospital:</strong> ${hospitalCode}</p>
          <p><strong>Reminder Type:</strong> Subscription Renewal</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Reminder Message:</label>
          <textarea id="reminderMessage" style="
            width: 100%;
            height: 100px;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            resize: vertical;
          " placeholder="Enter custom reminder message...">Dear Hospital Administrator,

This is a friendly reminder that your ITiVAT MED platform subscription is due for renewal in 13 days.

Please contact our billing team to ensure uninterrupted service.

Best regards,
ITiVAT MED Support Team</textarea>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0;">Send Via:</h4>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <label style="display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" checked> Email
            </label>
            <label style="display: flex; align-items: center; gap: 6px;">
              <input type="checkbox" checked> SMS
            </label>
            <label style="display: flex; align-items: center; gap: 6px;">
              <input type="checkbox"> WhatsApp
            </label>
            <label style="display: flex; align-items: center; gap: 6px;">
              <input type="checkbox"> In-App Notification
            </label>
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="document.querySelector('div[style*=\"position: fixed\"]').remove()" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Cancel</button>
          <button onclick="sendReminderNow('${hospitalCode}')" style="
            background: #f59e0b;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Send Reminder</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', reminderModal);
}

function viewDetails(hospitalCode) {
  const detailsModal = `
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
        padding: 30px;
        border-radius: 16px;
        max-width: 600px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      " onclick="event.stopPropagation()">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #1e4fa1;">📊 Subscription Details</h3>
          <button onclick="closeModal()" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
          ">&times;</button>
        </div>
        
        <div style="display: grid; gap: 15px;">
          <div style="display: flex; justify-content: space-between;">
            <strong>Hospital Code:</strong>
            <span>${hospitalCode}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <strong>Current Plan:</strong>
            <span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">Premium</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <strong>Monthly Cost:</strong>
            <span>₹15,000</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <strong>Start Date:</strong>
            <span>2025-03-15</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <strong>Expiry Date:</strong>
            <span>2026-03-15</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <strong>Days Remaining:</strong>
            <span style="color: #16a34a; font-weight: 600;">43 days</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <strong>Auto-Renewal:</strong>
            <span style="color: #16a34a;">✓ Enabled</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <strong>Payment Method:</strong>
            <span>Bank Transfer</span>
          </div>
        </div>
        
        <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="renewSubscription('${hospitalCode}')" style="
            background: #16a34a;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Renew Now</button>
          <button onclick="closeModal()" style="
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

// Helper functions
function closeModal() {
  const modal = document.querySelector('div[style*="position: fixed"]');
  if (modal) {
    modal.remove();
  }
}

function makePhoneCall(hospitalCode) {
  alert(`Initiating call to ${hospitalCode} hospital admin...\n\nPhone: +91 22 2345 6789\nContact: Hospital Administrator`);
}

function sendUrgentEmail(hospitalCode) {
  alert(`Urgent email sent to ${hospitalCode}!\n\nSubject: URGENT - Subscription Renewal Required\nStatus: Delivered\nTime: ${new Date().toLocaleTimeString()}`);
}

function sendSMS(hospitalCode) {
  alert(`SMS alert sent to ${hospitalCode}!\n\nMessage: Your ITiVAT MED subscription is overdue. Please renew immediately.\nStatus: Delivered`);
}

function scheduleFollowUp(hospitalCode) {
  alert(`Follow-up scheduled for ${hospitalCode}\n\nNext contact: Tomorrow at 10:00 AM\nReminder set: 1 hour before`);
}

function sendReminderNow(hospitalCode) {
  const message = document.getElementById('reminderMessage')?.value || 'Default reminder message';
  closeModal();
  alert(`Renewal reminder sent to ${hospitalCode}!\n\nMessage sent via: Email, SMS\nDelivery status: Successful\nTime: ${new Date().toLocaleTimeString()}`);
}

function renewSubscription(hospitalCode) {
  alert(`Opening renewal process for ${hospitalCode}...\n\nThis would redirect to:\n• Payment gateway\n• Plan selection\n• Billing information\n• Renewal confirmation`);
}

// ================= USAGE REPORT =================
async function loadUsageData() {
  try {
    console.log("Loading usage statistics from API...");
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.warn("No token found for loading usage statistics");
      return;
    }

    // Fetch usage summary from API
    const res = await fetch("http://localhost/HMS/public/api/platform/admin/usage/summary", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    console.log("Usage API response status:", res.status);

    if (!res.ok) {
      console.error('Failed to fetch usage data, status:', res.status);
      const errorText = await res.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await res.json();
    console.log("Usage API result:", result);
    
    if (!result.success) {
      console.error('Invalid response from usage API:', result);
      return;
    }

    const summary = result.data.summary;
    console.log('Loaded usage summary:', summary);

    // Update the UI with real data
    updateUsageUI(summary);

  } catch (err) {
    console.error('Error loading usage data:', err);
  }
}

function updateUsageUI(summary) {
  console.log("Updating usage UI with summary:", summary);
  
  // Update Active Hospitals card
  const activeHospitalsCard = document.querySelector('.usage-card:nth-child(1) .usage-info h3');
  if (activeHospitalsCard) {
    const activeCount = summary.active_hospitals.active_count;
    const totalCount = summary.active_hospitals.total_count;
    activeHospitalsCard.textContent = `${activeCount} / ${totalCount}`;
    console.log("Updated Active Hospitals:", activeCount, "/", totalCount);
  }
  
  const activeHospitalsText = document.querySelector('.usage-card:nth-child(1) .usage-info p');
  if (activeHospitalsText) {
    activeHospitalsText.textContent = summary.summary.platform_utilization + ' Platform Utilization';
  }
  
  // Update Total Modules Enabled card
  const modulesCard = document.querySelector('.usage-card:nth-child(2) .usage-info h3');
  if (modulesCard) {
    modulesCard.textContent = summary.total_modules_enabled.total_enabled_modules;
    console.log("Updated Total Modules:", summary.total_modules_enabled.total_enabled_modules);
  }
  
  const modulesText = document.querySelector('.usage-card:nth-child(2) .usage-info p');
  if (modulesText) {
    modulesText.textContent = `Across ${summary.active_hospitals.active_count} active hospitals`;
  }
  
  // Update Module Usage Breakdown
  updateModuleBreakdown(summary.module_breakdown);
  
  console.log("Usage UI update completed");
}

function updateModuleBreakdown(modules) {
  console.log("Updating module breakdown with", modules.length, "modules");
  
  const moduleStats = document.querySelector('.module-stats');
  if (!moduleStats) {
    console.error("Module stats container not found");
    return;
  }
  
  // Clear existing content
  moduleStats.innerHTML = '';
  
  // Render each module
  modules.forEach(module => {
    const moduleHtml = `
      <div class="module-stat">
        <div class="module-name">${module.module_name}</div>
        <div class="usage-bar">
          <div class="usage-fill" style="width: ${module.usage_percentage}%"></div>
        </div>
        <div class="usage-percent">${module.usage_percentage}% (${module.usage_ratio})</div>
      </div>
    `;
    moduleStats.innerHTML += moduleHtml;
  });
  
  console.log("Module breakdown updated successfully");
}

function applyUsageFilter() {
  const timeFilter = document.getElementById('usageTimeFilter').value;
  showSuccessMessage(`Usage statistics filtered for: ${timeFilter}`);
}

function exportUsageReport() {
  showSuccessMessage('System usage report exported successfully!');
}

// ================= GROWTH REPORT =================
function loadGrowthData() {
  // Growth data is static in the HTML for this demo
  // In a real application, this would be loaded dynamically
}

function applyGrowthFilter() {
  const timeFilter = document.getElementById('growthTimeFilter').value;
  showSuccessMessage(`Growth analytics filtered for: ${timeFilter}`);
}

function exportGrowthReport() {
  showSuccessMessage('Platform growth report exported successfully!');
}

// ================= GENERAL REPORT FUNCTIONS =================
function scheduleReport() {
  const reportType = currentReportTab;
  alert(`Scheduling ${reportType} report for automatic generation...`);
}

async function exportAllReports() {
  console.log("Exporting all reports with scope=all...");
  
  const token = localStorage.getItem("token");
  
  if (!token) {
    alert("Please login first");
    return;
  }
  
  // Confirm export
  if (!confirm('This will export all revenue data to CSV. Continue?')) {
    return;
  }
  
  // Find the export all button and disable it
  const exportAllBtn = document.querySelector('.excel-btn[onclick*="exportAllReports"]');
  const originalText = exportAllBtn ? exportAllBtn.textContent : '';
  
  if (exportAllBtn) {
    exportAllBtn.disabled = true;
    exportAllBtn.textContent = 'Exporting...';
    exportAllBtn.style.opacity = '0.6';
    exportAllBtn.style.cursor = 'not-allowed';
  }
  
  try {
    // Build export URL with scope=all
    const baseUrl = "http://localhost/HMS/public/api/platform/admin/reports/revenue/export";
    const params = new URLSearchParams({
      scope: 'all'
    });
    
    const exportUrl = `${baseUrl}?${params.toString()}`;
    
    console.log("Fetching export from:", exportUrl);
    
    // Show loading message
    showSuccessMessage('Starting export...');
    
    // Fetch with authentication
    const response = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    console.log("Export response status:", response.status);
    
    if (!response.ok) {
      // Handle error response
      const errorText = await response.text();
      console.error("Export error:", errorText);
      alert("Export failed: " + errorText);
      return;
    }
    
    // Get the blob
    const blob = await response.blob();
    
    // Get filename from Content-Disposition header or use default
    let filename = 'revenue_report_all.csv';
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log("Export completed successfully");
    showSuccessMessage('Export completed successfully!');
    
  } catch (error) {
    console.error("Export error:", error);
    alert("Export failed: " + error.message);
  } finally {
    // Re-enable button
    if (exportAllBtn) {
      exportAllBtn.disabled = false;
      exportAllBtn.textContent = originalText;
      exportAllBtn.style.opacity = '1';
      exportAllBtn.style.cursor = 'pointer';
    }
  }
}

// ================= UTILITY FUNCTIONS =================
function showSuccessMessage(message) {
  // Create and show a temporary success message
  const successDiv = document.createElement('div');
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 1001;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;
  successDiv.textContent = message;
  
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

// ================= AUTO-REFRESH =================
// Auto-refresh data every 5 minutes for real-time updates
setInterval(() => {
  switch(currentReportTab) {
    case 'revenue':
      loadRevenueData();
      break;
    case 'subscription':
      loadSubscriptionData();
      break;
    case 'usage':
      loadUsageData();
      break;
    case 'growth':
      loadGrowthData();
      break;
  }
}, 300000); // 5 minutes

// ================= KEYBOARD SHORTCUTS =================
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey) {
    switch(e.key) {
      case '1':
        e.preventDefault();
        showRevenueReport();
        break;
      case '2':
        e.preventDefault();
        showSubscriptionReport();
        break;
      case '3':
        e.preventDefault();
        showUsageReport();
        break;
      case '4':
        e.preventDefault();
        showGrowthReport();
        break;
      case 'e':
        e.preventDefault();
        exportAllReports();
        break;
    }
  }
});