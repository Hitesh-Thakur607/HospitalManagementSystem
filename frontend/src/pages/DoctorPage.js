import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { appointmentAPI, authAPI, doctorAPI } from "../services/api";
import { getErrorMessage } from "../utils/helpers";
import styles from "./DashboardPages.module.css";

const cx = (...names) => names.map((name) => styles[name]).filter(Boolean).join(" ");

const DoctorPage = ({ showToast }) => {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    specialization: "",
    department: "",
    qualifications: "",
    experience_years: "",
    biography: "",
    image: "",
  });
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString();
  };

  useEffect(() => {
    doctorAPI
      .getMe()
      .then((data) => {
        setProfile(data);
        setEditForm({
          specialization: data.specialization || "",
          department: data.department || "",
          qualifications: data.qualifications || "",
          experience_years: data.experience_years || "",
          biography: data.biography || "",
          image: data.image || "",
        });
      })
      .catch((e) => showToast(getErrorMessage(e), "error"));
    appointmentAPI.getAll().then(setAppointments).catch(() => {});
  }, []);

  const refreshAppointments = async () => {
    try {
      const data = await appointmentAPI.getAll();
      setAppointments(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      await appointmentAPI.complete(appointmentId);
      showToast("Appointment marked completed", "success");
      refreshAppointments();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await doctorAPI.updateMe({
        specialization: editForm.specialization,
        department: editForm.department,
        qualifications: editForm.qualifications,
        experience_years: editForm.experience_years,
        biography: editForm.biography,
        image: editForm.image,
      });

      const latestProfile = await doctorAPI.getMe();
      setProfile(latestProfile);
      setEditForm({
        specialization: latestProfile.specialization || "",
        department: latestProfile.department || "",
        qualifications: latestProfile.qualifications || "",
        experience_years: latestProfile.experience_years || "",
        biography: latestProfile.biography || "",
        image: latestProfile.image || "",
      });

      setActiveTab("profile");
      showToast("Profile updated successfully", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSaving(false);
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
          <h1>Doctor Dashboard</h1>
          <div className={styles["header-right"]}>
            <div className={styles["user-info"]}>Logged in as <strong>{user?.name}</strong> ({user?.role})</div>
            <button className={styles["logout-btn"]} onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>
      <div className={styles.container}>
        <div className={styles["page-content"]}>
          <div className={styles.tabs}>
            <button className={cx("tab-btn", activeTab === "profile" ? "active" : "")} onClick={() => setActiveTab("profile")}>View Profile</button>
            <button className={cx("tab-btn", activeTab === "edit" ? "active" : "")} onClick={() => setActiveTab("edit")}>Edit Profile</button>
            <button className={cx("tab-btn", activeTab === "appointments" ? "active" : "")} onClick={() => setActiveTab("appointments")}>Appointments ({appointments.length})</button>
          </div>

          {activeTab === "profile" ? (
            <>
              <h3 className={styles["section-title"]}>My Profile</h3>
              {profile ? (
                <div className={styles["profile-view"]}>
                  <div className={styles["profile-header"]}>
                    {profile.image ? (
                      <img src={profile.image} alt={profile.name || "Doctor"} className={styles["profile-image"]} />
                    ) : (
                      <div className={styles["profile-image-fallback"]}>{(profile.name || "D").charAt(0).toUpperCase()}</div>
                    )}
                    <div className={styles["profile-info"]}>
                      <h3>{profile.name || "N/A"}</h3>
                      <p className={styles.email}>{profile.email || "N/A"}</p>
                      <p className={styles.phone}>{profile.phone || "N/A"}</p>
                      <div className={cx("status", profile.is_approved === 1 ? "approved" : profile.is_approved === -1 ? "rejected" : "pending")}>
                        Status: {profile.is_approved === 1 ? "Approved" : profile.is_approved === -1 ? "Rejected" : "Pending"}
                      </div>
                    </div>
                  </div>

                  <div className={styles["profile-details"]}>
                    <div className={styles["detail-group"]}>
                      <label>Specialization:</label>
                      <p>{profile.specialization || "N/A"}</p>
                    </div>
                    <div className={styles["detail-group"]}>
                      <label>Department:</label>
                      <p>{profile.department || "N/A"}</p>
                    </div>
                    <div className={styles["detail-group"]}>
                      <label>Qualifications:</label>
                      <p>{profile.qualifications || "N/A"}</p>
                    </div>
                    <div className={styles["detail-group"]}>
                      <label>Years of Experience:</label>
                      <p>{profile.experience_years ? `${profile.experience_years}` : "N/A"}</p>
                    </div>
                    <div className={styles["detail-group"]}>
                      <label>Address:</label>
                      <p>{profile.address || "N/A"}</p>
                    </div>
                    <div className={styles["detail-group"]}>
                      <label>Biography:</label>
                      <p>{profile.biography || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles["no-data"]}>Profile not found</div>
              )}
            </>
          ) : activeTab === "edit" ? (
            <>
              <h3 className={styles["section-title"]}>Edit Profile</h3>
              <form className={styles["profile-edit-form"]} onSubmit={handleSaveProfile}>
                <div className={styles["form-grid"]}>
                  <div className={styles["form-group"]}>
                    <label>Specialization</label>
                    <input
                      value={editForm.specialization}
                      onChange={(e) => handleEditChange("specialization", e.target.value)}
                      placeholder="e.g. Cardiologist"
                    />
                  </div>

                  <div className={styles["form-group"]}>
                    <label>Department</label>
                    <input
                      value={editForm.department}
                      onChange={(e) => handleEditChange("department", e.target.value)}
                      placeholder="e.g. Heart Care"
                    />
                  </div>

                  <div className={styles["form-group"]}>
                    <label>Qualifications</label>
                    <input
                      value={editForm.qualifications}
                      onChange={(e) => handleEditChange("qualifications", e.target.value)}
                      placeholder="e.g. MBBS, MD"
                    />
                  </div>

                  <div className={styles["form-group"]}>
                    <label>Years of Experience</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.experience_years}
                      onChange={(e) => handleEditChange("experience_years", e.target.value)}
                      placeholder="e.g. 8"
                    />
                  </div>

                  <div className={cx("form-group", "form-group-full")}>
                    <label>Profile Image URL</label>
                    <input
                      value={editForm.image}
                      onChange={(e) => handleEditChange("image", e.target.value)}
                      placeholder="Paste image URL"
                    />
                  </div>

                  <div className={cx("form-group", "form-group-full")}>
                    <label>Biography</label>
                    <textarea
                      value={editForm.biography}
                      onChange={(e) => handleEditChange("biography", e.target.value)}
                      placeholder="Write a short professional bio"
                      rows={4}
                    />
                  </div>
                </div>

                <div className={styles["button-group"]}>
                  <button className={styles["btn-primary"]} type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Profile"}
                  </button>
                  <button className={styles["btn-secondary"]} type="button" onClick={() => setActiveTab("profile")}>Cancel</button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h3 className={styles["section-title"]}>Appointments</h3>
              {appointments.length ? (
                <div className={styles["appointment-list"]}>
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className={styles["appointment-card"]}>
                      <div className={styles["appointment-header"]}>
                        <div className={styles["appointment-date-time"]}>
                          <div className={styles["appointment-date"]}>{formatDate(appointment.appointment_date)}</div>
                          <div className={styles["appointment-time"]}>{appointment.appointment_time || "N/A"}</div>
                        </div>
                        <span className={cx("status-badge", `status-${appointment.status || "booked"}`)}>
                          {appointment.status || "booked"}
                        </span>
                      </div>

                      <div className={styles["appointment-body"]}>
                        <p><strong>Patient:</strong> {appointment.patient_name || "Patient"}</p>
                      </div>

                      <div className={styles["appointment-actions"]}>
                        {appointment.status === "booked" ? (
                          <button className={styles["btn-complete"]} onClick={() => handleCompleteAppointment(appointment.id)}>
                            Mark Completed
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles["no-data"]}>No appointments yet</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPage;
