# Hospital Management System - React Frontend

Modern, clean React frontend for the Hospital Management System built with React, React Router, and Axios.

## Features

- **Authentication**: Secure login/register for patients and doctors
- **Admin Dashboard**: Manage doctors, approve/reject registrations
- **Doctor Dashboard**: Profile management and appointment tracking
- **Patient Dashboard**: Browse doctors, book appointments
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Role-Based Access**: Different interfaces for admin, doctor, and patient roles

## Project Structure

```
frontend/
├── public/
│   └── index.html          # HTML entry point
├── src/
│   ├── components/         # Reusable components
│   │   ├── AppointmentCard.js
│   │   ├── DoctorCard.js
│   │   └── Toast.js
│   ├── context/            # Context API for state
│   │   └── AuthContext.js
│   ├── pages/              # Page components
│   │   ├── LoginPage.js
│   │   ├── RegisterPage.js
│   │   ├── AdminPage.js
│   │   ├── DoctorPage.js
│   │   └── PatientPage.js
│   ├── services/           # API calls
│   │   └── api.js
│   ├── utils/              # Helper functions
│   │   └── helpers.js
│   ├── App.js              # Main app with routing
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
├── .env                    # Environment configuration
├── .gitignore              # Git ignore file
└── package.json            # Dependencies and scripts
```

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Ensure the backend is running on `http://localhost:5000`

## Running the App

Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Building for Production

Create an optimized production build:
```bash
npm run build
```

## Environment Variables

Check `.env` file:
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5000/api)

## Usage

### Admin
- Login with admin credentials
- View all doctors
- Approve or reject doctor registrations
- Manage platform settings

### Doctor
- Register as a doctor
- Wait for admin approval
- Update profile information
- View and manage appointments

### Patient
- Register as a patient
- Browse approved doctors
- Book appointments
- Manage your appointments

## Technologies Used

- **React 18** - UI framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management
- **CSS** - Styling

## Notes

- Authentication tokens are stored in cookies (httpOnly)
- All API calls require authentication
- Doctors can only see their own profile
- Patients can see only approved doctors
- Admin has full access to all data
