import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorCard from "../components/DoctorCard";
import { AuthContext } from "../context/AuthContext";
import { appointmentAPI, authAPI, doctorAPI } from "../services/api";
import { getErrorMessage } from "../utils/helpers";
import "./DashboardPages.css";

const PatientPage = ({ showToast }) => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString();
  };

  useEffect(() => {
    doctorAPI.getAll().then(setDoctors).catch((e) => showToast(getErrorMessage(e), "error"));
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
          <h1>Patient Dashboard</h1>
          <div className="header-right">
            <div>{user?.name}</div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>
      <div className="container">
        <h3 className="section-title">Available Doctors</h3>
        {doctors.length ? (
          <div className="doctor-grid">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <div className="no-data">No approved doctors available</div>
        )}

        <h3 className="section-title">Your Appointments</h3>
        {appointments.length ? (
          <div className="appointment-list">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-top">
                  <strong>{appointment.doctor_name || "Doctor"}</strong>
                  <span className={`status-badge status-${appointment.status || "booked"}`}>
                    {(appointment.status || "booked").toUpperCase()}
                  </span>
                </div>
                <p><strong>Department:</strong> {appointment.department || "N/A"}</p>
                <p><strong>Date:</strong> {formatDate(appointment.appointment_date)}</p>
                <p><strong>Time:</strong> {appointment.appointment_time || "N/A"}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">No appointments booked yet</div>
        )}
      </div>
    </div>
  );
};

export default PatientPage;
