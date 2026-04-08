// ================= AUTH GUARD (LOCAL STORAGE) =================
if (localStorage.getItem("adminLoggedIn") !== "true") {
  window.location.href = "admin_login.html";
}

// ================= NAVIGATION =================
window.logout = () => {
  localStorage.removeItem("adminLoggedIn");
  window.location.href = "admin_login.html";
};

window.goBackHome = () => {
  window.location.href = "index.html";
};
window.goAppointments = () => {
  window.location.href = "admin_appointments.html";
};

// ================= FIREBASE (DATA ONLY) =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHk_3j17dq7uG-UC9fr3lIES_bcnqKjFc",
  authDomain: "itivat-med-hms.firebaseapp.com",
  projectId: "itivat-med-hms",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= STATE =================
let appointments = [];
let labs = [];

// ================= LOAD TODAY DATA =================
async function loadTodayDashboard() {
  const today = new Date().toISOString().split("T")[0];

  const apSnap = await getDocs(collection(db, "appointments"));
  const labSnap = await getDocs(collection(db, "lab_registers"));

  let todayAppointments = 0;
  let todayLabs = 0;
  let opRevenue = 0;
  let labRevenue = 0;

  appointments = [];
  labs = [];

  apSnap.forEach((doc) => {
    const a = doc.data();
    if (a.date === today) {
      todayAppointments++;
      opRevenue += Number(a.amount || 0);
      appointments.push(a);
    }
  });

  labSnap.forEach((doc) => {
    const l = doc.data();
    if (l.date === today) {
      todayLabs++;
      labRevenue += Number(l.amount || 0);
      labs.push(l);
    }
  });

  // ================= UPDATE CARDS =================
  document.getElementById("todayAppointments").innerText = todayAppointments;
  document.getElementById("todayLabs").innerText = todayLabs;
  document.getElementById("todayOpRevenue").innerText = opRevenue;
  document.getElementById("todayLabRevenue").innerText = labRevenue;
  document.getElementById("todayRevenue").innerText =
    `₹${opRevenue + labRevenue}`;

  renderAppointments();
}

loadTodayDashboard();

// ================= RENDER TABLE (ONLY 6 ENTRIES) =================
function renderAppointments() {
  const tbody = document.getElementById("appointmentsTableBody");
  tbody.innerHTML = "";

  appointments.slice(0, 6).forEach((a, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${a.opNo || "-"}</td>
        <td>${a.name}</td>
        <td>${a.phone}</td>
        <td>${a.doctor}</td>
        <td>${a.date}</td>
        <td>₹${a.amount || "-"}</td>
        <td>${a.payment || "Pending"}</td>
      </tr>
    `;
  });
}

// ================= TABS =================
window.showAppointments = () => {
  document.getElementById("labsSection").style.display = "none";
};

window.showLabs = () => {
  document.getElementById("labsSection").style.display = "block";
};

// ================= EXCEL =================
window.downloadExcel = () => {
  let csv = "OP No,Name,Phone,Doctor,Date,Amount,Payment\n";

  appointments.forEach((a) => {
    csv += `${a.opNo},${a.name},${a.phone},${a.doctor},${a.date},${a.amount},${a.payment}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "today_appointments.csv";
  link.click();
};
