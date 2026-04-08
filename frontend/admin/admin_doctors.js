import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  projectId: "itivat-med-hms",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let editId = null;

// OPEN MODAL
window.openModal = () => {
  editId = null;
  document.getElementById("modalTitle").innerText = "Add Doctor";
  document.getElementById("deleteBtn").style.display = "none";
  clearForm();
  document.getElementById("doctorModal").style.display = "flex";
};

// CLOSE MODAL
window.onclick = function (e) {
  if (e.target.id === "doctorModal") {
    document.getElementById("doctorModal").style.display = "none";
  }
};

// SAVE DOCTOR
window.saveDoctor = async () => {
  const name = docName.value || "";
  const phone = docPhone.value || "";
  const designation = docDesignation.value || "";
  const experience = docExperience.value || "";
  const salary = docSalary.value || "";

  let imageUrl = "";

  const file = document.getElementById("docPhoto").files[0];

  if (file) {
    const storageRef = ref(
      storage,
      "doctor_photos/" + Date.now() + "_" + file.name,
    );
    await uploadBytes(storageRef, file);
    imageUrl = await getDownloadURL(storageRef);
  }

  const data = {
    name,
    phone,
    designation,
    experience,
    salary,
  };

  if (imageUrl) {
    data.photo = imageUrl;
  }

  if (editId) {
    await updateDoc(doc(db, "doctors", editId), data);
  } else {
    await addDoc(collection(db, "doctors"), data);
  }

  document.getElementById("doctorModal").style.display = "none";
  loadDoctors();
};

// LOAD DOCTORS
async function loadDoctors() {
  const snap = await getDocs(collection(db, "doctors"));
  const container = document.getElementById("doctorContainer");
  container.innerHTML = "";

  snap.forEach((d) => {
    const data = d.data();

    container.innerHTML += `
      <div class="doctor-card">
        <button class="edit-btn" onclick="editDoctor('${d.id}')">✏</button>
        <img src="${data.photo || "https://via.placeholder.com/90"}">
        <h3>${data.name || "-"}</h3>
        <p>${data.designation || "-"}</p>
        <p>${data.experience || 0} Years Experience</p>
      </div>
    `;
  });
}

// EDIT DOCTOR
window.editDoctor = async (id) => {
  editId = id;

  const snap = await getDocs(collection(db, "doctors"));
  snap.forEach((d) => {
    if (d.id === id) {
      const data = d.data();

      docName.value = data.name || "";
      docPhone.value = data.phone || "";
      docDesignation.value = data.designation || "";
      docExperience.value = data.experience || "";
      docSalary.value = data.salary || "";
    }
  });

  document.getElementById("modalTitle").innerText = "Edit Doctor";
  document.getElementById("deleteBtn").style.display = "inline-block";
  document.getElementById("doctorModal").style.display = "flex";
};

// DELETE
window.deleteDoctor = async () => {
  if (!editId) return;
  await deleteDoc(doc(db, "doctors", editId));
  document.getElementById("doctorModal").style.display = "none";
  loadDoctors();
};

// CLEAR
function clearForm() {
  docName.value = "";
  docPhone.value = "";
  docDesignation.value = "";
  docExperience.value = "";
  docSalary.value = "";
  document.getElementById("docPhoto").value = "";
}

loadDoctors();
