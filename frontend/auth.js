// auth.js
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHk_3j17dq7uG-UC9fr3lIES_bcnqKjFc",
  authDomain: "itivat-med-hms.firebaseapp.com",
  projectId: "itivat-med-hms",
  storageBucket: "itivat-med-hms.firebasestorage.app",
  messagingSenderId: "690474532008",
  appId: "1:690474532008:web:4c8c4ceca7a2042cca569d"
};

// ✅ SAFE INIT (only once)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// 🔐 Protect page
export function protectPage() {
  onAuthStateChanged(auth, user => {
    if (!user) window.location.replace("op_login.html");
  });
}

// 🔓 Logout
export function logout() {
  signOut(auth).then(() => {
    window.location.replace("op_login.html");
  });
}

export { auth, db };