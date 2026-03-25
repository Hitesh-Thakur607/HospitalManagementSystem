import React, { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";
import DoctorPage from "./pages/DoctorPage";
import PatientPage from "./pages/PatientPage";
import Toast from "./components/Toast";

function App() {
  const [toast, setToast] = useState({ message: "", type: "info" });

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "info" }), 2500);
  };

  return (
    <AuthProvider>
      <Toast message={toast.message} type={toast.type} />
      <Routes>
        <Route path="/login" element={<LoginPage showToast={showToast} />} />
        <Route path="/register" element={<RegisterPage showToast={showToast} />} />
        <Route path="/admin" element={<AdminPage showToast={showToast} />} />
        <Route path="/doctor" element={<DoctorPage showToast={showToast} />} />
        <Route path="/patient" element={<PatientPage showToast={showToast} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
