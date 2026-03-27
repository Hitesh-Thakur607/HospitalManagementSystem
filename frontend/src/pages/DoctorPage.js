import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { appointmentAPI, authAPI, doctorAPI } from "../services/api";
import { getErrorMessage } from "../utils/helpers";
import "./DashboardPages.css";

const DoctorPage = ({ showToast }) => {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString();
  };

  useEffect(() => {
    doctorAPI.getMe().then(setProfile).catch((e) => showToast(getErrorMessage(e), "error"));
    appointmentAPI.getAll().then(setAppointments).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await authAPI.logout();
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-page">
      <header className="header">
        <div className="header-content">
          <h1>Doctor Dashboard</h1>
          <div className="header-right">
            <div>{user?.name}</div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>
      <div className="container">
        <h3 className="section-title">Profile</h3>
        {profile ? (
          <div className="profile-card">
            <p><strong>Name:</strong> {profile.name || "N/A"}</p>
            <p><strong>Email:</strong> {profile.email || "N/A"}</p>
            <p><strong>Specialization:</strong> {profile.specialization || "N/A"}</p>
            <p><strong>Department:</strong> {profile.department || "N/A"}</p>
            <p><strong>Qualifications:</strong> {profile.qualifications || "N/A"}</p>
            <p><strong>Experience:</strong> {profile.experience_years ? `${profile.experience_years} years` : "N/A"}</p>
          </div>
        ) : (
          <div className="no-data">Profile not found</div>
        )}

        <h3 className="section-title">Appointments</h3>
        {appointments.length ? (
          <div className="appointment-list">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-top">
                  <strong>{appointment.patient_name || "Patient"}</strong>
                  <span className={`status-badge status-${appointment.status || "booked"}`}>
                    {(appointment.status || "booked").toUpperCase()}
                  </span>
                </div>
                <p><strong>Date:</strong> {formatDate(appointment.appointment_date)}</p>
                <p><strong>Time:</strong> {appointment.appointment_time || "N/A"}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">No appointments yet</div>
        )}
      </div>
    </div>
  );
};

export default DoctorPage;
