let currentPage = 1;
const rowsPerPage = 10;

// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHk_3j17dq7uG-UC9fr3lIES_bcnqKjFc",
  authDomain: "itivat-med-hms.firebaseapp.com",
  projectId: "itivat-med-hms",
  storageBucket: "itivat-med-hms.firebasestorage.app",
  messagingSenderId: "690474532008",
  appId: "1:690474532008:web:4c8c4ceca7a2042cca569d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= STATE =================
let appointments = [];
let labs = [];
let activeData = [];
let activeTab = "appointments";

const appointmentsTableBody = document.getElementById("appointmentsTableBody");
const labsTableBody = document.getElementById("labsTableBody");

const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

function safe(v) {
  return v ? v.toString().toLowerCase() : "";
}

// ================= LOAD APPOINTMENTS =================
async function loadAppointments() {
  appointments = [];

  const q = query(collection(db, "appointments"), orderBy("createdAt", "asc"));

  const snap = await getDocs(q);
  snap.forEach((d) => {
    const a = d.data();
    a.id = d.id;
    appointments.push(a);
  });

  if (activeTab === "appointments") {
    activeData = appointments;
    renderAppointments();
  }
}

// ================= LOAD LABS =================
async function loadLabs() {
  labs = [];

  const q = query(collection(db, "lab_registers"), orderBy("createdAt", "asc"));

  const snap = await getDocs(q);
  snap.forEach((d) => {
    const l = d.data();
    l.id = d.id;
    labs.push(l);
  });

  if (activeTab === "labs") {
    activeData = labs;
    renderLabs();
  }
}

loadAppointments();
loadLabs();

// ================= RENDER APPOINTMENTS =================
function renderAppointments() {
  appointmentsTableBody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const pageData = activeData.slice(start, start + rowsPerPage);

  pageData.forEach((a, i) => {
    const globalIndex = start + i;
    const isPaid = a.payment === "Paid";

    appointmentsTableBody.innerHTML += `
      <tr>
      <td>${globalIndex + 1}</td>
        <td>${a.opNo || "-"}</td>
        <td>${a.name}</td>
        <td>${a.phone}</td>
        <td>${a.doctor}</td>
        <td>${a.refDoctor || "-"}</td>
        <td>${a.date}</td>
        <td>${a.time}</td>
        <td>₹${a.amount ?? a.billing?.finalAmount ?? "-"}</td>
        <td>${a.payment || "Pending"}</td>
        <td>
          <button onclick="viewAppointment(${globalIndex})">View</button>
          <button onclick="markPaid(${globalIndex})" ${isPaid ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ""}>Paid</button>
          <button onclick="printAppointmentBill(${globalIndex}, 'DIA')" style="background:#0ea5e9; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Diab</button>
          <button onclick="printAppointmentBill(${globalIndex}, 'NEURO')" style="background:#7c3aed; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Jagsan</button>
        </td>
      </tr>
    `;
  });

  renderPagination(activeData.length);
}

// ================= RENDER LABS =================
function renderLabs() {
  labsTableBody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const pageData = activeData.slice(start, start + rowsPerPage);

  pageData.forEach((l, i) => {
    const globalIndex = start + i;
    const isPaid = l.payment === "Paid";

    // Format tests list
    let testsDisplay = "-";
    if (l.tests && Array.isArray(l.tests)) {
      testsDisplay = l.tests.map((t) => t.name).join(", ");
      if (testsDisplay.length > 50) {
        testsDisplay = testsDisplay.substring(0, 50) + "...";
      }
    }

    labsTableBody.innerHTML += `
      <tr>
        <td>${globalIndex + 1}</td>
        <td>${l.labRegId || l.opNo || "-"}</td>
        <td>${l.name}</td>
        <td>${l.phone}</td>
        <td>${l.doctor}</td>
        <td>${l.date}</td>
        <td>${l.amount}</td>
        <td>${l.payment || "Pending"}</td>
        <td>
          <button onclick="viewLab(${globalIndex})">View</button>
          <button onclick="markLabPaid(${globalIndex})" ${isPaid ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ""}>Paid</button>
          <button onclick="printLabBill(${globalIndex}, 'DIA')" style="background:#0ea5e9; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Diab</button>
          <button onclick="printLabBill(${globalIndex}, 'NEURO')" style="background:#7c3aed; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Jagsan</button>
        </td>
      </tr>
    `;
  });

  renderPagination(activeData.length);
}

// ================= PAGINATION =================
function renderPagination(total) {
  const pages = Math.ceil(total / rowsPerPage) || 1;
  document.getElementById("pagination").innerHTML = `
    <button ${currentPage === 1 ? "disabled" : ""} onclick="prevPage()">Prev</button>
    <span> Page ${currentPage} of ${pages} </span>
    <button ${currentPage === pages ? "disabled" : ""} onclick="nextPage()">Next</button>
  `;
}

window.nextPage = () => {
  currentPage++;
  activeTab === "appointments" ? renderAppointments() : renderLabs();
};

window.prevPage = () => {
  currentPage--;
  activeTab === "appointments" ? renderAppointments() : renderLabs();
};

// ================= SEARCH =================
document.getElementById("searchInput").addEventListener("input", (e) => {
  const k = e.target.value.toLowerCase();
  currentPage = 1;

  const source = activeTab === "appointments" ? appointments : labs;
  activeData = source.filter(
    (x) =>
      safe(x.name).includes(k) ||
      safe(x.phone).includes(k) ||
      safe(x.opNo).includes(k),
  );

  activeTab === "appointments" ? renderAppointments() : renderLabs();
});

// ================= TABS =================
window.showAppointments = function () {
  activeTab = "appointments";
  activeData = appointments;
  currentPage = 1;

  document.getElementById("appointmentsSection").style.display = "block";
  document.getElementById("labsSection").style.display = "none";

  document.getElementById("tabAppointments").classList.add("active");
  document.getElementById("tabLabs").classList.remove("active");

  renderAppointments();
};

window.showLabs = function () {
  activeTab = "labs";
  activeData = labs;
  currentPage = 1;

  document.getElementById("appointmentsSection").style.display = "none";
  document.getElementById("labsSection").style.display = "block";

  document.getElementById("tabLabs").classList.add("active");
  document.getElementById("tabAppointments").classList.remove("active");

  renderLabs();
};

window.viewAppointment = function (index) {
  const a = activeData[index];

  modalContent.innerHTML = `
    <h2>Appointment Details</h2>

    <p><strong>OP No:</strong> ${a.opNo}</p>
    <p><strong>Name:</strong> ${a.name}</p>
    <p><strong>Phone:</strong> ${a.phone}</p>
    <p><strong>Doctor:</strong> ${a.doctor}</p>
    <p><strong>Date:</strong> ${a.date} ${a.time}</p>

    <button class="btn primary" onclick="toggleMore()">View More</button>

    <div id="moreDetails" style="display:none;margin-top:10px;">
      <p><strong>Age:</strong> ${a.age || "-"}</p>
      <p><strong>BP:</strong> ${a.bp || "-"}</p>
      <p><strong>Sugar:</strong> ${a.sugar || "-"}</p>
      <p><strong>History:</strong> ${a.history || "-"}</p>
    </div>
  `;
  modal.style.display = "flex";
};

window.toggleMore = () => {
  const el = document.getElementById("moreDetails");
  el.style.display = el.style.display === "none" ? "block" : "none";
};

// ================= MARK AS PAID =================
window.markPaid = async function (index) {
  const item = activeData[index];

  // Check if already paid
  if (item.payment === "Paid") {
    alert("Payment is already marked as Paid");
    return;
  }

  const collectionName =
    activeTab === "appointments" ? "appointments" : "lab_registers";

  try {
    // Update in Firebase
    await updateDoc(doc(db, collectionName, item.id), {
      payment: "Paid",
    });

    // Update in activeData
    item.payment = "Paid";

    // Update the source array too
    if (activeTab === "appointments") {
      const sourceIndex = appointments.findIndex((a) => a.id === item.id);
      if (sourceIndex !== -1) {
        appointments[sourceIndex].payment = "Paid";
      }
      renderAppointments();
    } else {
      const sourceIndex = labs.findIndex((l) => l.id === item.id);
      if (sourceIndex !== -1) {
        labs[sourceIndex].payment = "Paid";
      }
      renderLabs();
    }

    alert("Payment status updated to Paid successfully!");
  } catch (err) {
    console.error("Error updating payment:", err);
    alert("Failed to update payment status: " + err.message);
  }
};

// ================= PRINT APPOINTMENT BILL =================
window.printAppointmentBill = function (index, clinicType) {
  const a = activeData[index];
  if (!a) return;

  // Clinic configurations
  const CLINIC_CONFIG = {
    DIA: {
      logo: "diablogo.png",
      name: "DIAB NEURO CARE CENTER",
      addr1: " H.No B, 13/F4, near Vidyanagar Bus Stop",
      addr2:
        "Housing Board Colony, Vidya Nagar, Adikmet, Hyderabad, Telangana 500044",
      contact: "Cell: 7382636888, 8341689666",
    },
    NEURO: {
      logo: "jagsanlogo.png",
      name: "JAGSAN NEURO CARE CENTER",
      addr1: "1-1-774/A 1st Floor Tamasi Avenue, Street No.10",
      addr2: "Gandhi Nagar, Kavasi Guda, Hyderabad,Telangana 500080",
      contact: "Cell: 7382636888, 8341689666",
    },
  };

  const cfg = CLINIC_CONFIG[clinicType] || CLINIC_CONFIG.DIA;

  const printWindow = window.open("", "", "height=600,width=800");

  if (!printWindow) {
    alert("Please allow pop-ups to print the bill");
    return;
  }

  // Get billing info
  const billing = a.billing || {};
  const billNumber = billing.billNumber || "N/A";
  const opAmount = billing.opAmount || a.amount || "0";
  const discountPercent = billing.discountPercent || 0;
  const discountAmount = billing.discountAmount || 0;
  const finalAmount = billing.finalAmount || a.amount || "0";
  const paymentType = billing.paymentType || "Cash";

  const patientId = "WIN" + Math.floor(Math.random() * 10000);

  // Build discount row if applicable
  let discountRow = "";
  if (parseFloat(discountPercent) > 0) {
    discountRow = `
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 6px; text-align: right; color: #ef4444;"><strong>Discount (${discountPercent}%)</strong></td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; color: #ef4444;"><strong>- ₹${discountAmount}</strong></td>
      </tr>
    `;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>OP Bill - ${a.opNo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; align-items: center; margin-bottom: 15px; position: relative; }
          .header img { width: 60px; height: 60px; position: absolute; left: 0; }
          .header-text { flex: 1; text-align: center; }
          .header-text h2 { font-size: 20px; font-weight: bold; margin: 5px 0; }
          .header-text p { font-size: 11px; margin: 3px 0; }
          .patient-info { border: 2px solid #000; padding: 8px; margin-bottom: 10px; }
          .info-row { display: flex; justify-content: space-between; }
          .info-col { flex: 1; }
          .info-col p { margin: 3px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; border: 2px solid #000; font-size: 12px; }
          th, td { border: 1px solid #000; padding: 6px; }
          th { background-color: #f0f0f0; text-align: left; }
          .footer { border: 2px solid #000; padding: 8px; margin: 8px 0; font-size: 12px; }
          .signature { display: flex; justify-content: space-between; border: 2px solid #000; padding: 8px; font-size: 12px; }
          .notes { padding: 8px; border: 1px solid #ccc; margin-top: 10px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${cfg.logo}" alt="Logo" onerror="this.style.display='none'" />
          <div class="header-text">
            <h2>${cfg.name}</h2>
            <p>${cfg.addr1}</p>
            <p>${cfg.addr2}</p>
            <p>${cfg.contact}</p>
            <h3 style="margin: 10px 0 5px 0; font-size: 14px;">OP Bill Receipt</h3>
          </div>
        </div>
        
        <div class="patient-info">
          <div class="info-row">
            <div class="info-col">
              <p><strong>Patient Name:</strong> ${a.name}</p>
              <p><strong>Mobile Number:</strong> ${a.phone}</p>
              <p><strong>Age / Sex:</strong> ${a.age || "-"} years / ${a.sex || "-"}</p>
              <p><strong>BP:</strong> ${a.bp || "-"}</p>
              <p><strong>Sugar:</strong> ${a.sugar || "-"}</p>
              <p><strong>Weight:</strong> ${a.weight || "-"} kg</p>
            </div>
            <div class="info-col" style="text-align: right;">
              <p><strong>Patient ID:</strong> ${patientId}</p>
              <p><strong>OP Number:</strong> ${a.opNo}</p>
              <p><strong>Bill Number:</strong> ${billNumber}</p>
              <p><strong>Date:</strong> ${a.date}</p>
              <p><strong>Time:</strong> ${a.time}</p>
              <p><strong>Doctor:</strong> ${a.doctor}</p>
              <p><strong>Referred By:</strong> ${a.refDoctor || "-"}</p>
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>OP Consultation</td>
              <td style="text-align: right;">₹${opAmount}</td>
            </tr>
            ${discountRow}
            <tr style="background: #dcfce7;">
              <td colspan="2" style="text-align: right;"><strong>Final Amount</strong></td>
              <td style="text-align: right;"><strong>₹${finalAmount}</strong></td>
            </tr>
            <tr>
              <td colspan="2" style="text-align: right;"><strong>Payment Mode</strong></td>
              <td style="text-align: right;"><strong>${paymentType}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p><strong>Received an Amount of:</strong> Rupees ${finalAmount} Only</p>
        </div>
        
        <div class="signature">
          <p><strong>Received with thanks</strong></p>
          <p><strong>Signature</strong></p>
        </div>
        
        <div class="notes">
          <p><strong>Medical History / Notes:</strong></p>
          <p>${a.history || "N/A"}</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

// ================= PRINT LAB BILL =================
window.printLabBill = function (index, clinicType) {
  const l = activeData[index];
  if (!l) return;

  // Clinic configurations
  const CLINIC_CONFIG = {
    DIA: {
      logo: "diablogo.png",
      name: "DIAB NEURO CARE CENTER",
      addr1: "1-1-774/A 1st Floor Tamasi Avenue, Street No.10",
      addr2: "Gandhi Nagar, Kavasi Guda, Hyderabad",
      contact: "Cell: 7382636888, 8341689666",
    },
    NEURO: {
      logo: "jagsan_neuro_logo.png",
      name: "JAGSAN NEURO CARE CENTER",
      addr1: "Plot No 22, 2nd Floor, Neuro Plaza",
      addr2: "RTC X Roads, Hyderabad",
      contact: "Cell: 9000000000",
    },
  };

  const cfg = CLINIC_CONFIG[clinicType] || CLINIC_CONFIG.DIA;

  const printWindow = window.open("", "", "height=600,width=800");

  // Format tests list
  let testsHTML = "";
  let testsTotal = 0;
  if (l.tests && Array.isArray(l.tests)) {
    testsHTML = l.tests
      .map((test, idx) => {
        testsTotal += test.price;
        return `
        <tr>
          <td style="border: 1px solid #000; padding: 6px;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 6px;">${test.name}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right;">₹${test.price}</td>
        </tr>
      `;
      })
      .join("");
  }

  // Add totals with discount
  let totalsHTML = `
    <tr>
      <td colspan="2" style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">Original Total:</td>
      <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">₹${l.originalAmount || l.amount}</td>
    </tr>
  `;

  if (l.discountPercent && l.discountPercent > 0) {
    totalsHTML += `
      <tr>
        <td colspan="2" style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold; color: #ef4444;">Discount (${l.discountPercent}%):</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold; color: #ef4444;">- ₹${l.discountAmount}</td>
      </tr>
      <tr style="background: #dcfce7;">
        <td colspan="2" style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">Final Amount:</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">₹${l.amount}</td>
      </tr>
    `;
  } else {
    totalsHTML += `
      <tr style="background: #dcfce7;">
        <td colspan="2" style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">Total Amount:</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">₹${l.amount}</td>
      </tr>
    `;
  }

  totalsHTML += `
    <tr>
      <td colspan="2" style="border: 1px solid #000; padding: 6px; text-align: right;"><strong>Balance Amount</strong></td>
      <td style="border: 1px solid #000; padding: 6px; text-align: right;"><strong>₹0</strong></td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid #000; padding: 6px; text-align: right;"><strong>Paid Amount</strong></td>
      <td style="border: 1px solid #000; padding: 6px; text-align: right;"><strong>₹${l.amount}</strong></td>
    </tr>
  `;

  const patientId = "WIN" + Math.floor(Math.random() * 10000);
  const billNumber = "LAB" + Math.floor(Math.random() * 100000);

  printWindow.document.write(`
    <html>
      <head>
        <title>Lab Receipt - ${l.opNo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1, h2 { text-align: center; margin: 5px 0; }
          .header { display: flex; align-items: center; margin-bottom: 15px; position: relative; }
          .header img { width: 60px; height: 60px; position: absolute; left: 0; }
          .header-text { flex: 1; text-align: center; }
          .header-text h2 { font-size: 20px; font-weight: bold; margin: 5px 0; }
          .header-text p { font-size: 11px; margin: 3px 0; }
          .patient-info { border: 2px solid #000; padding: 8px; margin-bottom: 10px; }
          .info-row { display: flex; justify-content: space-between; }
          .info-col { flex: 1; }
          .info-col p { margin: 3px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; border: 2px solid #000; font-size: 12px; }
          th, td { border: 1px solid #000; padding: 6px; }
          th { background-color: #f0f0f0; text-align: left; }
          .footer { border: 2px solid #000; padding: 8px; margin: 8px 0; font-size: 12px; }
          .signature { display: flex; justify-content: space-between; border: 2px solid #000; padding: 8px; font-size: 12px; }
          .notes { padding: 8px; border: 1px solid #ccc; margin-top: 10px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${cfg.logo}" alt="Logo" />
          <div class="header-text">
            <h2>${cfg.name}</h2>
            <p>${cfg.addr1}</p>
            <p>${cfg.addr2}</p>
            <p>${cfg.contact}</p>
            <h3 style="margin: 10px 0 5px 0; font-size: 14px;">Lab Bill Receipt</h3>
          </div>
        </div>
        
        <div class="patient-info">
          <div class="info-row">
            <div class="info-col">
              <p><strong>Patient Name:</strong> ${l.name}</p>
              <p><strong>Mobile Number:</strong> ${l.phone}</p>
              <p><strong>Age / Sex:</strong> ${l.age || "-"} years</p>
            </div>
            <div class="info-col" style="text-align: right;">
              <p><strong>Patient ID:</strong> ${patientId}</p>
              <p><strong>Bill Number:</strong> ${billNumber}</p>
              <p><strong>Bill Date:</strong> ${l.date}</p>
              <p><strong>Referred By:</strong> ${l.refDoctor || "-"}</p>
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Test Name/Profile Name</th>
              <th style="text-align: right;">Charges</th>
            </tr>
          </thead>
          <tbody>
            ${testsHTML}
            ${totalsHTML}
          </tbody>
        </table>
        
        <div class="footer">
          <p><strong>Received an Amount of:</strong> Rupees ${l.amount} Only</p>
        </div>
        
        <div class="signature">
          <p><strong>Received with thanks</strong></p>
          <p><strong>Signature</strong></p>
        </div>
        
        <div class="notes">
          <p><strong>Test Description:</strong></p>
          <p>${l.history || "N/A"}</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

// ================= VIEW LAB =================
window.viewLab = function (index) {
  const l = activeData[index];

  let testsHTML =
    '<p><strong>Tests:</strong></p><ul style="margin-top: 10px;">';
  if (l.tests && Array.isArray(l.tests)) {
    testsHTML += l.tests
      .map((test) => `<li>${test.name} - ₹${test.price}</li>`)
      .join("");
  } else {
    testsHTML += "<li>No tests recorded</li>";
  }
  testsHTML += "</ul>";

  // Show discount info if available
  let discountHTML = "";
  if (l.discountPercent && l.discountPercent > 0) {
    discountHTML = `
      <p><strong>Original Amount:</strong> ₹${l.originalAmount || l.amount}</p>
      <p><strong>Discount:</strong> ${l.discountPercent}% (₹${l.discountAmount || "0"})</p>
      <p style="color: #16a34a; font-weight: 600;"><strong>Final Amount:</strong> ₹${l.amount}</p>
    `;
  } else {
    discountHTML = `<p><strong>Total Amount:</strong> ₹${l.amount}</p>`;
  }

  modalContent.innerHTML = `
    <h2>Lab Test Details</h2>
    <p><strong>Lab Register ID:</strong> ${l.labRegId || l.opNo || "-"}</p>
    <p><strong>Patient ID (OP No):</strong> ${l.opNo || l.opId || "-"}</p>
    <p><strong>Name:</strong> ${l.name}</p>
    <p><strong>Phone:</strong> ${l.phone}</p>
    <p><strong>Age:</strong> ${l.age || "-"}</p>
    <p><strong>Doctor:</strong> ${l.doctor}</p>
    <p><strong>Ref. Doctor:</strong> ${l.refDoctor || "-"}</p>
    <p><strong>Date:</strong> ${l.date}</p>
    <p><strong>Time:</strong> ${l.time}</p>
    ${testsHTML}
    ${discountHTML}
    <p><strong>Payment:</strong> ${l.payment || "Pending"}</p>
    <p><strong>Notes:</strong> ${l.history || "-"}</p>
  `;
  modal.style.display = "flex";
};

// ================= MARK LAB AS PAID =================
window.markLabPaid = async function (index) {
  const item = activeData[index];

  // Check if already paid
  if (item.payment === "Paid") {
    alert("Payment is already marked as Paid");
    return;
  }

  try {
    // Update in Firebase
    await updateDoc(doc(db, "lab_registers", item.id), {
      payment: "Paid",
    });

    // Update in activeData
    item.payment = "Paid";

    // Update the source array too
    const sourceIndex = labs.findIndex((l) => l.id === item.id);
    if (sourceIndex !== -1) {
      labs[sourceIndex].payment = "Paid";
    }

    renderLabs();

    alert("Lab payment status updated to Paid successfully!");
  } catch (err) {
    console.error("Error updating lab payment:", err);
    alert("Failed to update payment status: " + err.message);
  }
};

// ================= DATE FILTER =================
window.applyDateFilter = function () {
  const dateInput = document.getElementById("dateFilter").value;
  currentPage = 1;

  if (!dateInput) {
    // Reset to all data
    activeData = activeTab === "appointments" ? appointments : labs;
  } else {
    const source = activeTab === "appointments" ? appointments : labs;
    activeData = source.filter((x) => x.date === dateInput);
  }

  activeTab === "appointments" ? renderAppointments() : renderLabs();
};

// ================= EXCEL DOWNLOAD =================
window.downloadExcel = function () {
  let csvContent = "";

  if (activeTab === "appointments") {
    csvContent =
      "S.No,OP No,Name,Phone,Age,BP,Doctor,Ref Doctor,Date,Time,Amount,Payment,History\n";

    activeData.forEach((a, i) => {
      csvContent += `${i + 1},"${a.opNo || "-"}","${a.name}","${a.phone}","${a.age || "-"}","${a.bp || "-"}","${a.doctor}","${a.refDoctor || "-"}","${a.date}","${a.time}","${a.amount}","${a.payment || "Pending"}","${a.history || "-"}"\n`;
    });
  } else {
    csvContent =
      "S.No,Patient ID,Name,Phone,Doctor,Ref Doctor,Date,Time,Amount,Payment\n";

    activeData.forEach((l, i) => {
      csvContent += `${i + 1},"${l.opNo || "-"}","${l.name}","${l.phone}","${l.doctor}","${l.refDoctor || "-"}","${l.date}","${l.time}","${l.amount}","${l.payment || "Pending"}"\n`;
    });
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${activeTab}_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ================= CLOSE MODAL =================
window.closeModal = function () {
  modal.style.display = "none";
};
