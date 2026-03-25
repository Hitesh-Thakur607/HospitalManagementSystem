# SQL Commands - Quick Reference

## Full Setup (Run these in order)

### 1. Drop and Create Database
```sql
DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db;
USE hospital_db;
```

### 2. Create Users Table
```sql
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
```

### 3. Create Patients Table
```sql
CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  age INT,
  gender VARCHAR(20),
  medical_history TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4. Create Doctor Table
```sql
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
```

### 5. Create Appointments Table
```sql
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date VARCHAR(30) NOT NULL,
  appointment_time VARCHAR(30) NOT NULL,
  status ENUM('booked', 'completed', 'cancelled') NOT NULL DEFAULT 'booked',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE,
  UNIQUE KEY uq_doctor_date_time (doctor_id, appointment_date, appointment_time)
);
```

### 6. Create Admin User
```sql
INSERT INTO users (name, email, password, role, is_approved, phone, address) 
VALUES ('System Admin', 'admin@hospital.com', '$2a$10$YIH.5cBQCaH1xPFsF5.rN.5vfPWcBEi0/fWqFfCBLW8KLLt2xWpXm', 'admin', 1, '+1111111111', 'Admin Office');
```

---

## Useful Queries

### View All Users with Roles
```sql
SELECT id, name, email, role, is_approved FROM users;
```

### View Pending Doctors
```sql
SELECT u.id, u.name, u.email, u.role, u.is_approved, d.department 
FROM users u 
INNER JOIN doctor d ON u.id = d.user_id 
WHERE u.is_approved = 0;
```

### View Approved Doctors
```sql
SELECT u.id, u.name, u.email, u.specialization, d.department, d.experience_years 
FROM users u 
INNER JOIN doctor d ON u.id = d.user_id 
WHERE u.is_approved = 1;
```

### View All Patients
```sql
SELECT u.id, u.name, u.email, u.phone, p.age, p.gender 
FROM users u 
INNER JOIN patients p ON u.id = p.user_id;
```

### Approve a Doctor (ID = 3)
```sql
UPDATE users SET is_approved = 1 WHERE id = 3 AND role = 'doctor';
UPDATE doctor SET approved_by = 1, approved_at = NOW() WHERE user_id = 3;
```

### Reject a Doctor (ID = 4)
```sql
UPDATE users SET is_approved = -1 WHERE id = 4 AND role = 'doctor';
```

### View All Appointments
```sql
SELECT 
  a.id,
  u.name as doctor_name,
  p.user_id as patient_id,
  a.appointment_date,
  a.appointment_time,
  a.status
FROM appointments a
INNER JOIN doctor d ON a.doctor_id = d.user_id
INNER JOIN users u ON d.user_id = u.id
INNER JOIN patients p ON a.patient_id = p.user_id;
```

### View Appointments for Specific Doctor
```sql
SELECT 
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.status
FROM appointments a
WHERE a.doctor_id = 3;
```

### Delete a User and All Related Data
```sql
DELETE FROM users WHERE id = 5;
-- This automatically deletes:
-- - from patients table (CASCADE)
-- - from doctor table (CASCADE)
-- - appointments with that doctor_id (CASCADE)
```

### Check Doctor Approval Status
```sql
SELECT id, name, email, is_approved FROM users WHERE role = 'doctor';
```

### Reset All Doctor Approvals to Pending
```sql
UPDATE users SET is_approved = 0 WHERE role = 'doctor';
```

---

## All-in-One Setup Script

Copy and paste this into MySQL:

```sql
DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db;
USE hospital_db;

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

CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  age INT,
  gender VARCHAR(20),
  medical_history TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date VARCHAR(30) NOT NULL,
  appointment_time VARCHAR(30) NOT NULL,
  status ENUM('booked', 'completed', 'cancelled') NOT NULL DEFAULT 'booked',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE,
  UNIQUE KEY uq_doctor_date_time (doctor_id, appointment_date, appointment_time)
);

INSERT INTO users (name, email, password, role, is_approved, phone, address) 
VALUES ('System Admin', 'admin@hospital.com', '$2a$10$YIH.5cBQCaH1xPFsF5.rN.5vfPWcBEi0/fWqFfCBLW8KLLt2xWpXm', 'admin', 1, '+1111111111', 'Admin Office');

SELECT 'Database setup complete!' as status;
SELECT id, name, email, role FROM users;
```

---

## Status Values

### is_approved field
- `0` = Pending (doctor registered but not approved)
- `1` = Approved (can login and handle appointments)
- `-1` = Rejected (cannot login or handle appointments)

---

Done! 🎉
