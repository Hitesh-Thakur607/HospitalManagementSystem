import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorCard from "../components/DoctorCard";
import { AuthContext } from "../context/AuthContext";
import { doctorAPI, authAPI } from "../services/api";
import { getErrorMessage } from "../utils/helpers";
import styles from "./DashboardPages.module.css";

const cx = (...names) => names.map((name) => styles[name]).filter(Boolean).join(" ");

const AdminPage = ({ showToast }) => {
  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorAPI.getAdminAll();
      setDoctors(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingDoctors = async () => {
    try {
      const data = await doctorAPI.getPending();
      setPendingDoctors(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadDoctors();
    loadPendingDoctors();
  }, []);

  const handleApprove = async (doctorId) => {
    try {
      await doctorAPI.approve(doctorId);
      showToast("Doctor approved successfully!", "success");
      loadDoctors();
      loadPendingDoctors();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const handleReject = async (doctorId) => {
    const reason = window.prompt("Reason for rejection (optional):");
    if (reason !== null) {
      try {
        await doctorAPI.reject(doctorId, reason);
        showToast("Doctor rejected successfully!", "success");
        loadDoctors();
        loadPendingDoctors();
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      }
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    logout();
    navigate("/login");
  };

  return (
    <div className={styles["dashboard-page"]}>
      <header className={styles.header}>
        <div className={styles["header-content"]}>
          <h1>Admin Dashboard</h1>
          <div className={styles["header-right"]}>
            <div className={styles["user-info"]}>Logged in as <strong>{user?.name}</strong> ({user?.role})</div>
            <button className={styles["logout-btn"]} onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles["page-content"]}>
          <div className={styles.tabs}>
            <button className={cx("tab-btn", activeTab === "all" ? "active" : "")} onClick={() => setActiveTab("all")}>All Doctors ({doctors.length})</button>
            <button className={cx("tab-btn", activeTab === "pending" ? "active" : "")} onClick={() => setActiveTab("pending")}>Pending Approval ({pendingDoctors.length})</button>
          </div>

          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : activeTab === "all" ? (
            doctors.length ? (
              doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} isAdmin={true} showApprovalStatus={true} onApprove={handleApprove} onReject={handleReject} />
              ))
            ) : (
              <div className={styles["no-data"]}>No doctors found</div>
            )
          ) : pendingDoctors.length ? (
            pendingDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} isAdmin={true} onApprove={handleApprove} onReject={handleReject} />
            ))
          ) : (
            <div className={styles["no-data"]}>No pending approvals</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
