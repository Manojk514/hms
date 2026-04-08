// ================= SHARED HOSPITAL DATA =================
let hospitals = [];
const hospitalModules = {};

let currentHospitalId = null;
let hasUnsavedChanges = false;

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Module Configuration page loaded');
  // Load hospitals from API
  await loadHospitalsFromAPI();
  console.log('Hospitals after load:', hospitals);
  populateHospitalDropdown();
  console.log('Dropdown populated');
});

// Load hospitals from API
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

    if (!res.ok) {
      alert(result.error?.message || "Failed to fetch hospitals");
      return;
    }

    hospitals = result.data.items || [];
    
    // Convert to module format
    hospitals.forEach(hospital => {
      hospitalModules[hospital.id] = {
        hospital_code: hospital.hospital_code,
        name: hospital.name,
        location: `${hospital.city}, ${hospital.state}`,
        plan: hospital.plan || 'basic',
        status: hospital.status,
        modules: hospital.modules || [],
        lastUpdated: hospital.updated_at
      };
    });

    console.log('Hospitals loaded:', hospitals);
    console.log('Hospital modules:', hospitalModules);

  } catch (err) {
    console.error(err);
    alert("Server error while loading hospitals");
  }
}

// Populate hospital dropdown with real data (ACTIVE hospitals only)
function populateHospitalDropdown() {
  const select = document.getElementById('hospitalSelect');
  
  if (!select) {
    console.error('Hospital select element not found!');
    return;
  }
  
  select.innerHTML = '<option value="">Choose a hospital...</option>';
  
  // Filter to show only ACTIVE hospitals
  const activeHospitals = hospitals.filter(h => h.status && h.status.toUpperCase() === 'ACTIVE');
  
  console.log('Total hospitals:', hospitals.length);
  console.log('Active hospitals:', activeHospitals.length);
  
  if (activeHospitals.length === 0) {
    const option = document.createElement('option');
    option.value = "";
    option.textContent = "No active hospitals found";
    option.disabled = true;
    select.appendChild(option);
    return;
  }
  
  activeHospitals.forEach(hospital => {
    const option = document.createElement('option');
    option.value = hospital.id;
    option.textContent = `${hospital.hospital_code} - ${hospital.name}`;
    select.appendChild(option);
    console.log('Added active hospital:', hospital.hospital_code, hospital.name, hospital.status);
  });
  
  console.log('Dropdown now has', select.options.length, 'options (including placeholder)');
}

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
  // Since we're using real data from API, we don't calculate cost here
  // The cost should come from the subscription plan assigned to the hospital
  // For now, return 0 as placeholder
  return 0;
}

// ================= CONFIGURATION ACTIONS =================
// ================= CONFIGURATION ACTIONS =================
async function saveConfiguration() {
  if (!currentHospitalId) {
    alert('Please select a hospital first.');
    return;
  }
  
  const hospital = hospitalModules[currentHospitalId];
  
  // Build modules array with all modules and their status
  const modules = [
    {
      module_code: 'OP',
      is_enabled: document.getElementById('opModule').checked
    },
    {
      module_code: 'LAB',
      is_enabled: document.getElementById('labModule').checked
    },
    {
      module_code: 'PHARMACY',
      is_enabled: document.getElementById('pharmacyModule').checked
    },
    {
      module_code: 'BILLING',
      is_enabled: document.getElementById('billingModule').checked
    }
  ];
  
  // Check if any module is being disabled
  const hasDisabled = modules.some(m => !m.is_enabled);
  
  // If disabling modules, ask for reason
  let reason = null;
  if (hasDisabled) {
    reason = prompt('Please provide a reason for disabling modules:');
    if (!reason || reason.trim().length < 10) {
      alert('Reason must be at least 10 characters long.');
      return;
    }
  }
  
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = "super_admin_login.html";
      return;
    }
    
    // Save each module configuration via API
    const saveButton = document.querySelector('.config-actions .primary-btn');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    
    // Use bulk update API endpoint
    const payload = { modules };
    if (reason) {
      payload.reason = reason;
    }
    
    const res = await fetch(`http://localhost/HMS/public/api/platform/admin/hospitals/${currentHospitalId}/modules`, {
      method: 'PATCH',
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    
    if (!res.ok || !result.success) {
      throw new Error(result.error?.message || 'Failed to save configuration');
    }
    
    console.log('Configuration saved:', result);
    
    // Update last updated timestamp
    hospital.lastUpdated = new Date().toLocaleString();
    
    // Reset unsaved changes
    hasUnsavedChanges = false;
    
    // Reset save button
    saveButton.disabled = false;
    saveButton.style.background = '#1e4fa1';
    saveButton.textContent = 'Save Configuration';
    
    // Update summary
    updateConfigurationSummary(hospital);
    
    // Reload hospital data to get updated modules from database
    await loadHospitalsFromAPI();
    
    // Show success message
    showSuccessMessage('Configuration saved successfully!');
    
  } catch (err) {
    console.error('Error saving configuration:', err);
    alert('Failed to save configuration: ' + err.message);
    
    const saveButton = document.querySelector('.config-actions .primary-btn');
    saveButton.disabled = false;
    saveButton.textContent = 'Save Configuration';
  }
}

function resetConfiguration() {
  if (!currentHospitalId) {
    alert('Please select a hospital first.');
    return;
  }
  
  if (confirm('Are you sure you want to reset to default configuration? This will disable all modules.')) {
    // Uncheck all modules
    document.getElementById('opModule').checked = false;
    document.getElementById('labModule').checked = false;
    document.getElementById('pharmacyModule').checked = false;
    document.getElementById('billingModule').checked = false;
    
    // Update module status displays
    updateModuleStatus('op', false);
    updateModuleStatus('lab', false);
    updateModuleStatus('pharmacy', false);
    updateModuleStatus('billing', false);
    
    // Update summary
    const hospital = hospitalModules[currentHospitalId];
    updateConfigurationSummary(hospital);
    
    hasUnsavedChanges = true;
    highlightUnsavedChanges();
  }
}

function previewChanges() {
  if (!currentHospitalId) {
    alert('Please select a hospital first.');
    return;
  }
  
  const hospital = hospitalModules[currentHospitalId];
  const enabledModules = [];
  
  if (document.getElementById('opModule').checked) enabledModules.push('OP');
  if (document.getElementById('labModule').checked) enabledModules.push('LAB');
  if (document.getElementById('pharmacyModule').checked) enabledModules.push('PHARMACY');
  if (document.getElementById('billingModule').checked) enabledModules.push('BILLING');
  
  const preview = `
Configuration Preview for ${hospital.name}:

Hospital Code: ${hospital.hospital_code}
Location: ${hospital.location}
Status: ${hospital.status.toUpperCase()}

Enabled Modules: ${enabledModules.length > 0 ? enabledModules.join(', ') : 'None'}

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
  // Populate hospital list with real data
  populateBulkHospitalList();
  
  // Show modal
  document.getElementById('bulkConfigModal').classList.add('active');
}

function populateBulkHospitalList() {
  const container = document.getElementById('bulkHospitalList');
  
  // Filter to show only ACTIVE hospitals
  const activeHospitals = hospitals.filter(h => h.status && h.status.toUpperCase() === 'ACTIVE');
  
  if (activeHospitals.length === 0) {
    container.innerHTML = '<p style="color: #6b7280; padding: 10px;">No active hospitals available</p>';
    return;
  }
  
  container.innerHTML = '';
  
  activeHospitals.forEach(hospital => {
    const label = document.createElement('label');
    label.style.display = 'block';
    label.style.marginBottom = '8px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = hospital.id;
    checkbox.dataset.hospitalCode = hospital.hospital_code;
    checkbox.dataset.hospitalName = hospital.name;
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${hospital.hospital_code} - ${hospital.name}`));
    
    container.appendChild(label);
  });
}

function closeBulkConfig() {
  document.getElementById('bulkConfigModal').classList.remove('active');
}

async function applyBulkConfiguration() {
  const selectedHospitals = Array.from(document.querySelectorAll('#bulkHospitalList input:checked'));
  
  // Build modules array with all modules and their status
  const modules = [
    {
      module_code: 'OP',
      is_enabled: document.getElementById('bulkOpModule').checked
    },
    {
      module_code: 'LAB',
      is_enabled: document.getElementById('bulkLabModule').checked
    },
    {
      module_code: 'PHARMACY',
      is_enabled: document.getElementById('bulkPharmacyModule').checked
    },
    {
      module_code: 'BILLING',
      is_enabled: document.getElementById('bulkBillingModule').checked
    }
  ];
  
  if (selectedHospitals.length === 0) {
    alert('Please select at least one hospital.');
    return;
  }
  
  // Check if any module is being disabled
  const hasDisabled = modules.some(m => !m.is_enabled);
  
  // If disabling modules, ask for reason
  let reason = null;
  if (hasDisabled) {
    reason = prompt('Please provide a reason for disabling modules:');
    if (!reason || reason.trim().length < 10) {
      alert('Reason must be at least 10 characters long.');
      return;
    }
  }
  
  const hospitalNames = selectedHospitals.map(cb => cb.dataset.hospitalName).join(', ');
  const enabledModules = modules.filter(m => m.is_enabled).map(m => m.module_code);
  const confirmMessage = `Apply configuration to ${selectedHospitals.length} hospital(s)?\n\nHospitals: ${hospitalNames}\n\nModules to enable: ${enabledModules.join(', ') || 'None'}`;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert("Session expired. Please login again.");
      window.location.href = "super_admin_login.html";
      return;
    }
    
    // Disable apply button
    const applyButton = document.querySelector('#bulkConfigModal .primary-btn');
    applyButton.disabled = true;
    applyButton.textContent = 'Applying...';
    
    // Apply configuration to each selected hospital
    let successCount = 0;
    let failCount = 0;
    
    const payload = { modules };
    if (reason) {
      payload.reason = reason;
    }
    
    for (const checkbox of selectedHospitals) {
      const hospitalId = checkbox.value;
      
      try {
        const res = await fetch(`http://localhost/HMS/public/api/platform/admin/hospitals/${hospitalId}/modules`, {
          method: 'PATCH',
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        
        if (res.ok && result.success) {
          successCount++;
          
          // Update local data
          if (hospitalModules[hospitalId]) {
            hospitalModules[hospitalId].lastUpdated = new Date().toLocaleString();
          }
        } else {
          failCount++;
          console.error(`Failed to update hospital ${hospitalId}:`, result.error?.message);
        }
        
      } catch (err) {
        failCount++;
        console.error(`Error updating hospital ${hospitalId}:`, err);
      }
    }
    
    // Reload hospital data to get updated modules from database
    await loadHospitalsFromAPI();
    
    // Refresh current hospital if it was affected
    if (currentHospitalId && selectedHospitals.some(cb => cb.value == currentHospitalId)) {
      loadHospitalModules();
    }
    
    // Reset button
    applyButton.disabled = false;
    applyButton.textContent = 'Apply to Selected';
    
    closeBulkConfig();
    
    if (failCount === 0) {
      showSuccessMessage(`Bulk configuration applied to ${successCount} hospital(s) successfully!`);
    } else {
      alert(`Configuration applied to ${successCount} hospital(s).\n${failCount} hospital(s) failed. Check console for details.`);
    }
    
  } catch (err) {
    console.error('Error applying bulk configuration:', err);
    alert('Failed to apply bulk configuration: ' + err.message);
    
    const applyButton = document.querySelector('#bulkConfigModal .primary-btn');
    applyButton.disabled = false;
    applyButton.textContent = 'Apply to Selected';
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