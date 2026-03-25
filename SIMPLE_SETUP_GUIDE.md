# Simplified Hospital System - Setup Guide

## System Overview
- **Two User Roles**: Doctor & Patient
- **At Registration**: Users choose to be Doctor or Patient
- **Doctor Approval**: Only admin can approve doctors to handle appointments
- **Patients**: Can immediately book appointments with approved doctors

---

## SQL COMMANDS TO SETUP DATABASE

### 1. Reset (Drop existing and create fresh)
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

### 6. Create Admin User (password hash for "admin123")
```sql
INSERT INTO users (name, email, password, role, is_approved, phone, address) 
VALUES ('System Admin', 'admin@hospital.com', '$2a$10$YIH.5cBQCaH1xPFsF5.rN.5vfPWcBEi0/fWqFfCBLW8KLLt2xWpXm', 'admin', 1, '+1111111111', 'Admin Office');
```

---

## QUICK START - API WORKFLOW

### Step 1️⃣: Register as Patient
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Patient",
    "email": "patient@hospital.com",
    "password": "pass123",
    "role": "patient",
    "phone": "+1234567890",
    "address": "123 Main St"
  }'
```
Response: Patient profile created automatically

### Step 2️⃣: Register as Doctor (Not approved yet)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Smith",
    "email": "doctor@hospital.com",
    "password": "pass123",
    "role": "doctor",
    "phone": "+1987654321",
    "address": "456 Medical Ave"
  }'
```
Response: Doctor profile created with **is_approved = 0** (pending)

### Step 3️⃣: Try to Login as Unapproved Doctor
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "pass123"
  }'
```
Response: **Status 403**: "Your doctor account is pending admin approval"

### Step 4️⃣: Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123"
  }'
```
Response: Get `token` cookie for admin actions

### Step 5️⃣: Admin Views Pending Doctors
```bash
curl -X GET http://localhost:3000/api/doctors/admin/pending \
  -H "Cookie: token=ADMIN_TOKEN_HERE"
```
Response: List of doctors waiting for approval

### Step 6️⃣: Admin Approves Doctor
```bash
curl -X PUT http://localhost:3000/api/doctors/admin/approve/3 \
  -H "Cookie: token=ADMIN_TOKEN_HERE"
```
Response: "Doctor approved successfully. Can now handle appointments."

### Step 7️⃣: Doctor Can Now Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "pass123"
  }'
```
Response: Login successful! Token granted.

### Step 8️⃣: Admin Updates Doctor Profile (Add Details)
```bash
curl -X PUT http://localhost:3000/api/doctors/3 \
  -H "Content-Type: application/json" \
  -H "Cookie: token=ADMIN_TOKEN_HERE" \
  -d '{
    "department": "Cardiology",
    "biography": "Experienced cardiologist with 15+ years",
    "qualifications": "MD, Board Certified",
    "experience_years": 15,
    "specialization": "Heart Diseases"
  }'
```

### Step 9️⃣: Patient Books Appointment with Approved Doctor
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 3,
    "doctor_id": 3,
    "date": "2024-04-15",
    "time": "14:30"
  }'
```
Response: "Appointment booked successfully"

### Step 🔟: Patient Tries to Book with Unapproved Doctor (Fails)
```bash
# Try to book with an unapproved doctor
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 3,
    "doctor_id": 4,
    "date": "2024-04-15",
    "time": "14:30"
  }'
```
Response: **Status 403**: "Doctor is not approved to handle appointments"

---

## 📋 API ENDPOINTS

### Authentication (Public)
- `POST /api/auth/register` - Register as doctor or patient
- `POST /api/auth/login` - Login and get token

### Doctors (Public)
- `GET /api/doctors` - Get all **approved** doctors

### Doctors (Admin Only)
- `GET /api/doctors/admin/all` - View all doctors with approval status
- `GET /api/doctors/admin/pending` - View doctors pending approval
- `PUT /api/doctors/admin/approve/:id` - Approve doctor for appointments
- `PUT /api/doctors/admin/reject/:id` - Reject doctor
- `PUT /api/doctors/:id` - Update doctor profile details

### Patients (Public)
- `GET /api/patients` - Get all patients
- `PUT /api/patients/:id` - Update patient profile

### Appointments (Public)
- `POST /api/appointments` - Book appointment (checks doctor approval)
- `GET /api/appointments` - Get all appointments

---

## 🔄 Doctor Status Flow

```
REGISTRATION
    ↓
Doctor registers (role='doctor')
    ↓
is_approved = 0 (PENDING)
    ↓
Cannot Login ❌
    ↓
Admin approves (PUT /doctors/admin/approve/:id)
    ↓
is_approved = 1 (APPROVED) ✅
    ↓
Can Login ✅
    ↓
Can Accept Appointments ✅
```

Or if Rejected:
```
is_approved = -1 (REJECTED)
    ↓
Cannot Login ❌
    ↓
Cannot Accept Appointments ❌
```

---

## 📊 Database Schema Summary

### users table
```
id: INT (PK)
name: VARCHAR(100)
email: VARCHAR(255) UNIQUE
password: VARCHAR(255)
role: ENUM('doctor', 'patient', 'admin')
is_approved: INT (0=pending, 1=approved, -1=rejected)
phone: VARCHAR(30)
address: VARCHAR(255)
specialization: VARCHAR(100) [for doctors]
created_at: TIMESTAMP
```

### doctor table
```
id: INT (PK)
user_id: INT (FK)
department: VARCHAR(120)
biography: TEXT
qualifications: VARCHAR(255)
experience_years: INT
image: TEXT [Cloudinary URL]
approved_by: INT (FK - admin who approved)
approved_at: TIMESTAMP
created_at: TIMESTAMP
```

### patients table
```
id: INT (PK)
user_id: INT (FK) UNIQUE
age: INT
gender: VARCHAR(20)
medical_history: TEXT
created_at: TIMESTAMP
```

### appointments table
```
id: INT (PK)
patient_id: INT (FK)
doctor_id: INT (FK)
appointment_date: VARCHAR(30)
appointment_time: VARCHAR(30)
status: ENUM('booked', 'completed', 'cancelled')
created_at: TIMESTAMP
```

---

## ✅ Testing Checklist

- [ ] Create admin user
- [ ] Admin can login
- [ ] Patient can register and login
- [ ] Doctor registers (cannot login - pending)
- [ ] Admin views pending doctors
- [ ] Admin approves doctor
- [ ] Doctor can now login
- [ ] Patient can see all approved doctors
- [ ] Patient books appointment with approved doctor
- [ ] Appointment booking fails with unapproved doctor
- [ ] Admin can update doctor profile
- [ ] Admin can reject doctors

---

## Key Differences from Previous System

| Aspect | Old System | New System |
|--------|-----------|-----------|
| Doctor Registration | Need user_id + separate profile | Direct during registration |
| Doctor Table | Separate from users | Linked via user_id |
| Approval Field | doctor.status (pending/approved/rejected) | users.is_approved (0/1/-1) |
| Doctor Login | Always allowed | Blocked if not approved |
| Simplicity | Complex admin workflow | Simple role selection |

---

## Password Hashes for Testing

These are bcrypt hashed passwords you can use:
- **"admin123"**: `$2a$10$YIH.5cBQCaH1xPFsF5.rN.5vfPWcBEi0/fWqFfCBLW8KLLt2xWpXm`
- **"pass123"**: `$2a$10$YIH.5cBQCaH1xPFsF5.rN.5vfPWcBEi0/fWqFfCBLW8KLLt2xWpXm`

---

**System Ready to Deploy! 🚀**
