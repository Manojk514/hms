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

let appointments = [];
let labs = [];
let filteredAppointments = [];
let filteredLabs = [];
let activeTab = "appointments";

let currentPage = 1;
const rowsPerPage = 7;
let searchText = "";

let pieChartInstance = null;
let barChartInstance = null;

/* DEFAULT DATE = TODAY */
const today = new Date().toISOString().split("T")[0];
fromDate.value = today;
toDate.value = today;

loadData();

/* LOAD DATA */
async function loadData() {
  const apSnap = await getDocs(collection(db, "appointments"));
  const labSnap = await getDocs(collection(db, "lab_registers"));

  appointments = apSnap.docs.map((d) => d.data());
  labs = labSnap.docs.map((d) => d.data());

  fillDoctors();
  applyFilters();
}

/* DOCTOR DROPDOWN */
function fillDoctors() {
  const set = new Set();
  appointments.forEach((a) => a.doctor && set.add(a.doctor));
  labs.forEach((l) => l.doctor && set.add(l.doctor));

  doctorFilter.innerHTML =
    `<option value="All">All Doctors</option>` +
    [...set].map((d) => `<option value="${d}">${d}</option>`).join("");
}

/* APPLY FILTER */
window.applyFilters = () => {
  const from = fromDate.value;
  const to = toDate.value;
  const doctor = doctorFilter.value;

  filteredAppointments = appointments.filter(
    (a) =>
      a.date >= from &&
      a.date <= to &&
      (doctor === "All" || a.doctor === doctor),
  );

  filteredLabs = labs.filter(
    (l) =>
      l.date >= from &&
      l.date <= to &&
      (doctor === "All" || l.doctor === doctor),
  );

  totalAppointments.innerText = filteredAppointments.length;
  totalLabs.innerText = filteredLabs.length;

  const patients = new Set(
    [...filteredAppointments, ...filteredLabs].map((p) => p.phone),
  );
  totalPatients.innerText = patients.size;

  drawCharts();
  renderTable();
};

/* SEARCH */
window.applySearch = () => {
  searchText = searchInput.value.toLowerCase();
  currentPage = 1;
  renderTable();
};

/* TABLE */
function renderTable() {
  const base =
    activeTab === "appointments" ? filteredAppointments : filteredLabs;

  const data = base.filter(
    (d) =>
      (d.name && d.name.toLowerCase().includes(searchText)) ||
      (d.phone && d.phone.includes(searchText)) ||
      (d.opNo && d.opNo.toLowerCase().includes(searchText)),
  );

  const start = (currentPage - 1) * rowsPerPage;
  const pageData = data.slice(start, start + rowsPerPage);

  tableBody.innerHTML = "";
  pageData.forEach((d, i) => {
    tableBody.innerHTML += `
      <tr>
        <td>${start + i + 1}</td>
        <td>${d.opNo || d.labId || "-"}</td>
        <td>${d.name}</td>
        <td>${d.phone}</td>
        <td>${d.doctor || "-"}</td>
        <td>${d.date}</td>
      </tr>`;
  });

  pageInfo.innerText = `Page ${currentPage} of ${Math.max(1, Math.ceil(data.length / rowsPerPage))}`;
}

/* PAGINATION */
window.nextPage = () => {
  currentPage++;
  renderTable();
};
window.prevPage = () => {
  if (currentPage > 1) currentPage--;
  renderTable();
};

/* TABS */
window.switchTab = (tab) => {
  activeTab = tab;
  currentPage = 1;
  document
    .querySelectorAll(".tab")
    .forEach((b) => b.classList.remove("active"));
  event.target.classList.add("active");
  renderTable();
};

/* ✅ FIXED CHARTS */
function drawCharts() {
  if (pieChartInstance) pieChartInstance.destroy();
  if (barChartInstance) barChartInstance.destroy();

  const pieCtx = document.getElementById("pieChart");
  const barCtx = document.getElementById("barChart");

  pieChartInstance = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: ["Appointments", "Labs"],
      datasets: [
        {
          data: [filteredAppointments.length, filteredLabs.length],
          backgroundColor: ["#1e4fa1", "#f97316"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  const doctorMap = {};
  filteredAppointments.forEach((a) => {
    doctorMap[a.doctor] = (doctorMap[a.doctor] || 0) + 1;
  });

  barChartInstance = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: Object.keys(doctorMap),
      datasets: [
        {
          label: "Appointments",
          data: Object.values(doctorMap),
          backgroundColor: "#1e4fa1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

/* DOCTOR MODAL */
window.openDoctorModal = () => {
  doctorTable.innerHTML = "";

  const map = {};
  filteredAppointments.forEach((a) => {
    map[a.doctor] = map[a.doctor] || { ap: 0, lab: 0 };
    map[a.doctor].ap++;
  });

  filteredLabs.forEach((l) => {
    map[l.doctor] = map[l.doctor] || { ap: 0, lab: 0 };
    map[l.doctor].lab++;
  });

  Object.keys(map).forEach((d) => {
    doctorTable.innerHTML += `
      <tr>
        <td>${d}</td>
        <td>${map[d].ap}</td>
        <td>${map[d].lab}</td>
      </tr>`;
  });

  doctorModal.style.display = "flex";
};

window.closeDoctorModal = () => {
  doctorModal.style.display = "none";
};
