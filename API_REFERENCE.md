# Admin Doctor System - Quick API Reference

## Public Endpoints

### Get All Approved Doctors
```
GET /api/doctors
Response: Array of doctors with status = "approved"
```

---

## Admin Only Endpoints (Requires Admin Authentication)

### Upload New Doctor Profile
```
POST /api/doctors
Headers: 
  - Cookie: token={admin_token}

Body:
{
  "user_id": 1,                    // Required: ID of user with doctor role
  "first_name": "John",
  "last_name": "Doe",
  "email": "doctor@hospital.com",
  "dob": "1985-05-15",
  "gender": "male",
  "address": "123 Medical Street",
  "phone": "+1234567890",
  "image": "base64_or_url",        // Optional
  "department": "Cardiology",
  "biography": "Expert cardiologist with 15+ years experience"
}

Response:
{
  "message": "Doctor registered with pending status. Awaiting admin approval.",
  "status": "pending"
}
```

### View All Doctors (with status)
```
GET /api/doctors/admin/all
Headers: Cookie: token={admin_token}

Response: Array of all doctors with their status (pending/approved/rejected)
```

### View Pending Doctor Approvals
```
GET /api/doctors/admin/pending
Headers: Cookie: token={admin_token}

Response: Array of doctors with status = "pending"
```

### Approve Doctor Registration
```
PUT /api/doctors/admin/approve/{doctorId}
Headers: Cookie: token={admin_token}

Response:
{
  "message": "Doctor approved successfully",
  "status": "approved"
}

Result:
- Doctor status changes to "approved"
- verified_by = admin_id
- verified_at = current timestamp
- Doctor can now accept appointments
```

### Reject Doctor Registration
```
PUT /api/doctors/admin/reject/{doctorId}
Headers: Cookie: token={admin_token}

Body:
{
  "reason": "Does not meet qualifications"  // Optional
}

Response:
{
  "message": "Doctor rejected. Reason: Does not meet qualifications",
  "status": "rejected"
}

Result:
- Doctor status changes to "rejected"
- verified_by = admin_id
- verified_at = current timestamp
- Doctor cannot perform appointments
```

### Update Doctor Information
```
PUT /api/doctors/{doctorId}
Headers: Cookie: token={admin_token}

Body: (Any fields can be updated)
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "newemail@hospital.com",
  "phone": "+1234567890",
  "department": "Neurology",
  "biography": "Updated bio"
}

Note: Only works for doctors with status = "approved"
```

---

## Doctor Status Workflow

```
PENDING (Initial State)
  ↓
  ├─→ Admin Approves → APPROVED ✓ (Can accept appointments)
  │
  └─→ Admin Rejects → REJECTED ✗ (Cannot accept appointments)
```

---

## Appointment Booking (Public)

### Book Appointment with Doctor
```
POST /api/appointments
Body:
{
  "patient_id": 1,
  "doctor_id": 1,
  "date": "2024-03-25",
  "time": "10:30"
}

Success Response:
{
  "message": "Appointment booked successfully"
}

Error (if doctor not approved):
{
  "message": "Cannot book appointment. Doctor is not approved or does not exist."
}
```

---

## Testing Example Flow

### Step 1: Register Admin
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hospital Admin",
    "email": "admin@hospital.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### Step 2: Login Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123"
  }'
# Save authToken from response
```

### Step 3: Register Doctor User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Smith",
    "email": "dr.smith@hospital.com",
    "password": "doctor123",
    "role": "doctor"
  }'
# Note: Get user_id from database or response
```

### Step 4: Admin Creates Doctor Profile
```bash
curl -X POST http://localhost:3000/api/doctors \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "user_id": 1,
    "first_name": "Smith",
    "last_name": "Johnson",
    "email": "dr.smith@hospital.com",
    "dob": "1980-03-15",
    "gender": "male",
    "address": "123 Medical Street",
    "phone": "+1234567890",
    "department": "Cardiology",
    "biography": "Specialist in heart diseases"
  }'
```

### Step 5: View Pending Approvals
```bash
curl -X GET http://localhost:3000/api/doctors/admin/pending \
  -H "Cookie: authToken=YOUR_ADMIN_TOKEN_HERE"
```

### Step 6: Approve Doctor
```bash
curl -X PUT http://localhost:3000/api/doctors/admin/approve/1 \
  -H "Cookie: authToken=YOUR_ADMIN_TOKEN_HERE"
```

### Step 7: Now Patients Can Book Appointments
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "doctor_id": 1,
    "date": "2024-03-25",
    "time": "10:30"
  }'
```

---

## Error Codes

| Code | Error | Cause |
|------|-------|-------|
| 400 | Bad Request | Missing required fields (e.g., user_id) |
| 401 | Unauthorized | No auth token provided |
| 403 | Forbidden | User is not admin |
| 404 | Not Found | Doctor not found or doctor not approved |
| 500 | Server Error | Database error or image upload failed |

---

## Important Notes

1. **User vs Doctor**: A "user" is registered with role "doctor", then an "admin" creates the doctor profile
2. **Status Matters**: Appointments can ONLY be booked with doctors having status = "approved"
3. **Audit Trail**: `verified_by` shows which admin approved, `verified_at` shows when
4. **Image Upload**: Supports Cloudinary base64 uploads
