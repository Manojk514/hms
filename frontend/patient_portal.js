document.getElementById("loginBtn").addEventListener("click", () => {
  const patientId = document.getElementById("patientId").value;
  const password = document.getElementById("password").value;

  if (!patientId || !password) {
    alert("Please enter Patient ID and password");
  } else {
    alert("Login successful (demo)");
  }
});

document.getElementById("registerBtn").addEventListener("click", function () {
  window.location.href = "patient_register.html";
});
