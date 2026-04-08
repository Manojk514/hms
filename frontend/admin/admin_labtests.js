import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  projectId: "itivat-med-hms",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadLabAnalytics() {
  const snap = await getDocs(collection(db, "lab_registers"));

  let total = 0;
  let countMap = {};

  snap.forEach((doc) => {
    const data = doc.data();
    const test = data.testName || "Unknown";

    total++;

    if (!countMap[test]) countMap[test] = 0;
    countMap[test]++;
  });

  const entries = Object.entries(countMap).sort((a, b) => b[1] - a[1]);

  document.getElementById("totalTests").innerText = total;
  document.getElementById("uniqueTests").innerText = entries.length;
  document.getElementById("mostUsedTest").innerText = entries[0]?.[0] || "-";

  const tbody = document.getElementById("analyticsTable");
  tbody.innerHTML = "";

  entries.forEach((e) => {
    tbody.innerHTML += `
      <tr>
        <td>${e[0]}</td>
        <td>${e[1]}</td>
      </tr>
    `;
  });
}

loadLabAnalytics();
