// ================= FIREBASE =================
import { db } from "./auth.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ================= OP NUMBER =================
async function generateOpNumber(date) {
  const d = date.replaceAll("-", "");
  const q = query(
    collection(db, "appointments"),
    where("date", "==", date)
  );
  const snap = await getDocs(q);
  const count = snap.size + 1;
  return `OP-${d}-${String(count).padStart(3, "0")}`;
}

// ================= BILL NUMBER =================
function generateBillNumber() {
  const now = new Date();
  return (
    "BILL-" +
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    "-" +
    Math.floor(1000 + Math.random() * 9000)
  );
}

// ================= BILLING =================
function calculateBilling() {
  const opAmount = document.getElementById("opAmount");
  const discountPercent = document.getElementById("discountPercent");
  const discountAmount = document.getElementById("discountAmount");
  const finalAmount = document.getElementById("finalAmount");

  if (!opAmount || !discountPercent) return;

  const amount = Number(opAmount.value) || 0;
  const discount = Number(discountPercent.value) || 0;

  const discAmt = (amount * discount) / 100;
  const finalAmt = amount - discAmt;

  if (discountAmount) discountAmount.value = discAmt.toFixed(2);
  if (finalAmount) finalAmount.value = finalAmt.toFixed(2);
}

// ================= SAVE APPOINTMENT =================
async function saveAppointment() {
  console.log("🔵 SAVE FUNCTION CALLED");
  
  const patientName = document.getElementById("patientName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const doctor = document.getElementById("doctor").value;
  const sex = document.getElementById("sex").value;
  const dateVal = document.getElementById("date").value;
  const timeVal = document.getElementById("time").value;

  console.log("📝 Form data:", { patientName, phone, doctor, sex, dateVal, timeVal });

  // VALIDATION
  if (!patientName) {
    alert("⚠️ Patient name required");
    return;
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    alert("⚠️ Invalid phone number (must be 10 digits)");
    return;
  }
  if (!doctor) {
    alert("⚠️ Please select a doctor");
    return;
  }
  if (!sex) {
    alert("⚠️ Please select sex");
    return;
  }
  if (!dateVal || !timeVal) {
    alert("⚠️ Please select date & time");
    return;
  }

  console.log("✅ Validation passed, generating OP number...");
  const opNo = await generateOpNumber(dateVal);
  console.log("✅ OP Number generated:", opNo);

  const opAmount = document.getElementById("opAmount");
  const discountPercent = document.getElementById("discountPercent");
  const discountAmount = document.getElementById("discountAmount");
  const finalAmount = document.getElementById("finalAmount");

const finalAmt = Number(finalAmount.value || 0);

const appointment = {
  opNo,
  name: patientName,
  phone,
  sex,
  doctor,
  refDoctor: document.getElementById("refDoctor").value || "",
  age: document.getElementById("age").value || "",
  date: dateVal,
  time: timeVal,
  bp: document.getElementById("bp").value || "",
  sugar: document.getElementById("sugar").value || "",
  weight: document.getElementById("weight").value || "",
  history: document.getElementById("history").value || "",

  // ✅ ROOT LEVEL (dashboard-safe)
  amount: finalAmt,

  // ✅ NESTED (future-safe)
  billing: {
    billNumber: document.getElementById("billNumber").value,
    opAmount: Number(opAmount.value || 0),
    discountPercent: Number(discountPercent.value || 0),
    discountAmount: Number(discountAmount.value || 0),
    finalAmount: finalAmt,
    paymentType: document.getElementById("paymentType").value
  },

  payment: "Pending",
  createdAt: serverTimestamp()
};

  console.log("💾 Saving to Firebase:", appointment);

  try {
    const docRef = await addDoc(collection(db, "appointments"), appointment);
    console.log("✅ SAVED! Document ID:", docRef.id);
    alert(`✅ SUCCESS!\n\nAppointment saved\nOP Number: ${opNo}`);
    
    // Clear form
    document.getElementById("patientName").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("age").value = "";
    document.getElementById("refDoctor").value = "";
    document.getElementById("bp").value = "";
    document.getElementById("sugar").value = "";
    document.getElementById("weight").value = "";
    document.getElementById("history").value = "";
    document.getElementById("billNumber").value = generateBillNumber();
    
    console.log("🔄 Redirecting to dashboard...");
    setTimeout(() => {
      window.location.href = "op_dashboard.html";
    }, 1000);
    
  } catch (err) {
    console.error("❌ ERROR:", err);
    alert("❌ Error: " + err.message);
  }
}

// Make it globally available
window.saveAppointment = saveAppointment;

// ================= DOM READY =================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 PAGE LOADED");

  const dateInput = document.getElementById("date");
  if (dateInput) {
    const today = new Date();
    const localDate = today.toLocaleDateString('en-CA');
    dateInput.value = localDate;
  }

  const opAmount = document.getElementById("opAmount");
  if (opAmount) opAmount.value = 750;

  const billNumber = document.getElementById("billNumber");
  if (billNumber) billNumber.value = generateBillNumber();

  const discountPercent = document.getElementById("discountPercent");
  if (opAmount) opAmount.addEventListener("input", calculateBilling);
  if (discountPercent) discountPercent.addEventListener("input", calculateBilling);

  calculateBilling();

  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) {
    console.log("🟢 SAVE BUTTON FOUND");
    saveBtn.onclick = async () => {
      console.log("🔵 BUTTON CLICKED!");
      await saveAppointment();
    };
  } else {
    console.error("❌ NO SAVE BUTTON!");
  }
});

// ================= PRINT BILL =================
window.printBill = function (type) {
  const PRINT_CFG = {
    DIA: {
      logo: "./diablogo.png",
      name: "DIAB NEURO CENTER",
      addr: "Vidyanagar, Hyderabad"
    },
    NEURO: {
      logo: "./jagsanlogo.png",
      name: "JAGSAN Diagnostics",
      addr: "Gandhi Nagar, Hyderabad"
    }
  };

  const c = PRINT_CFG[type];
  const receiptPrint = document.getElementById("receiptPrint");

  document.getElementById("rClinic").innerText = c.name;
  document.getElementById("rAddress").innerText = c.addr;
  document.getElementById("rPatient").innerText = document.getElementById("patientName").value;
  document.getElementById("rPhone").innerText = document.getElementById("phone").value;
  document.getElementById("rAgeSex").innerText = document.getElementById("age").value + " / " + document.getElementById("sex").value;
  document.getElementById("rDoctor").innerText = document.getElementById("doctor").value;
  document.getElementById("rBill").innerText = document.getElementById("billNumber").value;
  document.getElementById("rDate").innerText = document.getElementById("date").value;
  document.getElementById("rOpAmt").innerText = document.getElementById("opAmount").value;
  document.getElementById("rDisc").innerText = document.getElementById("discountAmount").value;
  document.getElementById("rFinal").innerText = document.getElementById("finalAmount").value;
  document.getElementById("rPaid").innerText = document.getElementById("finalAmount").value;
  document.getElementById("rWords").innerText = "Rupees " + document.getElementById("finalAmount").value + " Only";

  receiptPrint.style.display = "block";

  const rLogo = document.getElementById("rLogo");
  rLogo.onload = function () {
    window.print();
    setTimeout(() => {
      receiptPrint.style.display = "none";
      rLogo.onload = null;
    }, 500);
  };

  rLogo.onerror = function () {
    window.print();
    setTimeout(() => {
      receiptPrint.style.display = "none";
      rLogo.onload = null;
    }, 500);
  };

  rLogo.src = c.logo + "?v=" + Date.now();
};