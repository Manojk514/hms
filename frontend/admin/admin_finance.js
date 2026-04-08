import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* 🔴 PUT YOUR REAL FIREBASE CONFIG HERE */
/* Copy SAME config from admin_dashboard.js */
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

let pieChart;
let barChart;

// DEFAULT = THIS MONTH
function setDefaultDates() {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);

  document.getElementById("fromDate").value = first.toISOString().split("T")[0];

  document.getElementById("toDate").value = today.toISOString().split("T")[0];
}

window.loadFinance = async function () {
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;

  const apSnap = await getDocs(collection(db, "appointments"));
  const labSnap = await getDocs(collection(db, "lab_registers"));
  const staffSnap = await getDocs(collection(db, "staff"));

  let opRevenue = 0;
  let labRevenue = 0;
  let salaryExpense = 0;
  let doctorRevenue = {};

  apSnap.forEach((doc) => {
    const a = doc.data();

    if (a.date && a.date >= fromDate && a.date <= toDate) {
      const amount = Number(a.amount || 0);
      const doctor = a.doctor || "Unknown";

      opRevenue += amount;
      doctorRevenue[doctor] = (doctorRevenue[doctor] || 0) + amount;
    }
  });

  labSnap.forEach((doc) => {
    const l = doc.data();

    if (l.date && l.date >= fromDate && l.date <= toDate) {
      const amount = Number(l.amount || 0);
      const doctor = l.doctor || "Unknown";

      labRevenue += amount;
      doctorRevenue[doctor] = (doctorRevenue[doctor] || 0) + amount;
    }
  });

  staffSnap.forEach((doc) => {
    salaryExpense += Number(doc.data().salary || 0);
  });

  const totalRevenue = opRevenue + labRevenue;
  const netProfit = totalRevenue - salaryExpense;

  document.getElementById("opRevenue").innerText = "₹" + opRevenue;
  document.getElementById("labRevenue").innerText = "₹" + labRevenue;
  document.getElementById("salaryExpense").innerText = "₹" + salaryExpense;
  document.getElementById("totalRevenue").innerText = "₹" + totalRevenue;
  document.getElementById("netProfit").innerText = "₹" + netProfit;

  renderCharts(opRevenue, labRevenue, doctorRevenue);
};

function renderCharts(opRevenue, labRevenue, doctorRevenue) {
  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();

  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "doughnut",
    data: {
      labels: ["OP Revenue", "Lab Revenue"],
      datasets: [
        {
          data: [opRevenue, labRevenue],
          backgroundColor: ["#1e4fa1", "#16a34a"],
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
    },
  });

  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: Object.keys(doctorRevenue),
      datasets: [
        {
          label: "Revenue",
          data: Object.values(doctorRevenue),
          backgroundColor: "#1e4fa1",
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
    },
  });
}

// INIT
setDefaultDates();
loadFinance();
