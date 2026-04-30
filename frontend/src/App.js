import React, { useContext, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";
import DoctorPage from "./pages/DoctorPage";
import PatientPage from "./pages/PatientPage";
import Toast from "./components/Toast";

const ProtectedRoute = ({ roles, children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

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
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPage showToast={showToast} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor"
          element={
            <ProtectedRoute roles={["doctor"]}>
              <DoctorPage showToast={showToast} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient"
          element={
            <ProtectedRoute roles={["patient"]}>
              <PatientPage showToast={showToast} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
