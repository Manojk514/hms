// ===== MOCK PATIENT DATA =====
const patientData = {
  opNumber: 'OP12345',
  name: 'Rajesh Kumar',
  age: 45,
  gender: 'Male',
  bloodGroup: 'O+',
  phone: '+91 9876543210',
  email: 'rajesh.k@email.com',
  appointmentTime: '09:00 AM',
  chiefComplaint: 'Chest pain and breathing difficulty',
  vitals: {
    bloodPressure: '120/80 mmHg',
    temperature: '98.6°F',
    pulse: '72 bpm',
    weight: '75 kg'
  },
  previousVisits: [
    { date: '15 Jan 2026', diagnosis: 'Hypertension', doctor: 'Dr. Sharma' },
    { date: '10 Dec 2025', diagnosis: 'Regular Checkup', doctor: 'Dr. Patel' },
    { date: '05 Nov 2025', diagnosis: 'Chest Pain', doctor: 'Dr. Sharma' }
  ],
  previousPrescriptions: [
    {
      date: '15 Jan 2026',
      medicines: ['Amlodipine 5mg - Once daily', 'Aspirin 75mg - Once daily']
    },
    {
      date: '10 Dec 2025',
      medicines: ['Multivitamin - Once daily']
    }
  ]
};

let medicineCount = 0;
let symptoms = ['Chest Pain', 'Shortness of Breath'];
let labTests = [];
let followups = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  loadPatientData();
  setMinFollowupDate();
  // Add initial medicine row
  addMedicineRow();
  
  // Load draft if exists
  loadDraftData();
});

// ===== LOAD DRAFT DATA =====
function loadDraftData() {
  const appointmentId = localStorage.getItem('currentAppointmentId');
  if (!appointmentId) return;
  
  const draftKey = `draft_${appointmentId}`;
  const draftData = localStorage.getItem(draftKey);
  
  if (draftData) {
    try {
      const draft = JSON.parse(draftData);
      
      // Show notification
      if (confirm('📋 Draft Found!\n\nA saved draft was found for this appointment.\n\nDo you want to load the draft data?')) {
        // Load diagnosis
        if (draft.primaryDiagnosis) {
          document.getElementById('primaryDiagnosis').value = draft.primaryDiagnosis;
        }
        if (draft.secondaryNotes) {
          document.getElementById('secondaryNotes').value = draft.secondaryNotes;
        }
        if (draft.additionalNotes) {
          document.getElementById('additionalNotes').value = draft.additionalNotes;
        }
        
        // Load symptoms
        if (draft.symptoms && draft.symptoms.length > 0) {
          symptoms = draft.symptoms;
          const container = document.getElementById('symptomsContainer');
          container.innerHTML = '';
          symptoms.forEach(symptom => {
            const tag = document.createElement('div');
            tag.className = 'symptom-tag';
            tag.innerHTML = `${symptom} <button onclick="removeSymptom(this)">×</button>`;
            container.appendChild(tag);
          });
        }
        
        // Load medicines
        if (draft.medicines && draft.medicines.length > 0) {
          // Clear existing medicine rows
          const container = document.getElementById('medicinesContainer');
          container.innerHTML = '';
          medicineCount = 0;
          
          // Add draft medicines
          draft.medicines.forEach(medicine => {
            addMedicineRow();
            const row = document.getElementById(`medicine-row-${medicineCount}`);
            const inputs = row.querySelectorAll('input');
            inputs[0].value = medicine.name || '';
            inputs[1].value = medicine.dosage || '';
            inputs[2].value = medicine.duration || '';
            inputs[3].value = medicine.instructions || '';
          });
        }
        
        // Load lab tests
        if (draft.labTests && draft.labTests.length > 0) {
          labTests = draft.labTests;
          renderLabTests();
        }
        if (draft.labNotes) {
          document.getElementById('labNotes').value = draft.labNotes;
        }
        
        // Load follow-ups
        if (draft.followups && draft.followups.length > 0) {
          followups = draft.followups;
          renderFollowups();
        }
        
        showSaveNotification('Draft loaded successfully! Continue where you left off.');
      }
    } catch (e) {
      console.error('Error loading draft:', e);
    }
  }
}

// ===== LOAD PATIENT DATA =====
function loadPatientData() {
  // Load from URL params or localStorage if available
  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get('id') || localStorage.getItem('currentAppointmentId');
  
  // In a real app, you would fetch data based on appointmentId
  // For now, we'll use mock data
  
  // Update patient info
  document.getElementById('patientName').textContent = patientData.name;
  document.getElementById('opNumber').textContent = patientData.opNumber;
  document.getElementById('patientAge').textContent = patientData.age;
  document.getElementById('patientGender').textContent = patientData.gender;
  
  // Update basic information
  document.getElementById('fullName').textContent = patientData.name;
  document.getElementById('age').textContent = `${patientData.age} years`;
  document.getElementById('gender').textContent = patientData.gender;
  document.getElementById('bloodGroup').textContent = patientData.bloodGroup;
  document.getElementById('phone').textContent = patientData.phone;
  document.getElementById('email').textContent = patientData.email;
  
  // Update chief complaint
  document.getElementById('chiefComplaint').textContent = patientData.chiefComplaint;
}

// ===== SYMPTOMS MANAGEMENT =====
function addSymptom() {
  const input = document.getElementById('symptomInput');
  const symptom = input.value.trim();
  
  if (!symptom) {
    alert('Please enter a symptom');
    return;
  }
  
  if (symptoms.includes(symptom)) {
    alert('This symptom is already added');
    return;
  }
  
  symptoms.push(symptom);
  
  const container = document.getElementById('symptomsContainer');
  const tag = document.createElement('div');
  tag.className = 'symptom-tag';
  tag.innerHTML = `${symptom} <button onclick="removeSymptom(this)">×</button>`;
  container.appendChild(tag);
  
  input.value = '';
}

function removeSymptom(button) {
  const tag = button.parentElement;
  const symptom = tag.textContent.replace('×', '').trim();
  symptoms = symptoms.filter(s => s !== symptom);
  tag.remove();
}

// ===== MEDICINE MANAGEMENT (NEW WORKFLOW) =====
function addMedicineRow() {
  medicineCount++;
  
  const container = document.getElementById('medicinesContainer');
  const row = document.createElement('div');
  row.className = 'medicine-row';
  row.id = `medicine-row-${medicineCount}`;
  
  row.innerHTML = `
    <div class="form-group">
      <label>Medicine Name *</label>
      <input type="text" placeholder="e.g., Paracetamol" required />
    </div>
    
    <div class="form-group">
      <label>Dosage *</label>
      <input type="text" placeholder="e.g., 500mg" required />
    </div>
    
    <div class="form-group">
      <label>Duration *</label>
      <input type="text" placeholder="e.g., 7 days" required />
    </div>
    
    <div class="form-group">
      <label>Instructions</label>
      <input type="text" placeholder="e.g., After meals" />
    </div>
    
    <button class="btn-remove-medicine" onclick="removeMedicineRow(${medicineCount})">Remove</button>
  `;
  
  container.appendChild(row);
}

function removeMedicineRow(id) {
  const row = document.getElementById(`medicine-row-${id}`);
  if (row) {
    // Check if it's the last row
    const container = document.getElementById('medicinesContainer');
    if (container.children.length > 1) {
      row.remove();
    } else {
      alert('At least one medicine row must remain. Clear the fields if not needed.');
    }
  }
}

// ===== COLLECT PRESCRIPTION DATA =====
function collectPrescriptionData() {
  const primaryDiagnosis = document.getElementById('primaryDiagnosis').value.trim();
  const secondaryNotes = document.getElementById('secondaryNotes').value.trim();
  const additionalNotes = document.getElementById('additionalNotes').value.trim();
  
  if (!primaryDiagnosis) {
    alert('Please enter a primary diagnosis');
    return null;
  }
  
  // Collect medicines
  const medicines = [];
  const medicineRows = document.querySelectorAll('.medicine-row');
  
  medicineRows.forEach((row, index) => {
    const inputs = row.querySelectorAll('input');
    
    const medicine = {
      name: inputs[0].value.trim(),
      dosage: inputs[1].value.trim(),
      duration: inputs[2].value.trim(),
      instructions: inputs[3].value.trim()
    };
    
    if (medicine.name || medicine.dosage || medicine.duration) {
      if (!medicine.name || !medicine.dosage || !medicine.duration) {
        alert(`Please fill all required fields for Medicine ${index + 1}`);
        return null;
      }
      medicines.push(medicine);
    }
  });
  
  return {
    patientInfo: {
      opNumber: patientData.opNumber,
      name: patientData.name,
      age: patientData.age,
      gender: patientData.gender
    },
    symptoms: symptoms,
    primaryDiagnosis: primaryDiagnosis,
    secondaryNotes: secondaryNotes,
    medicines: medicines,
    additionalNotes: additionalNotes,
    labTests: labTests,
    labNotes: document.getElementById('labNotes').value.trim(),
    followups: followups,
    date: new Date().toISOString(),
    doctor: localStorage.getItem('doctorName') || 'Dr. Demo User'
  };
}

// ===== SAVE DRAFT =====
function saveDraft() {
  // Collect current form data (even if incomplete)
  const primaryDiagnosis = document.getElementById('primaryDiagnosis').value.trim();
  const secondaryNotes = document.getElementById('secondaryNotes').value.trim();
  const additionalNotes = document.getElementById('additionalNotes').value.trim();
  
  // Collect medicines (even if incomplete)
  const medicines = [];
  const medicineRows = document.querySelectorAll('.medicine-row');
  
  medicineRows.forEach((row) => {
    const inputs = row.querySelectorAll('input');
    const medicine = {
      name: inputs[0].value.trim(),
      dosage: inputs[1].value.trim(),
      duration: inputs[2].value.trim(),
      instructions: inputs[3].value.trim()
    };
    
    // Save even if partially filled
    if (medicine.name || medicine.dosage || medicine.duration) {
      medicines.push(medicine);
    }
  });
  
  const draftData = {
    patientInfo: {
      opNumber: patientData.opNumber,
      name: patientData.name,
      age: patientData.age,
      gender: patientData.gender
    },
    symptoms: symptoms,
    primaryDiagnosis: primaryDiagnosis,
    secondaryNotes: secondaryNotes,
    medicines: medicines,
    additionalNotes: additionalNotes,
    labTests: labTests,
    labNotes: document.getElementById('labNotes').value.trim(),
    followups: followups,
    savedAt: new Date().toISOString(),
    doctor: localStorage.getItem('doctorName') || 'Dr. Demo User'
  };
  
  // Save draft to localStorage
  const appointmentId = localStorage.getItem('currentAppointmentId');
  if (appointmentId) {
    localStorage.setItem(`draft_${appointmentId}`, JSON.stringify(draftData));
  } else {
    localStorage.setItem('consultationDraft', JSON.stringify(draftData));
  }
  
  // Change appointment status back to "pending" if it was "in-progress"
  if (appointmentId) {
    localStorage.setItem('draftAppointmentId', appointmentId);
  }
  
  // Show confirmation
  if (confirm('💾 Draft Saved Successfully!\n\nYour work has been saved and you can continue later.\n\nAppointment status will remain as "Pending".\n\nReturn to Dashboard?')) {
    // Clear current appointment
    localStorage.removeItem('currentAppointmentId');
    
    // Redirect to dashboard
    window.location.href = 'doctor_dashboard.html';
  } else {
    // Show notification but stay on page
    showSaveNotification('Draft saved! You can continue working or return to dashboard anytime.');
  }
}

// ===== SAVE PRESCRIPTION =====
function savePrescription() {
  const data = collectPrescriptionData();
  if (!data) return;
  
  console.log('Prescription Data:', data);
  
  // Save to localStorage (simulating database save)
  const appointmentId = localStorage.getItem('currentAppointmentId') || 'TEMP';
  const prescriptionKey = `prescription_${appointmentId}`;
  localStorage.setItem(prescriptionKey, JSON.stringify(data));
  
  // Also save to a list of all prescriptions
  let allPrescriptions = JSON.parse(localStorage.getItem('allPrescriptions') || '[]');
  const existingIndex = allPrescriptions.findIndex(p => p.appointmentId === appointmentId);
  
  if (existingIndex >= 0) {
    allPrescriptions[existingIndex] = { ...data, appointmentId, savedAt: new Date().toISOString() };
  } else {
    allPrescriptions.push({ ...data, appointmentId, savedAt: new Date().toISOString() });
  }
  
  localStorage.setItem('allPrescriptions', JSON.stringify(allPrescriptions));
  
  const prescriptionSummary = `
✅ Prescription Saved Successfully!

📋 Saved to: Browser Local Storage
🔑 Prescription ID: ${prescriptionKey}

Patient: ${data.patientInfo.name}
OP Number: ${data.patientInfo.opNumber}

Primary Diagnosis: ${data.primaryDiagnosis}
${data.secondaryNotes ? 'Secondary Notes: ' + data.secondaryNotes : ''}

Medicines Prescribed: ${data.medicines.length}
${data.medicines.map((m, i) => `${i + 1}. ${m.name} ${m.dosage} - ${m.duration}`).join('\n')}

Lab Tests Ordered: ${data.labTests.length}
Follow-ups Scheduled: ${data.followups.length}

${data.additionalNotes ? 'Additional Instructions: ' + data.additionalNotes : ''}

Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Doctor: ${data.doctor}

ℹ️ Note: Appointment status remains unchanged.
Use "Mark Appointment Completed" to finish the consultation.
  `;
  
  alert(prescriptionSummary);
  
  // Clear draft
  localStorage.removeItem('consultationDraft');
  
  // Show success notification
  showSaveNotification('Prescription saved successfully! You can continue editing or mark as completed.');
}

// ===== SHOW SAVE NOTIFICATION =====
function showSaveNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'save-notification';
  notification.innerHTML = `
    <div class="notification-icon">✅</div>
    <div class="notification-text">${message}</div>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 4000);
}

// ===== PRINT AND COMPLETE =====
function printAndComplete() {
  const data = collectPrescriptionData();
  if (!data) return;
  
  // Show confirmation
  if (confirm('🖨️ Print Prescription & Complete Appointment?\n\nThis will:\n• Generate a printable prescription\n• Save the prescription\n• Mark appointment as "Completed"\n• Close this consultation\n\nContinue?')) {
    
    console.log('Print and Complete:', data);
    
    // Save prescription to localStorage
    const appointmentId = localStorage.getItem('currentAppointmentId') || 'TEMP';
    const prescriptionKey = `prescription_${appointmentId}`;
    localStorage.setItem(prescriptionKey, JSON.stringify(data));
    
    // Save to all prescriptions list
    let allPrescriptions = JSON.parse(localStorage.getItem('allPrescriptions') || '[]');
    const existingIndex = allPrescriptions.findIndex(p => p.appointmentId === appointmentId);
    
    if (existingIndex >= 0) {
      allPrescriptions[existingIndex] = { ...data, appointmentId, savedAt: new Date().toISOString() };
    } else {
      allPrescriptions.push({ ...data, appointmentId, savedAt: new Date().toISOString() });
    }
    
    localStorage.setItem('allPrescriptions', JSON.stringify(allPrescriptions));
    
    // Store completed appointment ID
    if (appointmentId) {
      localStorage.setItem('completedAppointmentId', appointmentId);
    }
    
    // Clear draft and session
    localStorage.removeItem('consultationDraft');
    localStorage.removeItem('currentAppointmentId');
    
    // Generate print window
    generatePrintPrescription(data);
    
    // Show success message
    alert('✅ Prescription Saved & Appointment Completed!\n\nPrint dialog will open.\nYou will be redirected to appointments after printing.');
    
    // Redirect after a delay (to allow print dialog)
    setTimeout(() => {
      window.location.href = 'doctor_appointments.html';
    }, 2000);
  }
}

// ===== GENERATE PRINT PRESCRIPTION =====
function generatePrintPrescription(prescriptionData) {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  const prescriptionHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Prescription - ${prescriptionData.patientInfo.opNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 15mm;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          padding: 30px;
          background: white;
          color: #000;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .prescription-header {
          text-align: center;
          border-bottom: 3px solid #1e4fa1;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        
        .prescription-header h1 {
          font-size: 26px;
          color: #1e4fa1;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .prescription-header p {
          font-size: 13px;
          color: #666;
        }
        
        .prescription-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .info-item {
          display: flex;
          gap: 8px;
        }
        
        .info-item label {
          font-size: 12px;
          font-weight: bold;
          color: #555;
          min-width: 80px;
        }
        
        .info-item .value {
          font-size: 12px;
          font-weight: 600;
          color: #000;
        }
        
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 15px;
          font-weight: bold;
          color: #1e4fa1;
          margin-bottom: 10px;
          padding-bottom: 4px;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .diagnosis-box {
          padding: 10px;
          background: #e3f2fd;
          border-left: 4px solid #1e4fa1;
          border-radius: 4px;
          font-size: 13px;
        }
        
        .symptoms-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .symptom-tag {
          padding: 5px 10px;
          background: #f0f0f0;
          border-radius: 12px;
          font-size: 12px;
          border: 1px solid #ddd;
        }
        
        .medicine-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        
        .medicine-table th {
          background: #1e4fa1;
          color: white;
          padding: 8px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
        }
        
        .medicine-table td {
          padding: 8px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 12px;
          vertical-align: top;
        }
        
        .medicine-table tr:last-child td {
          border-bottom: 2px solid #1e4fa1;
        }
        
        .medicine-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .lab-tests-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .lab-test-badge {
          padding: 6px 12px;
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .notes-box {
          padding: 10px;
          background: #fff9e6;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .prescription-footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        
        .print-date {
          font-size: 11px;
          color: #666;
        }
        
        .doctor-signature {
          text-align: center;
        }
        
        .signature-line {
          width: 180px;
          border-top: 2px solid #000;
          margin-top: 35px;
          padding-top: 5px;
          font-size: 11px;
          font-weight: bold;
          text-align: center;
        }
        
        @media print {
          body {
            padding: 15px;
          }
        }
      </style>
    </head>
    <body>
      <!-- HEADER -->
      <div class="prescription-header">
        <h1>ITiVAT MED - Medical Prescription</h1>
        <p>Hospital Management System</p>
      </div>
      
      <!-- PRESCRIPTION INFO -->
      <div class="prescription-info">
        <div class="info-item">
          <label>Patient:</label>
          <div class="value">${prescriptionData.patientInfo.name}</div>
        </div>
        <div class="info-item">
          <label>OP Number:</label>
          <div class="value">${prescriptionData.patientInfo.opNumber}</div>
        </div>
        <div class="info-item">
          <label>Age:</label>
          <div class="value">${prescriptionData.patientInfo.age} years</div>
        </div>
        <div class="info-item">
          <label>Gender:</label>
          <div class="value">${prescriptionData.patientInfo.gender}</div>
        </div>
        <div class="info-item">
          <label>Doctor:</label>
          <div class="value">${prescriptionData.doctor}</div>
        </div>
        <div class="info-item">
          <label>Date:</label>
          <div class="value">${new Date().toLocaleDateString()}</div>
        </div>
      </div>
      
      <!-- DIAGNOSIS -->
      <div class="section">
        <div class="section-title">Diagnosis</div>
        <div class="diagnosis-box">${prescriptionData.primaryDiagnosis || 'Not specified'}</div>
        ${prescriptionData.secondaryNotes ? `<div style="margin-top: 8px; font-size: 12px; color: #666;">${prescriptionData.secondaryNotes}</div>` : ''}
      </div>
      
      <!-- SYMPTOMS -->
      ${prescriptionData.symptoms && prescriptionData.symptoms.length > 0 ? `
        <div class="section">
          <div class="section-title">Symptoms</div>
          <div class="symptoms-list">
            ${prescriptionData.symptoms.map(symptom => `<div class="symptom-tag">${symptom}</div>`).join('')}
          </div>
        </div>
      ` : ''}
      
      <!-- MEDICINES -->
      ${prescriptionData.medicines && prescriptionData.medicines.length > 0 ? `
        <div class="section">
          <div class="section-title">Prescribed Medicines</div>
          <table class="medicine-table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 30%;">Medicine Name</th>
                <th style="width: 15%;">Dosage</th>
                <th style="width: 15%;">Duration</th>
                <th style="width: 35%;">Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${prescriptionData.medicines.map((medicine, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td><strong>${medicine.name}</strong></td>
                  <td>${medicine.dosage}</td>
                  <td>${medicine.duration}</td>
                  <td>${medicine.instructions || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      ${prescriptionData.labTests && prescriptionData.labTests.length > 0 ? `
        <div class="section">
          <div class="section-title">Lab Tests Ordered</div>
          <div class="lab-tests-list">
            ${prescriptionData.labTests.map(test => `<div class="lab-test-badge">${test.name || test}</div>`).join('')}
          </div>
          ${prescriptionData.labNotes ? `<div style="margin-top: 8px; font-size: 12px; color: #666;">${prescriptionData.labNotes}</div>` : ''}
        </div>
      ` : ''}
      
      ${prescriptionData.followups && prescriptionData.followups.length > 0 ? `
        <div class="section">
          <div class="section-title">Follow-up Scheduled</div>
          ${prescriptionData.followups.map(followup => `
            <div class="info-item">
              <label>Next Visit:</label>
              <div class="value">${followup.date} at ${followup.time}</div>
            </div>
            ${followup.remarks ? `<div style="margin-top: 4px; font-size: 12px; color: #666;">${followup.remarks}</div>` : ''}
          `).join('')}
        </div>
      ` : ''}
      
      ${prescriptionData.additionalNotes ? `
        <div class="section">
          <div class="section-title">Additional Notes</div>
          <div class="notes-box">${prescriptionData.additionalNotes}</div>
        </div>
      ` : ''}
      
      <!-- FOOTER -->
      <div class="prescription-footer">
        <div class="print-date">
          <p><strong>Printed:</strong> ${new Date().toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        <div class="doctor-signature">
          <div class="signature-line">Doctor's Signature</div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(prescriptionHTML);
  printWindow.document.close();
  
  printWindow.onload = function() {
    printWindow.focus();
    printWindow.print();
    setTimeout(() => {
      printWindow.close();
    }, 100);
  };
}

// ===== MARK APPOINTMENT COMPLETED =====
function markCompleted() {
  const data = collectPrescriptionData();
  if (!data) return;
  
  // Show confirmation modal
  if (confirm('⚠️ Mark Appointment as Completed?\n\nThis will:\n• Save the prescription\n• Update appointment status to "Completed"\n• Close this consultation\n• Return to appointments list\n\nAre you sure you want to continue?')) {
    
    console.log('Appointment Completed:', data);
    
    // Save prescription
    localStorage.setItem('lastPrescription', JSON.stringify(data));
    
    // Store completed appointment ID
    const appointmentId = localStorage.getItem('currentAppointmentId');
    if (appointmentId) {
      localStorage.setItem('completedAppointmentId', appointmentId);
    }
    
    // Clear draft
    localStorage.removeItem('consultationDraft');
    localStorage.removeItem('currentAppointmentId');
    
    // Show success message
    alert('✅ Appointment Completed Successfully!\n\nPrescription has been saved.\nAppointment status updated to "Completed".\nPatient has been notified.');
    
    // Redirect back to appointments
    setTimeout(() => {
      window.location.href = 'doctor_appointments.html';
    }, 500);
  }
}

// ===== COMPLETE CONSULTATION (LEGACY - redirects to markCompleted) =====
function completeConsultation() {
  markCompleted();
}

// ===== LOGOUT =====
function logout() {
  if (confirm('Are you sure you want to logout?\n\nAny unsaved changes will be lost.')) {
    localStorage.removeItem('consultationDraft');
    location.href = 'doctor_portal.html';
  }
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + S to save draft
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveDraft();
  }
  
  // Ctrl/Cmd + Enter to save prescription
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    savePrescription();
  }
});


// ===== LAB ORDERS MANAGEMENT =====
function addLabTest() {
  const select = document.getElementById('labTestSelect');
  const testValue = select.value;
  const testName = select.options[select.selectedIndex].text;
  
  if (!testValue) {
    alert('Please select a lab test');
    return;
  }
  
  if (labTests.some(test => test.value === testValue)) {
    alert('This test is already added');
    return;
  }
  
  labTests.push({ value: testValue, name: testName });
  renderLabTests();
  
  // Reset select
  select.value = '';
}

function renderLabTests() {
  const container = document.getElementById('labTestsList');
  
  if (labTests.length === 0) {
    container.innerHTML = '<div class="empty-lab-message">No lab tests ordered yet</div>';
    return;
  }
  
  container.innerHTML = '';
  
  labTests.forEach((test, index) => {
    const item = document.createElement('div');
    item.className = 'lab-test-item';
    item.innerHTML = `
      <span class="lab-test-name">${test.name}</span>
      <button class="lab-test-remove" onclick="removeLabTest(${index})">×</button>
    `;
    container.appendChild(item);
  });
}

function removeLabTest(index) {
  labTests.splice(index, 1);
  renderLabTests();
}

// ===== FOLLOW-UP SCHEDULING =====
function setMinFollowupDate() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateInput = document.getElementById('followupDate');
  dateInput.min = tomorrow.toISOString().split('T')[0];
}

function scheduleFollowup() {
  const dateInput = document.getElementById('followupDate');
  const timeInput = document.getElementById('followupTime');
  const remarksInput = document.getElementById('followupRemarks');
  
  const date = dateInput.value;
  const time = timeInput.value;
  const remarks = remarksInput.value.trim();
  
  if (!date) {
    alert('Please select a follow-up date');
    return;
  }
  
  const followup = {
    date: date,
    time: time,
    remarks: remarks,
    dateTime: new Date(`${date}T${time}`)
  };
  
  followups.push(followup);
  renderFollowups();
  
  // Clear form
  dateInput.value = '';
  timeInput.value = '09:00';
  remarksInput.value = '';
  
  alert('✓ Follow-up scheduled successfully!');
}

function renderFollowups() {
  const container = document.getElementById('scheduledFollowups');
  
  if (followups.length === 0) {
    container.innerHTML = '<div class="no-followup-message">No follow-ups scheduled</div>';
    return;
  }
  
  container.innerHTML = '<h4 style="margin-bottom: 12px; color: #6b21a8;">Scheduled Follow-ups</h4>';
  
  followups.forEach((followup, index) => {
    const item = document.createElement('div');
    item.className = 'followup-item';
    
    const formattedDate = new Date(followup.dateTime).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    item.innerHTML = `
      <div class="followup-header">
        <span class="followup-date">📅 ${formattedDate} at ${followup.time}</span>
        <button class="followup-remove" onclick="removeFollowup(${index})">Remove</button>
      </div>
      ${followup.remarks ? `<div class="followup-remarks">${followup.remarks}</div>` : ''}
    `;
    container.appendChild(item);
  });
}

function removeFollowup(index) {
  if (confirm('Remove this follow-up appointment?')) {
    followups.splice(index, 1);
    renderFollowups();
  }
}

// ===== UPDATE COLLECT PRESCRIPTION DATA =====


// ===== MOCK PRESCRIPTION DATA =====
const mockPrescriptions = {
  'PRESC001': {
    id: 'PRESC001',
    date: '15 Jan 2026',
    time: '10:30 AM',
    doctor: 'Dr. Sharma',
    patientName: 'Rajesh Kumar',
    opNumber: 'OP12345',
    diagnosis: 'Hypertension with mild chest discomfort',
    symptoms: ['Chest Pain', 'Elevated Blood Pressure', 'Mild Headache'],
    medicines: [
      {
        name: 'Amlodipine',
        dosage: '5mg',
        duration: '30 days',
        instructions: 'Once daily after breakfast'
      },
      {
        name: 'Aspirin',
        dosage: '75mg',
        duration: '30 days',
        instructions: 'Once daily after dinner'
      }
    ],
    labTests: ['ECG', 'Lipid Profile'],
    followup: '15 Feb 2026',
    notes: 'Patient advised to monitor blood pressure daily. Reduce salt intake. Light exercise recommended.'
  },
  'PRESC002': {
    id: 'PRESC002',
    date: '10 Dec 2025',
    time: '11:00 AM',
    doctor: 'Dr. Patel',
    patientName: 'Rajesh Kumar',
    opNumber: 'OP12345',
    diagnosis: 'Regular health checkup - All parameters normal',
    symptoms: ['None'],
    medicines: [
      {
        name: 'Multivitamin',
        dosage: '1 tablet',
        duration: '60 days',
        instructions: 'Once daily after breakfast'
      }
    ],
    labTests: ['Complete Blood Count', 'Blood Sugar'],
    followup: '10 Mar 2026',
    notes: 'Continue healthy lifestyle. Regular exercise and balanced diet recommended.'
  }
};

// ===== VIEW PRESCRIPTION DETAILS =====
function viewPrescriptionDetails(prescriptionId) {
  const prescription = mockPrescriptions[prescriptionId];
  
  if (!prescription) {
    alert('Prescription details not found.');
    return;
  }
  
  const modalBody = document.getElementById('prescriptionModalBody');
  
  modalBody.innerHTML = `
    <!-- PRESCRIPTION INFO -->
    <div class="prescription-detail-section">
      <h4>📋 Prescription Information</h4>
      <div class="prescription-info-grid">
        <div class="prescription-info-item">
          <label>Prescription ID</label>
          <div class="value">${prescription.id}</div>
        </div>
        <div class="prescription-info-item">
          <label>Date & Time</label>
          <div class="value">${prescription.date} at ${prescription.time}</div>
        </div>
        <div class="prescription-info-item">
          <label>Doctor</label>
          <div class="value">${prescription.doctor}</div>
        </div>
        <div class="prescription-info-item">
          <label>Patient</label>
          <div class="value">${prescription.patientName}</div>
        </div>
      </div>
    </div>
    
    <!-- DIAGNOSIS -->
    <div class="prescription-detail-section">
      <h4>🩺 Diagnosis</h4>
      <div class="prescription-diagnosis">
        ${prescription.diagnosis}
      </div>
    </div>
    
    <!-- SYMPTOMS -->
    <div class="prescription-detail-section">
      <h4>🔍 Symptoms</h4>
      <div class="symptoms-container">
        ${prescription.symptoms.map(symptom => `
          <div class="symptom-tag" style="cursor: default;">
            ${symptom}
          </div>
        `).join('')}
      </div>
    </div>
    
    <!-- MEDICINES -->
    <div class="prescription-detail-section">
      <h4>💊 Prescribed Medicines</h4>
      <div class="prescription-medicine-list">
        ${prescription.medicines.map((medicine, index) => `
          <div class="prescription-medicine-item">
            <div class="medicine-name">${index + 1}. ${medicine.name}</div>
            <div class="medicine-details">
              <div class="medicine-detail-item">
                <strong>Dosage:</strong> ${medicine.dosage}
              </div>
              <div class="medicine-detail-item">
                <strong>Duration:</strong> ${medicine.duration}
              </div>
              <div class="medicine-detail-item">
                <strong>Instructions:</strong> ${medicine.instructions}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <!-- LAB TESTS -->
    ${prescription.labTests && prescription.labTests.length > 0 ? `
      <div class="prescription-detail-section">
        <h4>🧪 Lab Tests Ordered</h4>
        <div class="lab-tests-list">
          ${prescription.labTests.map(test => `
            <div class="lab-test-item">
              <span class="lab-test-name">${test}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    <!-- FOLLOW-UP -->
    ${prescription.followup ? `
      <div class="prescription-detail-section">
        <h4>📅 Follow-up Scheduled</h4>
        <div class="prescription-info-item">
          <div class="value">${prescription.followup}</div>
        </div>
      </div>
    ` : ''}
    
    <!-- NOTES -->
    ${prescription.notes ? `
      <div class="prescription-detail-section">
        <h4>📝 Additional Notes</h4>
        <div class="prescription-notes">
          ${prescription.notes}
        </div>
      </div>
    ` : ''}
  `;
  
  // Show modal
  document.getElementById('prescriptionModal').classList.add('active');
}

// ===== CLOSE PRESCRIPTION MODAL =====
function closePrescriptionModal() {
  document.getElementById('prescriptionModal').classList.remove('active');
}

// ===== PRINT PRESCRIPTION =====
function printPrescription() {
  // Get current prescription ID from modal
  const modalBody = document.getElementById('prescriptionModalBody');
  const prescIdElement = modalBody.querySelector('.prescription-info-item .value');
  const prescId = prescIdElement ? prescIdElement.textContent : 'PRESC001';
  
  // Get prescription data
  const prescription = mockPrescriptions[prescId] || mockPrescriptions['PRESC001'];
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  // Generate clean prescription HTML
  const prescriptionHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Prescription - ${prescription.id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 15mm;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          padding: 30px;
          background: white;
          color: #000;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .prescription-header {
          text-align: center;
          border-bottom: 3px solid #1e4fa1;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        
        .prescription-header h1 {
          font-size: 26px;
          color: #1e4fa1;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .prescription-header p {
          font-size: 13px;
          color: #666;
        }
        
        .prescription-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .info-item {
          display: flex;
          gap: 8px;
        }
        
        .info-item label {
          font-size: 12px;
          font-weight: bold;
          color: #555;
          min-width: 80px;
        }
        
        .info-item .value {
          font-size: 12px;
          font-weight: 600;
          color: #000;
        }
        
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 15px;
          font-weight: bold;
          color: #1e4fa1;
          margin-bottom: 10px;
          padding-bottom: 4px;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .diagnosis-box {
          padding: 10px;
          background: #e3f2fd;
          border-left: 4px solid #1e4fa1;
          border-radius: 4px;
          font-size: 13px;
        }
        
        .symptoms-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .symptom-tag {
          padding: 5px 10px;
          background: #f0f0f0;
          border-radius: 12px;
          font-size: 12px;
          border: 1px solid #ddd;
        }
        
        .medicine-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        
        .medicine-table th {
          background: #1e4fa1;
          color: white;
          padding: 8px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
        }
        
        .medicine-table td {
          padding: 8px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 12px;
          vertical-align: top;
        }
        
        .medicine-table tr:last-child td {
          border-bottom: 2px solid #1e4fa1;
        }
        
        .medicine-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .lab-tests-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .lab-test-badge {
          padding: 6px 12px;
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .notes-box {
          padding: 10px;
          background: #fff9e6;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .prescription-footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        
        .print-date {
          font-size: 11px;
          color: #666;
        }
        
        .doctor-signature {
          text-align: center;
        }
        
        .signature-line {
          width: 180px;
          border-top: 2px solid #000;
          margin-top: 35px;
          padding-top: 5px;
          font-size: 11px;
          font-weight: bold;
          text-align: center;
        }
        
        @media print {
          body {
            padding: 15px;
          }
        }
      </style>
    </head>
    <body>
      <!-- HEADER -->
      <div class="prescription-header">
        <h1>ITiVAT MED - Medical Prescription</h1>
        <p>Hospital Management System</p>
      </div>
      
      <!-- PRESCRIPTION INFO -->
      <div class="prescription-info">
        <div class="info-item">
          <label>Prescription ID:</label>
          <div class="value">${prescription.id}</div>
        </div>
        <div class="info-item">
          <label>Date:</label>
          <div class="value">${prescription.date}</div>
        </div>
        <div class="info-item">
          <label>Patient:</label>
          <div class="value">${prescription.patientName}</div>
        </div>
        <div class="info-item">
          <label>OP Number:</label>
          <div class="value">${prescription.opNumber}</div>
        </div>
        <div class="info-item">
          <label>Doctor:</label>
          <div class="value">${prescription.doctor}</div>
        </div>
        <div class="info-item">
          <label>Time:</label>
          <div class="value">${prescription.time}</div>
        </div>
      </div>
      
      <!-- DIAGNOSIS -->
      <div class="section">
        <div class="section-title">Diagnosis</div>
        <div class="diagnosis-box">${prescription.diagnosis}</div>
      </div>
      
      <!-- SYMPTOMS -->
      <div class="section">
        <div class="section-title">Symptoms</div>
        <div class="symptoms-list">
          ${prescription.symptoms.map(symptom => `<div class="symptom-tag">${symptom}</div>`).join('')}
        </div>
      </div>
      
      <!-- MEDICINES -->
      <div class="section">
        <div class="section-title">Prescribed Medicines</div>
        <table class="medicine-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 30%;">Medicine Name</th>
              <th style="width: 15%;">Dosage</th>
              <th style="width: 15%;">Duration</th>
              <th style="width: 35%;">Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${prescription.medicines.map((medicine, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><strong>${medicine.name}</strong></td>
                <td>${medicine.dosage}</td>
                <td>${medicine.duration}</td>
                <td>${medicine.instructions}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      ${prescription.labTests && prescription.labTests.length > 0 ? `
        <!-- LAB TESTS -->
        <div class="section">
          <div class="section-title">Lab Tests Ordered</div>
          <div class="lab-tests-list">
            ${prescription.labTests.map(test => `<div class="lab-test-badge">${test}</div>`).join('')}
          </div>
        </div>
      ` : ''}
      
      ${prescription.followup ? `
        <!-- FOLLOW-UP -->
        <div class="section">
          <div class="section-title">Follow-up Scheduled</div>
          <div class="info-item">
            <label>Next Visit:</label>
            <div class="value">${prescription.followup}</div>
          </div>
        </div>
      ` : ''}
      
      ${prescription.notes ? `
        <!-- NOTES -->
        <div class="section">
          <div class="section-title">Additional Notes</div>
          <div class="notes-box">${prescription.notes}</div>
        </div>
      ` : ''}
      
      <!-- FOOTER -->
      <div class="prescription-footer">
        <div class="print-date">
          <p><strong>Printed:</strong> ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        <div class="doctor-signature">
          <div class="signature-line">Doctor's Signature</div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Write content and print
  printWindow.document.write(prescriptionHTML);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = function() {
    printWindow.focus();
    printWindow.print();
    // Close the print window after printing
    setTimeout(() => {
      printWindow.close();
    }, 100);
  };
}

// ===== CLOSE MODAL ON OUTSIDE CLICK =====
window.addEventListener('click', function(event) {
  const modal = document.getElementById('prescriptionModal');
  if (event.target === modal) {
    closePrescriptionModal();
  }
});
