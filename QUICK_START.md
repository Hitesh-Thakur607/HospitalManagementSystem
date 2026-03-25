# Quick Reference - Copy & Paste Ready

## ⚡ ONE-LINE SQL SETUP

Copy and paste this entire block into your MySQL client:

```sql
DROP DATABASE IF EXISTS hospital_db; CREATE DATABASE hospital_db; USE hospital_db; CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, role ENUM('doctor', 'patient', 'admin') NOT NULL DEFAULT 'patient', is_approved INT DEFAULT 0, phone VARCHAR(30), address VARCHAR(255), specialization VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); CREATE TABLE patients (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE, age INT, gender VARCHAR(20), medical_history TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE); CREATE TABLE doctor (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE, department VARCHAR(120), biography TEXT, qualifications VARCHAR(255), experience_years INT, image TEXT, approved_by INT, approved_at TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT fk_doctor_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL); CREATE TABLE appointments (id INT AUTO_INCREMENT PRIMARY KEY, patient_id INT NOT NULL, doctor_id INT NOT NULL, appointment_date VARCHAR(30) NOT NULL, appointment_time VARCHAR(30) NOT NULL, status ENUM('booked', 'completed', 'cancelled') NOT NULL DEFAULT 'booked', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE, CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE, UNIQUE KEY uq_doctor_date_time (doctor_id, appointment_date, appointment_time)); INSERT INTO users (name, email, password, role, is_approved, phone, address) VALUES ('System Admin', 'admin@hospital.com', '$2a$10$YIH.5cBQCaH1xPFsF5.rN.5vfPWcBEi0/fWqFfCBLW8KLLt2xWpXm', 'admin', 1, '+1111111111', 'Admin Office');
```

---

## ⚡ KEY API ENDPOINTS

### Register as Patient
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Patient",
    "email": "patient@test.com",
    "password": "pass123",
    "role": "patient"
  }'
```

### Register as Doctor
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Smith",
    "email": "doctor@test.com",
    "password": "pass123",
    "role": "doctor"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123"
  }'
```

### Admin: View Pending Doctors
```bash
curl -X GET http://localhost:3000/api/doctors/admin/pending \
  -H "Cookie: token=YOUR_TOKEN"
```

### Admin: Approve Doctor (ID=2)
```bash
curl -X PUT http://localhost:3000/api/doctors/admin/approve/2 \
  -H "Cookie: token=YOUR_TOKEN"
```

### View Approved Doctors
```bash
curl -X GET http://localhost:3000/api/doctors
```

### Book Appointment
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "doctor_id": 2,
    "date": "2024-04-15",
    "time": "10:30"
  }'
```

---

## ⚡ CREDENTIALS FOR TESTING

### Admin
- Email: `admin@hospital.com`
- Password: `admin123`
- Role: `admin`

---

## ⚡ DOCTOR STATUS VALUES

- `0` = Pending (cannot login)
- `1` = Approved (can login, handle appointments)
- `-1` = Rejected (cannot login)

---

## ⚡ SIMPLE FLOW

1. Patient registers → Can login immediately
2. Doctor registers → Cannot login (is_approved=0)
3. Admin approves doctor → Doctor can login
4. Approved doctor shows in list → Patient can book
5. Unapproved doctor cannot accept appointments

---

## ⚡ DATABASE ROLES

```
role = 'doctor'  → Must be approved (is_approved=1) to work
role = 'patient' → Always approved (is_approved=1)
role = 'admin'   → Always approved (is_approved=1)
```

---

## ⚡ USEFUL SQL QUERIES

### Check all users
```sql
SELECT * FROM users;
```

### Check pending doctors
```sql
SELECT * FROM users WHERE role='doctor' AND is_approved=0;
```

### Check approved doctors
```sql
SELECT * FROM users WHERE role='doctor' AND is_approved=1;
```

### Approve a doctor (ID=2)
```sql
UPDATE users SET is_approved=1 WHERE id=2;
```

### Check appointments
```sql
SELECT * FROM appointments;
```

---

**Done! You're ready to test.** 🚀
