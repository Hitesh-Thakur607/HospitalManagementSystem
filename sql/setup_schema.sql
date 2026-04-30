-- SIMPLIFIED HOSPITAL DATABASE SCHEMA
-- Two roles only: Doctor & Patient
-- Admin approves doctors for appointments

-- Drop existing database
DROP DATABASE IF EXISTS hospital_db;

-- Create new database
CREATE DATABASE hospital_db;
USE hospital_db;

-- Users table (Doctor, Patient, or Admin)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('doctor', 'patient', 'admin') NOT NULL DEFAULT 'patient',
  is_approved INT DEFAULT 0,
  phone VARCHAR(30),
  address VARCHAR(255),
  specialization VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  age INT,
  gender VARCHAR(20),
  medical_history TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Doctor table
CREATE TABLE doctor (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  department VARCHAR(120),
  biography TEXT,
  qualifications VARCHAR(255),
  experience_years INT,
  image TEXT,
  approved_by INT,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_doctor_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Appointments table
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date VARCHAR(30) NOT NULL,
  appointment_time VARCHAR(30) NOT NULL,
  status ENUM('booked', 'approved', 'completed', 'cancelled') NOT NULL DEFAULT 'booked',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE,
  UNIQUE KEY uq_doctor_date_time (doctor_id, appointment_date, appointment_time)
);

-- Chat messages table
CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_user_id INT NOT NULL,
  patient_user_id INT NOT NULL,
  sender_user_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_doctor_user FOREIGN KEY (doctor_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_patient_user FOREIGN KEY (patient_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_sender_user FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat_thread_created_at (doctor_user_id, patient_user_id, created_at)
);

-- Insert Admin User (password: admin123)
INSERT INTO users (name, email, password, role, is_approved, phone, address) 
VALUES ('System Admin', 'admin@hospital.com', '$2a$10$YIH.5cBQCaH1xPFsF5.rN.5vfPWcBEi0/fWqFfCBLW8KLLt2xWpXm', 'admin', 1, '+1111111111', 'Admin Office');

