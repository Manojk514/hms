// ================= ADMIN CREDENTIALS =================
const ADMIN_EMAIL = "admin@itivat.com";
const ADMIN_PASSWORD = "admin@12345";

// ================= LOGIN FUNCTION =================
function loginAdmin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("error");

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Save login state
    localStorage.setItem("adminLoggedIn", "true");

    // Redirect to dashboard
    window.location.href = "admin_dashboard.html";
  } else {
    errorEl.textContent = "Invalid email or password";
  }
}
