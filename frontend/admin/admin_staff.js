import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { projectId: "itivat-med-hms" };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentRole = "";

// OPEN MODAL
window.openModal = (role) => {
  currentRole = role;
  document.getElementById("modalTitle").innerText = "Add " + role;
  document.getElementById("staffModal").style.display = "flex";
};

// CLOSE MODAL
window.onclick = function (e) {
  if (e.target.id === "staffModal") {
    document.getElementById("staffModal").style.display = "none";
  }
};

// SAVE STAFF
window.saveStaff = async () => {
  const name = staffName.value || "";
  const phone = staffPhone.value || "";
  const salary = Number(staffSalary.value || 0);

  await addDoc(collection(db, "staff"), {
    name,
    phone,
    role: currentRole,
    salary,
  });

  document.getElementById("staffModal").style.display = "none";
  clearForm();
  loadStaff();
};

// LOAD STAFF
async function loadStaff() {
  const snap = await getDocs(collection(db, "staff"));

  let totalStaff = 0;
  let totalSalary = 0;

  ["Receptionist", "Nurse", "Janitor"].forEach((role) => {
    document.getElementById(role).innerHTML = "";
  });

  snap.forEach((doc) => {
    const data = doc.data();

    totalStaff++;
    totalSalary += Number(data.salary || 0);

    const container = document.getElementById(data.role);
    if (container) {
      container.innerHTML += `
        <div class="staff-card">
          <h4>${data.name}</h4>
          <p>${data.phone}</p>
          <p>₹${data.salary}</p>
        </div>
      `;
    }
  });

  document.getElementById("totalStaff").innerText = totalStaff;
  document.getElementById("totalSalary").innerText = "₹" + totalSalary;
}

function clearForm() {
  staffName.value = "";
  staffPhone.value = "";
  staffSalary.value = "";
}

loadStaff();
