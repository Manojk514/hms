// ================= SUPER ADMIN CREDENTIALS =================
const SUPER_ADMIN_CREDENTIALS = {
  'superadmin': 'admin123',
  'admin': 'password123'
};

// ================= LOGIN HANDLING =================
function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorElement = document.getElementById('error');
  
  // Clear previous error
  errorElement.textContent = '';
  
  if (authenticateUser(username, password)) {
    // Store session
    sessionStorage.setItem('superAdminSession', JSON.stringify({
      username: username,
      loginTime: new Date().toISOString()
    }));
    
    // Redirect to dashboard
    window.location.href = 'super_admin_dashboard.html';
  } else {
    errorElement.textContent = 'Invalid username or password!';
  }
}

function authenticateUser(username, password) {
  return SUPER_ADMIN_CREDENTIALS[username] === password;
}

// ================= DEMO FUNCTION =================
function fillDemo() {
  document.getElementById('username').value = 'superadmin';
  document.getElementById('password').value = 'admin123';
}