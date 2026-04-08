-- HMS Doctor Portal Database
-- Import this file in MySQL

CREATE DATABASE IF NOT EXISTS hms;
USE hms;

-- --------------------------------
-- DOCTOR TABLE
-- --------------------------------
CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_code VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    qualification VARCHAR(100),
    experience INT,
    license_number VARCHAR(50),
    email VARCHAR(120),
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------
-- PATIENT TABLE
-- --------------------------------
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(120),
    age INT,
    gender VARCHAR(10),
    blood_group VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(120),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------
-- APPOINTMENTS TABLE
-- --------------------------------
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    doctor_id INT,
    appointment_date DATE,
    appointment_time TIME,
    chief_complaint TEXT,
    status ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- --------------------------------
-- VITAL SIGNS TABLE
-- --------------------------------
CREATE TABLE vitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    blood_pressure VARCHAR(20),
    temperature VARCHAR(20),
    pulse VARCHAR(20),
    weight VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- --------------------------------
-- CONSULTATIONS TABLE
-- --------------------------------
CREATE TABLE consultations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT,
    doctor_id INT,
    patient_id INT,
    diagnosis TEXT,
    clinical_notes TEXT,
    consultation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- --------------------------------
-- SYMPTOMS TABLE
-- --------------------------------
CREATE TABLE symptoms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT,
    symptom_name VARCHAR(100),

    FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);

-- --------------------------------
-- PRESCRIPTIONS TABLE
-- --------------------------------
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

    FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);

-- --------------------------------
-- LAB TEST ORDERS
-- --------------------------------
CREATE TABLE lab_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT,
    test_name VARCHAR(150),
    lab_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);

-- --------------------------------
-- FOLLOW UPS
-- --------------------------------
CREATE TABLE followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultation_id INT,
    followup_date DATE,
    followup_time TIME,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);

-- --------------------------------
-- DOCTOR LOGIN LOG
-- --------------------------------
CREATE TABLE doctor_login_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT,
    login_time DATETIME,
    logout_time DATETIME,
    ip_address VARCHAR(45),

    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- --------------------------------
-- DEMO DOCTORS
-- --------------------------------
INSERT INTO doctors (doctor_code,name,specialization,password)
VALUES
('DOC001','Dr. Rajesh Sharma','Cardiology','doctor123'),
('DOC002','Dr. Priya Patel','Dermatology','doctor123'),
('DOC003','Dr. Amit Reddy','Orthopedics','doctor123'),
('doctor','Dr. Demo User','General','doctor');