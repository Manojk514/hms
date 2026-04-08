console.log("✅ Super Admin Login JS loaded successfully");

async function handleLogin(event) {
  event.preventDefault();
  console.log("🔵 Login button clicked");

  const email = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorElement = document.getElementById('error');

  console.log("📧 Email:", email);
  console.log("🔑 Password length:", password.length);

  errorElement.textContent = '';

  try {
    console.log("📡 Sending login request to API...");
    const res = await fetch("http://localhost/HMS/public/api/platform/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    console.log("📥 Response status:", res.status);
    
    const text = await res.text();
    console.log("📄 Raw response:", text.substring(0, 200));
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("❌ Server returned invalid JSON:", text);
      errorElement.textContent = "Server error. Check console for details.";
      return;
    }

    console.log("✅ Parsed response:", result);

    if (!result.success) {
      errorElement.textContent = result.error?.message || "Login failed";
      console.error("❌ Login failed:", result.error);
      return;
    }

    // Save JWT token
    localStorage.setItem("token", result.data.token);
    localStorage.setItem("user", JSON.stringify(result.data.user));

    console.log("✅ Token saved, redirecting to dashboard...");

    // Redirect to dashboard
    window.location.href = "super_admin_dashboard.html";

  } catch (err) {
    console.error("❌ Login error:", err);
    errorElement.textContent = err.message || "Server error. Please try again.";
  }
}

function fillDemo() {
  console.log("🎯 Fill demo clicked");
  document.getElementById('username').value = 'admin@platform.com';
  document.getElementById('password').value = 'admin123';
  console.log("✅ Demo credentials filled");
}

// Test if DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("✅ DOM loaded, form elements ready");
  console.log("📝 Username field:", document.getElementById('username') ? 'Found' : 'NOT FOUND');
  console.log("🔒 Password field:", document.getElementById('password') ? 'Found' : 'NOT FOUND');
});
