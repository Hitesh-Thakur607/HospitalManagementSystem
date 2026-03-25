import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { appointmentAPI, authAPI, doctorAPI } from "../services/api";
import { getErrorMessage } from "../utils/helpers";
import "./DashboardPages.css";

const PatientPage = ({ showToast }) => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

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
        <h3>Available Doctors</h3>
        <pre>{JSON.stringify(doctors, null, 2)}</pre>
        <h3>Your Appointments</h3>
        <pre>{JSON.stringify(appointments, null, 2)}</pre>
      </div>
    </div>
  );
};

export default PatientPage;
