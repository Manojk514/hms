import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { projectId: "itivat-med-hms" };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadPatients() {
  const snap = await getDocs(collection(db, "appointments"));

  let patients = {};

  snap.forEach((doc) => {
    const d = doc.data();

    if (!patients[d.phone]) {
      patients[d.phone] = {
        name: d.name,
        phone: d.phone,
        visits: 0,
        lastVisit: d.date,
      };
    }

    patients[d.phone].visits++;

    if (d.date > patients[d.phone].lastVisit)
      patients[d.phone].lastVisit = d.date;
  });

  const container = document.getElementById("patientsContainer");
  container.innerHTML = "";

  Object.values(patients).forEach((p) => {
    container.innerHTML += `
      <div class="card">
        <h3>${p.name}</h3>
        <p><b>Phone:</b> ${p.phone}</p>
        <p><b>Total Visits:</b> ${p.visits}</p>
        <p><b>Last Visit:</b> ${p.lastVisit}</p>
      </div>
    `;
  });
}

loadPatients();
