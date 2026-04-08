// Quote rotation
const quotes = [
  ""Wherever the art of Medicine is loved, there is also a love of Humanity."",
  ""In our job, you will never go home thinking you haven't done something valuable."",
  ""The awe of discovering the human body and helping someone heal never grows old."",
];

let quoteIndex = 0;

function rotateQuotes() {
  const quoteText = document.querySelector(".quote-text");
  const dots = document.querySelectorAll(".dot");
  
  if (quoteText && dots.length > 0) {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    quoteText.textContent = quotes[quoteIndex];
    
    dots.forEach((d) => d.classList.remove("active"));
    dots[quoteIndex].classList.add("active");
  }
}

// Start quote rotation
setInterval(rotateQuotes, 4000);

// Doctor credentials
const doctors = [
  { id: 'doctor', password: 'doctor', name: 'Dr. Demo User' },
  { id: 'DOC001', password: 'doctor123', name: 'Dr. Rajesh Sharma' },
  { id: 'DOC002', password: 'doctor123', name: 'Dr. Priya Patel' },
  { id: 'DOC003', password: 'doctor123', name: 'Dr. Amit Reddy' }
];

// Login function
function doLogin() {
  console.log('doLogin called');
  
  const idInput = document.getElementById('doctorId');
  const pwdInput = document.getElementById('password');
  
  if (!idInput || !pwdInput) {
    console.error('Input fields not found');
    alert('Error: Input fields not found');
    return;
  }
  
  const doctorId = idInput.value.trim();
  const password = pwdInput.value.trim();
  
  console.log('Attempting login with:', doctorId);
  
  if (!doctorId || !password) {
    alert('Please enter both Doctor ID and Password');
    return;
  }
  
  const doctor = doctors.find(d => d.id === doctorId && d.password === password);
  
  if (doctor) {
    console.log('Login successful:', doctor.name);
    localStorage.setItem('doctorName', doctor.name);
    localStorage.setItem('doctorId', doctor.id);
    window.location.href = 'doctor_dashboard.html';
  } else {
    alert('Invalid credentials!\n\nTry:\nDoctor ID: doctor\nPassword: doctor');
  }
}

// Wait for page to load
window.addEventListener('DOMContentLoaded', function() {
  console.log('Page loaded');
  
  const loginBtn = document.getElementById('loginBtn');
  const idInput = document.getElementById('doctorId');
  const pwdInput = document.getElementById('password');
  
  if (loginBtn) {
    console.log('Login button found');
    loginBtn.onclick = doLogin;
  } else {
    console.error('Login button not found');
  }
  
  if (pwdInput) {
    pwdInput.onkeypress = function(e) {
      if (e.key === 'Enter') doLogin();
    };
  }
  
  if (idInput) {
    idInput.onkeypress = function(e) {
      if (e.key === 'Enter') doLogin();
    };
  }
});
