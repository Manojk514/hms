// ================= SHARED HOSPITAL DATA =================
// Load hospitals from localStorage (same as dashboard)
const defaultHospitals = [
  {
    id: 'HSP-1001',
    name: 'Apollo Hospitals',
    city: 'Hyderabad',
    state: 'Telangana',
    plan: 'premium',
    status: 'active',
    modules: ['OP', 'Lab', 'Pharmacy', 'Billing'],
  },
  {
    id: 'HSP-1002',
    name: 'Fortis Healthcare',
    city: 'Mumbai',
    state: 'Maharashtra',
    plan: 'standard',
    status: 'active',
    modules: ['OP', 'Lab', 'Billing'],
  },
  {
    id: 'HSP-1003',
    name: 'Max Healthcare',
    city: 'Delhi',
    state: 'Delhi',
    plan: 'premium',
    status: 'active',
    modules: ['OP', 'Lab', 'Pharmacy', 'Billing'],
  },
  {
    id: 'HSP-1004',
    name: 'Manipal Hospitals',
    city: 'Bangalore',
    state: 'Karnataka',
    plan: 'standard',
    status: 'active',
    modules: ['OP', 'Lab', 'Billing'],
  },
  {
    id: 'HSP-1005',
    name: 'AIIMS Delhi',
    city: 'Delhi',
    state: 'Delhi',
    plan: 'basic',
    status: 'inactive',
    modules: ['OP', 'Lab'],
  }
];

// Load hospitals from localStorage or use defaults
let hospitals = JSON.parse(localStorage.getItem('superAdminHospitals')) || [...defaultHospitals];

// Convert to module format for compatibility
const hospitalModules = {};
hospitals.forEach(hospital => {
  hospitalModules[hospital.id] = {
    name: hospital.name,
    location: `${hospital.city}, ${hospital.state}`,
    plan: hospital.plan,
    status: hospital.status,
    modules: {
      op: hospital.modules.includes('OP'),
      lab: hospital.modules.includes('Lab'),
      pharmacy: hospital.modules.includes('Pharmacy'),
      billing: hospital.modules.includes('Billing'),
      ipd: false,
      emergency: false
    },
    lastUpdated: '2026-01-15'
  };
});

console.log('Hospital modules created:', hospitalModules); // Debug log

const modulePricing = {
  basic: { op: 2000, lab: 1500, pharmacy: 1000, billing: 500 },
  standard: { op: 3000, lab: 2500, pharmacy: 1500, billing: 1000 },
  premium: { op: 5000, lab: 4000, pharmacy: 2500, billing: 1500 }
};

let currentHospitalId = null;
let hasUnsavedChanges = false;

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', function() {
  // Initialize page
});

// ================= NAVIGATION =================
function goBack() {
  if (hasUnsavedChanges) {
    if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
      window.location.href = 'super_admin_dashboard.html';
    }
  } else {
    window.location.href = 'super_admin_dashboard.html';
  }
}

function goToDashboard() {
  window.location.href = 'super_admin_dashboard.html';
}

function goToHospitals() {
  window.location.href = 'super_admin_dashboard.html#hospitals';
}

function goToReports() {
  window.location.href = 'super_admin_reports.html';
}

function goToUserManagement() {
  window.location.href = 'super_admin_dashboard.html#user-management';
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = 'index.html';
  }
}

// ================= HOSPITAL SELECTION =================
function loadHospitalModules() {
  const hospitalSelect = document.getElementById('hospitalSelect');
  const hospitalId = hospitalSelect.value;
  
  console.log('Selected hospital ID:', hospitalId); // Debug log
  console.log('Available hospitals:', Object.keys(hospitalModules)); // Debug log
  
  if (!hospitalId) {
    showEmptyState();
    return;
  }
  
  currentHospitalId = hospitalId;
  const hospital = hospitalModules[hospitalId];
  
  console.log('Found hospital data:', hospital); // Debug log
  
  if (!hospital) {
    console.error('Hospital not found:', hospitalId); // Debug log
    showEmptyState();
    return;
  }
  
  // Hide empty state and show config panel
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('moduleConfigPanel').style.display = 'block';
  
  // Update hospital info
  document.getElementById('selectedHospitalName').textContent = hospital.name;
  document.getElementById('selectedHospitalLocation').textContent = hospital.location;
  
  const planBadge = document.getElementById('selectedHospitalPlan');
  planBadge.textContent = hospital.plan.charAt(0).toUpperCase() + hospital.plan.slice(1) + ' Plan';
  planBadge.className = `plan-badge ${hospital.plan}`;
  
  const statusBadge = document.getElementById('selectedHospitalStatus');
  statusBadge.textContent = hospital.status.charAt(0).toUpperCase() + hospital.status.slice(1);
  statusBadge.className = `status ${hospital.status}`;
  
  // Update module toggles
  updateModuleToggles(hospital.modules);
  
  // Update summary
  updateConfigurationSummary(hospital);
  
  // Reset unsaved changes flag
  hasUnsavedChanges = false;
}

function showEmptyState() {
  document.getElementById('emptyState').style.display = 'block';
  document.getElementById('moduleConfigPanel').style.display = 'none';
  currentHospitalId = null;
}

// ================= MODULE MANAGEMENT =================
function updateModuleToggles(modules) {
  // Update toggle switches
  document.getElementById('opModule').checked = modules.op;
  document.getElementById('labModule').checked = modules.lab;
  document.getElementById('pharmacyModule').checked = modules.pharmacy;
  document.getElementById('billingModule').checked = modules.billing;
  
  // Update module status displays
  updateModuleStatus('op', modules.op);
  updateModuleStatus('lab', modules.lab);
  updateModuleStatus('pharmacy', modules.pharmacy);
  updateModuleStatus('billing', modules.billing);
}

function updateModuleStatus(moduleType, enabled) {
  const statusElement = document.getElementById(moduleType + 'Status');
  if (enabled) {
    statusElement.className = 'module-status enabled';
    statusElement.innerHTML = '<span class="status-dot"></span>Module Enabled';
  } else {
    statusElement.className = 'module-status disabled';
    statusElement.innerHTML = '<span class="status-dot"></span>Module Disabled';
  }
}

function toggleModule(moduleType) {
  if (!currentHospitalId) return;
  
  const checkbox = document.getElementById(moduleType + 'Module');
  const isEnabled = checkbox.checked;
  
  // Update the hospital data
  hospitalModules[currentHospitalId].modules[moduleType] = isEnabled;
  
  // Update visual status
  updateModuleStatus(moduleType, isEnabled);
  
  // Update summary
  updateConfigurationSummary(hospitalModules[currentHospitalId]);
  
  // Mark as having unsaved changes
  hasUnsavedChanges = true;
  
  // Add visual indicator for unsaved changes
  highlightUnsavedChanges();
}

function highlightUnsavedChanges() {
  const saveButton = document.querySelector('.config-actions .primary-btn');
  saveButton.style.background = '#dc2626';
  saveButton.textContent = 'Save Configuration *';
}

// ================= CONFIGURATION SUMMARY =================
function updateConfigurationSummary(hospital) {
  // Update enabled modules list
  const enabledModulesList = document.getElementById('enabledModulesList');
  const enabledModules = Object.keys(hospital.modules).filter(module => hospital.modules[module]);
  
  enabledModulesList.innerHTML = enabledModules.map(module => 
    `<span class="badge">${module.toUpperCase()}</span>`
  ).join('');
  
  // Calculate monthly cost
  const monthlyCost = calculateMonthlyCost(hospital.plan, hospital.modules);
  document.getElementById('monthlyCost').textContent = `₹${monthlyCost.toLocaleString()}`;
  
  // Update last updated
  document.getElementById('lastUpdated').textContent = hospital.lastUpdated || 'Never';
}

function calculateMonthlyCost(plan, modules) {
  const pricing = modulePricing[plan];
  let total = 0;
  
  Object.keys(modules).forEach(module => {
    if (modules[module] && pricing[module]) {
      total += pricing[module];
    }
  });
  
  return total;
}

// ================= CONFIGURATION ACTIONS =================
function saveConfiguration() {
  if (!currentHospitalId) {
    alert('Please select a hospital first.');
    return;
  }
  
  // Update last updated timestamp
  hospitalModules[currentHospitalId].lastUpdated = new Date().toISOString().split('T')[0];
  
  // Reset unsaved changes
  hasUnsavedChanges = false;
  
  // Reset save button
  const saveButton = document.querySelector('.config-actions .primary-btn');
  saveButton.style.background = '#1e4fa1';
  saveButton.textContent = 'Save Configuration';
  
  // Update summary
  updateConfigurationSummary(hospitalModules[currentHospitalId]);
  
  // Show success message
  showSuccessMessage('Configuration saved successfully!');
}

function resetConfiguration() {
  if (!currentHospitalId) return;
  
  if (confirm('Are you sure you want to reset to default configuration? This will enable only OP and Lab modules.')) {
    // Reset to default modules
    hospitalModules[currentHospitalId].modules = {
      op: true,
      lab: true,
      pharmacy: false,
      billing: false,
      ipd: false,
      emergency: false
    };
    
    // Update UI
    updateModuleToggles(hospitalModules[currentHospitalId].modules);
    updateConfigurationSummary(hospitalModules[currentHospitalId]);
    
    hasUnsavedChanges = true;
    highlightUnsavedChanges();
  }
}

function previewChanges() {
  if (!currentHospitalId) return;
  
  const hospital = hospitalModules[currentHospitalId];
  const enabledModules = Object.keys(hospital.modules).filter(module => hospital.modules[module]);
  const cost = calculateMonthlyCost(hospital.plan, hospital.modules);
  
  const preview = `
Configuration Preview for ${hospital.name}:

Enabled Modules: ${enabledModules.map(m => m.toUpperCase()).join(', ')}
Monthly Cost: ₹${cost.toLocaleString()}
Plan: ${hospital.plan.charAt(0).toUpperCase() + hospital.plan.slice(1)}

This configuration will be applied when you save.
  `;
  
  alert(preview);
}

function saveAllConfigurations() {
  let savedCount = 0;
  
  Object.keys(hospitalModules).forEach(hospitalId => {
    hospitalModules[hospitalId].lastUpdated = new Date().toISOString().split('T')[0];
    savedCount++;
  });
  
  hasUnsavedChanges = false;
  showSuccessMessage(`All configurations saved successfully! (${savedCount} hospitals updated)`);
}

// ================= BULK CONFIGURATION =================
function bulkConfigureModules() {
  document.getElementById('bulkConfigModal').classList.add('active');
}

function closeBulkConfig() {
  document.getElementById('bulkConfigModal').classList.remove('active');
}

function applyBulkConfiguration() {
  const selectedHospitals = Array.from(document.querySelectorAll('.hospital-checkboxes input:checked'))
    .map(cb => cb.value);
  
  const selectedModules = Array.from(document.querySelectorAll('.module-checkboxes input:checked'))
    .map(cb => cb.value);
  
  if (selectedHospitals.length === 0) {
    alert('Please select at least one hospital.');
    return;
  }
  
  if (selectedModules.length === 0) {
    alert('Please select at least one module.');
    return;
  }
  
  const confirmMessage = `Apply configuration to ${selectedHospitals.length} hospital(s)?\n\nModules to enable: ${selectedModules.map(m => m.toUpperCase()).join(', ')}`;
  
  if (confirm(confirmMessage)) {
    selectedHospitals.forEach(hospitalId => {
      if (hospitalModules[hospitalId]) {
        // Reset all modules to false first
        Object.keys(hospitalModules[hospitalId].modules).forEach(module => {
          hospitalModules[hospitalId].modules[module] = false;
        });
        
        // Enable selected modules
        selectedModules.forEach(module => {
          hospitalModules[hospitalId].modules[module] = true;
        });
        
        hospitalModules[hospitalId].lastUpdated = new Date().toISOString().split('T')[0];
      }
    });
    
    // Refresh current hospital if it was affected
    if (currentHospitalId && selectedHospitals.includes(currentHospitalId)) {
      loadHospitalModules();
    }
    
    closeBulkConfig();
    showSuccessMessage(`Bulk configuration applied to ${selectedHospitals.length} hospital(s) successfully!`);
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
  `;
  successDiv.textContent = message;
  
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

// ================= EVENT LISTENERS =================
// Close modal when clicking outside
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('active');
    });
  }
  
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    saveConfiguration();
  }
});

// Warn before leaving with unsaved changes
window.addEventListener('beforeunload', function(e) {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});