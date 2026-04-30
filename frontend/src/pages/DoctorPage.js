import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatPanel from "../components/ChatPanel";
import { AuthContext } from "../context/AuthContext";
import { appointmentAPI, authAPI, doctorAPI, patientAPI } from "../services/api";
import { getErrorMessage } from "../utils/helpers";
import styles from "./DashboardPages.module.css";

const cx = (...names) => names.map((name) => styles[name]).filter(Boolean).join(" ");
const MAX_IMAGE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read selected image"));
    reader.readAsDataURL(file);
  });

const DoctorPage = ({ showToast }) => {
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
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

  const isProfileComplete =
    Boolean(profile?.department) &&
    Boolean(profile?.biography) &&
    Boolean(profile?.qualifications) &&
    profile?.experience_years !== null &&
    profile?.experience_years !== undefined &&
    profile?.experience_years !== "";

  const readyPatients = patients.filter((patient) => {
    return Boolean(patient.age) && Boolean(patient.gender);
  });

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString();
  };

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [doctorProfile, doctorAppointments, patientList] = await Promise.all([doctorAPI.getMe(), appointmentAPI.getAll(), patientAPI.getAll()]);

        if (!active) return;

        setProfile(doctorProfile);
        setImagePreview(doctorProfile.image || "");
        setEditForm({
          specialization: doctorProfile.specialization || "",
          department: doctorProfile.department || "",
          qualifications: doctorProfile.qualifications || "",
          experience_years: doctorProfile.experience_years || "",
          biography: doctorProfile.biography || "",
          image: doctorProfile.image || "",
        });
        setAppointments(Array.isArray(doctorAppointments) ? doctorAppointments : []);
        setPatients(Array.isArray(patientList) ? patientList : []);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    if (profile && !isProfileComplete) {
      setActiveTab("edit");
    }
  }, [profile, isProfileComplete]);

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

    if (field === "image") {
      setSelectedImageFile(null);
      setImagePreview(value);
    }
  };

  const handleImageFileChange = async (event) => {
    const selectedFile = event.target.files && event.target.files[0];
    if (!selectedFile) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(selectedFile.type)) {
      showToast("Please upload a valid image file (JPG, PNG, WEBP, GIF)", "error");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      showToast(`Image must be smaller than ${MAX_IMAGE_SIZE_MB} MB`, "error");
      event.target.value = "";
      return;
    }

    try {
      const previewDataUrl = await fileToDataUrl(selectedFile);
      setSelectedImageFile(selectedFile);
      setImagePreview(previewDataUrl);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      event.target.value = "";
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append("specialization", editForm.specialization);
      payload.append("department", editForm.department);
      payload.append("qualifications", editForm.qualifications);
      payload.append("experience_years", editForm.experience_years);
      payload.append("biography", editForm.biography);

      if (selectedImageFile) {
        payload.append("image", selectedImageFile);
      } else if (editForm.image.trim()) {
        payload.append("imageUrl", editForm.image.trim());
      }

      await doctorAPI.updateMe(payload);

      const latestProfile = await doctorAPI.getMe();
      setProfile(latestProfile);
      setSelectedImageFile(null);
      setImagePreview(latestProfile.image || "");
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

  const openPatientChat = (patientId, patientName) => {
    if (!patientId) return;

    setSelectedPatient({ id: patientId, name: patientName || "Patient" });
    setActiveTab("chat");
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
          {!isProfileComplete ? (
            <div className={styles["profile-banner"]}>
              <div>
                <strong>Complete your doctor profile to unlock appointments and chat.</strong>
                <p>Fill department, qualifications, biography, and experience. Approved doctors only can chat.</p>
              </div>
              <button className={styles["btn-primary"]} type="button" onClick={() => setActiveTab("edit")}>
                Finish Profile
              </button>
            </div>
          ) : null}

          <div className={styles.tabs}>
            <button className={cx("tab-btn", activeTab === "profile" ? "active" : "")} onClick={() => setActiveTab("profile")}>View Profile</button>
            <button className={cx("tab-btn", activeTab === "edit" ? "active" : "")} onClick={() => setActiveTab("edit")}>Edit Profile</button>
            <button className={cx("tab-btn", activeTab === "appointments" ? "active" : "")} onClick={() => setActiveTab("appointments")} disabled={!isProfileComplete} title={!isProfileComplete ? "Complete your profile first" : ""}>
              Appointments ({appointments.length})
            </button>
            <button className={cx("tab-btn", activeTab === "chat" ? "active" : "")} onClick={() => setActiveTab("chat")} disabled={!isProfileComplete} title={!isProfileComplete ? "Complete your profile first" : ""}>
              Chat
            </button>
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
          ) : activeTab === "chat" ? (
            <>
              <h3 className={styles["section-title"]}>Patient Chat</h3>
              <div className={styles["chat-layout"]}>
                <aside className={styles["chat-sidebar"]}>
                  <div className={styles["chat-sidebar-header"]}>
                    <h4>Available patients</h4>
                    <p>Select a patient to start chatting.</p>
                  </div>

                  {readyPatients.length ? (
                    <div className={styles["chat-contact-list"]}>
                      {readyPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          className={cx("chat-contact-item", selectedPatient?.id === patient.id ? "active" : "")}
                          onClick={() => setSelectedPatient({ id: patient.id, name: patient.name || "Patient" })}
                        >
                          <span>
                            <strong>{patient.name || "Patient"}</strong>
                            <small>{patient.gender || "Profile"}</small>
                          </span>
                          <span className={styles["chat-contact-arrow"]}>Open</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={styles["no-data"]}>No patients available yet</div>
                  )}
                </aside>

                <div className={styles["chat-main"]}>
                  <ChatPanel
                    currentUser={user}
                    peerUserId={selectedPatient?.id}
                    peerName={selectedPatient?.name}
                    peerRole="patient"
                    peerStatus="approved"
                    showToast={showToast}
                  />
                </div>
              </div>
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
                    <label>Profile Image</label>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} />
                    <small className={styles["input-help"]}>Upload JPG, PNG, WEBP, or GIF up to 5 MB</small>
                  </div>

                  <div className={cx("form-group", "form-group-full")}>
                    <label>Or Paste Image URL</label>
                    <input
                      value={editForm.image}
                      onChange={(e) => handleEditChange("image", e.target.value)}
                      placeholder="https://example.com/doctor-photo.jpg"
                    />
                    {imagePreview ? (
                      <div className={styles["image-preview-wrap"]}>
                        <img src={imagePreview} alt="Preview" className={styles["image-preview"]} />
                        <button
                          className={styles["btn-secondary"]}
                          type="button"
                          onClick={() => {
                            setSelectedImageFile(null);
                            handleEditChange("image", "");
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : null}
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
                        <button
                          className={styles["btn-secondary"]}
                          type="button"
                          onClick={() => openPatientChat(appointment.patient_user_id, appointment.patient_name)}
                          disabled={!appointment.patient_user_id}
                        >
                          Chat
                        </button>
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
