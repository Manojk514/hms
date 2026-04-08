-- =====================================
-- HMS HOSPITAL DATABASE
-- =====================================

CREATE DATABASE IF NOT EXISTS hms;
USE hms;

-- =====================================
-- ADMIN TABLE
-- =====================================

CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100),
    password VARCHAR(255),
    email VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- USERS (PATIENT LOGIN)
-- =====================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150),
    email VARCHAR(150),
    password VARCHAR(255),
    contact_no VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- DOCTOR SPECIALIZATION
-- =====================================

CREATE TABLE doctorspecialization (
    id INT AUTO_INCREMENT PRIMARY KEY,
    specialization VARCHAR(150)
);

-- =====================================
-- DOCTORS
-- =====================================

CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_code VARCHAR(20),
    doctor_name VARCHAR(150),
    specialization_id INT,
    qualification VARCHAR(150),
    experience INT,
    license_number VARCHAR(50),
    email VARCHAR(150),
    phone VARCHAR(20),
    emergency_contact VARCHAR(20),
    password VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (specialization_id)
    REFERENCES doctorspecialization(id)
);

-- =====================================
-- PATIENTS
-- =====================================

CREATE TABLE tblpatient (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(150),
    patient_email VARCHAR(150),
    patient_phone VARCHAR(20),
    gender VARCHAR(10),
    age INT,
    blood_group VARCHAR(10),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- APPOINTMENTS
-- =====================================

CREATE TABLE appointment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    doctor_id INT,
    appointment_date DATE,
    appointment_time TIME,
    chief_complaint TEXT,
    status ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES tblpatient(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- =====================================
-- VITAL SIGNS
-- =====================================

CREATE TABLE vitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    blood_pressure VARCHAR(20),
    temperature VARCHAR(20),
    pulse VARCHAR(20),
    weight VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES tblpatient(id)
);

-- =====================================
-- CONSULTATIONS
-- =====================================

CREATE TABLE consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT,
    doctor_id INT,
    patient_id INT,
    diagnosis TEXT,
    clinical_notes TEXT,
    consultation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (appointment_id) REFERENCES appointment(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (patient_id) REFERENCES tblpatient(id)
);

-- =====================================
-- MEDICAL HISTORY
-- =====================================

CREATE TABLE tblmedicalhistory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    doctor_id INT,
    blood_pressure VARCHAR(50),
    blood_sugar VARCHAR(50),
    weight VARCHAR(50),
    temperature VARCHAR(50),
    medical_condition TEXT,
    visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES tblpatient(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- =====================================
-- PRESCRIPTIONS
-- =====================================

CREATE TABLE prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT,
    medicine_name VARCHAR(150),
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    duration VARCHAR(50),
    timing VARCHAR(50),
    route VARCHAR(50),
    instructions TEXT,

    FOREIGN KEY (consultation_id)
    REFERENCES consultations(id)
);

-- =====================================
-- LAB TESTS
-- =====================================

CREATE TABLE lab_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT,
    test_name VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (consultation_id)
    REFERENCES consultations(id)
);

-- =====================================
-- FOLLOWUPS
-- =====================================

CREATE TABLE followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT,
    followup_date DATE,
    followup_time TIME,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (consultation_id)
    REFERENCES consultations(id)
);

-- =====================================
-- DOCTOR LOGIN LOG
-- =====================================

CREATE TABLE doctorslog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT,
    ip_address VARCHAR(45),
    login_time DATETIME,
    logout_time DATETIME,

    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- =====================================
-- USER LOGIN LOG
-- =====================================

CREATE TABLE userlog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    ip_address VARCHAR(45),
    login_time DATETIME,
    logout_time DATETIME,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================
-- CONTACT US
-- =====================================

CREATE TABLE tblcontactus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150),
    email VARCHAR(150),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- CMS PAGES
-- =====================================

CREATE TABLE tblpage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_type VARCHAR(50),
    page_title VARCHAR(150),
    page_description TEXT
);

-- =====================================
-- SAMPLE DATA
-- =====================================

INSERT INTO doctorspecialization (specialization) VALUES
('Cardiology'),
('Dermatology'),
('Orthopedics'),
('General Medicine');

INSERT INTO doctors (doctor_code,doctor_name,specialization_id,email,phone,password)
VALUES
('DOC001','Dr Rajesh Sharma',1,'rajesh@hospital.com','9876543210','doctor123'),
('DOC002','Dr Priya Patel',2,'priya@hospital.com','9876543211','doctor123');
