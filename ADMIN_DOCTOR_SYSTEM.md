# Hospital Management System - Admin Doctor Approval System

## Overview
This system implements an admin-only doctor management workflow:
- **Admins** create/upload doctor profiles and approve them
- **Doctors** cannot perform appointments until their profile is approved by admin
- **Pending doctors** have a "pending" status until admin reviews them
- **Approved doctors** get "approved" status and can accept appointments

---

## Setup Instructions

### 1. Update Database
Run the updated schema to add new fields to the `doctor` table:
```sql
ALTER TABLE doctor ADD COLUMN user_id INT NOT NULL;
ALTER TABLE doctor ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE doctor ADD COLUMN verified_by INT;
ALTER TABLE doctor ADD COLUMN verified_at TIMESTAMP NULL;
ALTER TABLE doctor ADD CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE doctor ADD CONSTRAINT fk_doctor_verified_by FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL;
```

### 2. Create Admin User
Register an admin account:
```json
POST /auth/register
{
  "name": "Admin Name",
  "email": "admin@hospital.com",
  "password": "admin_password",
  "role": "admin"
}
```

### 3. Create Doctor User (Pre-registration)
First, create a user account with doctor role:
```json
POST /auth/register
{
  "name": "Dr. John Doe",
  "email": "doctor@hospital.com",
  "password": "doctor_password",
  "role": "doctor"
}
```
This returns a user ID needed for step 4.

---

## Workflow

### Step 1: Doctor User Registers
- Doctor creates an account with role = "doctor"
- Doctor gets user_id (e.g., 5)
- Doctor initially cannot do anything except view their profile

### Step 2: Admin Uploads Doctor Profile
Admin (authenticated) uploads doctor information:
```json
POST /doctor
Headers: Authorization: Bearer {admin_token}
{
  "user_id": 5,
  "first_name": "John",
  "last_name": "Doe",
  "email": "doctor@hospital.com",
  "dob": "1985-05-15",
  "gender": "male",
  "address": "123 Medical St, City",
  "phone": "+1234567890",
  "department": "Cardiology",
  "biography": "Experienced cardiologist with 15 years of practice",
  "image": "base64_image_or_url"
}
```
Response:
```json
{
  "message": "Doctor registered with pending status. Awaiting admin approval.",
  "status": "pending"
}
```

### Step 3: Admin Reviews Pending Doctors
Admin views all pending doctor approvals:
```json
GET /doctor/admin/pending
Headers: Authorization: Bearer {admin_token}
```

### Step 4: Admin Approves Doctor
Once verified, admin approves the doctor:
```json
PUT /doctor/admin/approve/1
Headers: Authorization: Bearer {admin_token}
```
Response:
```json
{
  "message": "Doctor approved successfully",
  "status": "approved"
}
```

### Step 5: Doctor Can Now Accept Appointments
After approval, appointments can be booked with this doctor:
```json
POST /appointment
{
  "patient_id": 2,
  "doctor_id": 1,
  "date": "2024-03-25",
  "time": "10:30"
}
```

---

## API Endpoints

### Public Endpoints
- `GET /doctor` - Get all **approved** doctors only

### Admin Only Endpoints
- `POST /doctor` - Upload doctor profile (status: pending)
- `GET /doctor/admin/all` - View all doctors with status
- `GET /doctor/admin/pending` - View pending doctor approvals
- `PUT /doctor/admin/approve/:id` - Approve doctor registration
- `PUT /doctor/admin/reject/:id` - Reject doctor registration
- `PUT /doctor/:id` - Update doctor info (only approved doctors)

---

## Status Flow Diagram

```
User Registration (doctor role)
    ↓
Admin Uploads Profile (status: pending)
    ↓
Admin Reviews in /doctor/admin/pending
    ↓
Admin Approves (/doctor/admin/approve/:id) → Status: approved
    ↓
Doctor Can Accept Appointments
```

Or if rejected:
```
Status: rejected
    ↓
Doctor Cannot Accept Appointments
```

---

## Database Schema Updates

### users table
```sql
- id: INT (primary key)
- name: VARCHAR(100)
- email: VARCHAR(255) UNIQUE
- password: VARCHAR(255)
- role: ENUM('admin', 'doctor', 'receptionist', 'patient')
- created_at: TIMESTAMP
```

### doctor table (UPDATED)
```sql
- id: INT (primary key)
- user_id: INT (foreign key to users)
- first_name: VARCHAR(120)
- last_name: VARCHAR(120)
- email: VARCHAR(255) UNIQUE
- dob: VARCHAR(30)
- gender: VARCHAR(20)
- address: VARCHAR(255)
- phone: VARCHAR(30)
- image: TEXT (Cloudinary URL)
- department: VARCHAR(120)
- biography: TEXT
- status: ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
- verified_by: INT (foreign key to users - admin who verified)
- verified_at: TIMESTAMP NULL
- created_at: TIMESTAMP
```

---

## Key Features

✅ **Admin-Only Doctor Creation**
- Only users with admin role can upload doctor profiles
- Accessible via `/doctor` POST endpoint with verifyAdmin middleware

✅ **Pending Status Before Approval**
- New doctors start with "pending" status
- Cannot perform actions until approved

✅ **Appointment Protection**
- Appointments can only be booked with "approved" doctors
- System checks doctor status before allowing appointment

✅ **Admin Audit Trail**
- `verified_by` field tracks which admin approved the doctor
- `verified_at` timestamp records when approval happened

✅ **Doctor Update Control**
- Only approved doctors' information can be updated
- Admin can update but only for approved doctors

---

## Error Handling

- `401 Unauthorized` - No token provided
- `403 Forbidden` - User is not admin
- `404 Not Found` - Doctor not found or not approved
- `400 Bad Request` - Missing required fields

---

## Testing Workflow

### 1. Create Admin User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hospital Admin",
    "email": "admin@hospital.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 2. Login as Admin
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123"
  }'
# Save the auth token from response
```

### 3. Create Doctor User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sarah Smith",
    "email": "dr.smith@hospital.com",
    "password": "doctor123",
    "role": "doctor"
  }'
# Save the user_id from response (usually in users table)
```

### 4. Upload Doctor Profile (as Admin)
```bash
curl -X POST http://localhost:3000/doctor \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken={admin_token}" \
  -d '{
    "user_id": 1,
    "first_name": "Sarah",
    "last_name": "Smith",
    "email": "dr.smith@hospital.com",
    "department": "Neurology",
    "biography": "Expert in neurological disorders"
  }'
```

### 5. Approve Doctor (as Admin)
```bash
curl -X PUT http://localhost:3000/doctor/admin/approve/1 \
  -H "Cookie: authToken={admin_token}"
```

### 6. Now Doctor Can Accept Appointments
```bash
curl -X POST http://localhost:3000/appointment \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "doctor_id": 1,
    "date": "2024-03-25",
    "time": "10:30"
  }'
```

---

## Summary of Changes

### Files Modified:
1. **sql/setup_schema.sql** - Added status, user_id, verified_by, verified_at to doctor table
2. **controllers/authController.js** - Added role validation
3. **controllers/doctorController.js** - Admin-only uploads, approval system, pending status
4. **controllers/appointmentController.js** - Check doctor approval before booking
5. **routes/doctorRoutes.js** - New admin endpoints
6. **middleware/verifyAdmin.js** - NEW: Admin verification middleware

### New Middleware:
- `verifyAdmin.js` - Ensures only admins can access certain endpoints

### New Controller Methods:
- `getAllDoctorsWithStatus()` - View all doctors with status
- `getPendingDoctors()` - View pending approvals
- `approveDoctor()` - Approve doctor for appointments
- `rejectDoctor()` - Reject doctor registration
- `updateDoctor()` - Update approved doctor info (admin only)

---

## Security Notes
- Only admins can create/update doctor profiles
- Doctors cannot perform actions until admin approves them
- Audit trail shows which admin approved each doctor
- Rejecting a doctor prevents them from services without re-approval
