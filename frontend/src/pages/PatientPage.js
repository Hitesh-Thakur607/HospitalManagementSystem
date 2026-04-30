import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ChatPanel from "../components/ChatPanel";
import DoctorCard from "../components/DoctorCard";
import { AuthContext } from "../context/AuthContext";
import { appointmentAPI, authAPI, doctorAPI, patientAPI } from "../services/api";
import { getErrorMessage } from "../utils/helpers";
import styles from "./DashboardPages.module.css";

const cx = (...names) => names.map((name) => styles[name]).filter(Boolean).join(" ");

const getAppointmentStatusLabel = (status) => {
  switch (status) {
    case "booked":
      return "Pending approval";
    case "approved":
      return "Approved";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status || "Pending approval";
  }
};

const PatientPage = ({ showToast }) => {
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [bookingDoctorId, setBookingDoctorId] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingForm, setBookingForm] = useState({ date: "", time: "10:00" });
  const [profileForm, setProfileForm] = useState({
    age: "",
    gender: "",
    medical_history: "",
    phone: "",
    address: "",
  });
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const profileComplete = Boolean(profile?.profile_complete);

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString();
  };

  const readyDoctors = doctors.filter(
    (doctor) =>
      Number(doctor.is_approved) === 1 &&
      Boolean(doctor.department) &&
      Boolean(doctor.biography) &&
      Boolean(doctor.qualifications) &&
      doctor.experience_years !== null &&
      doctor.experience_years !== undefined &&
      doctor.experience_years !== ""
  );

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [patientProfile, doctorList, appointmentList] = await Promise.all([
          patientAPI.getMe(),
          doctorAPI.getAll(),
          appointmentAPI.getAll(),
        ]);

        if (!active) return;

        setProfile(patientProfile);
        setProfileForm({
          age: patientProfile.age || "",
          gender: patientProfile.gender || "",
          medical_history: patientProfile.medical_history || "",
          phone: patientProfile.phone || "",
          address: patientProfile.address || "",
        });
        setDoctors(Array.isArray(doctorList) ? doctorList : []);
        setAppointments(Array.isArray(appointmentList) ? appointmentList : []);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [showToast]);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!profile) return;

    // If profile is incomplete, ensure profile tab is shown and mark initialized
    if (!profileComplete) {
      setActiveTab("profile");
      initializedRef.current = true;
      return;
    }

    // Only auto-advance from profile -> doctors on initial load
    if (!initializedRef.current && activeTab === "profile") {
      setActiveTab("doctors");
      initializedRef.current = true;
    }
  }, [profile, profileComplete, activeTab]);

  const refreshAppointments = async () => {
    try {
      const data = await appointmentAPI.getAll();
      setAppointments(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const handleOpenBookingForm = (doctorId) => {
    if (!profileComplete) {
      showToast("Complete your profile before booking appointments", "error");
      setActiveTab("profile");
      return;
    }

    setBookingDoctorId(doctorId);
    setBookingForm({ date: "", time: "10:00" });
  };

  const handleCloseBookingForm = () => {
    setBookingDoctorId(null);
    setBookingForm({ date: "", time: "10:00" });
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();

    if (!bookingDoctorId) {
      showToast("Please select a doctor first", "error");
      return;
    }

    if (!bookingForm.date || !bookingForm.time) {
      showToast("Please select both date and time", "error");
      return;
    }

    const formattedTime = bookingForm.time.length === 5 ? `${bookingForm.time}:00` : bookingForm.time;

    try {
      setIsBooking(true);
      await appointmentAPI.book({ doctor_id: bookingDoctorId, date: bookingForm.date, time: formattedTime });
      showToast("Appointment booked successfully", "success");
      handleCloseBookingForm();
      setActiveTab("appointments");
      refreshAppointments();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsBooking(false);
    }
  };

  const handleOpenChat = (doctor) => {
    if (!profileComplete) {
      showToast("Complete your profile before starting chat", "error");
      setActiveTab("profile");
      return;
    }

    setSelectedDoctor({
      id: doctor.id,
      name: doctor.name || "Doctor",
    });
    setActiveTab("chat");
  };

  const handleProfileChange = (field, value) => {
    setProfileForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      await patientAPI.updateMe(profileForm);
      const latestProfile = await patientAPI.getMe();

      setProfile(latestProfile);
      setProfileForm({
        age: latestProfile.age || "",
        gender: latestProfile.gender || "",
        medical_history: latestProfile.medical_history || "",
        phone: latestProfile.phone || "",
        address: latestProfile.address || "",
      });

      showToast("Profile updated successfully", "success");

      if (latestProfile.profile_complete) {
        setActiveTab("doctors");
      }
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSavingProfile(false);
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
          <h1>Patient Dashboard</h1>
          <div className={styles["header-right"]}>
            <div className={styles["user-info"]}>
              Logged in as <strong>{user?.name}</strong> ({user?.role})
            </div>
            <button className={styles["logout-btn"]} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles["page-content"]}>
          {!profileComplete ? (
            <div className={styles["profile-banner"]}>
              <div>
                <strong>Finish your profile first.</strong>
                <p>Age and gender are required before you can book or chat.</p>
              </div>
              <button className={styles["btn-primary"]} type="button" onClick={() => setActiveTab("profile")}>
                Complete Profile
              </button>
            </div>
          ) : null}

          <div className={styles.tabs}>
            <button className={cx("tab-btn", activeTab === "profile" ? "active" : "")} onClick={() => setActiveTab("profile")}>
              Profile
            </button>
            <button
              className={cx("tab-btn", activeTab === "doctors" ? "active" : "")}
              onClick={() => setActiveTab("doctors")}
              disabled={!profileComplete}
              title={!profileComplete ? "Complete your profile first" : ""}
            >
              Find Doctors ({readyDoctors.length})
            </button>
            <button
              className={cx("tab-btn", activeTab === "chat" ? "active" : "")}
              onClick={() => setActiveTab("chat")}
              disabled={!profileComplete}
              title={!profileComplete ? "Complete your profile first" : ""}
            >
              Chat
            </button>
            <button
              className={cx("tab-btn", activeTab === "appointments" ? "active" : "")}
              onClick={() => setActiveTab("appointments")}
              disabled={!profileComplete}
              title={!profileComplete ? "Complete your profile first" : ""}
            >
              My Appointments ({appointments.length})
            </button>
          </div>

          {activeTab === "profile" ? (
            <>
              <h3 className={styles["section-title"]}>Complete Your Profile</h3>
              <form className={styles["profile-edit-form"]} onSubmit={handleSaveProfile}>
                <div className={styles["form-grid"]}>
                  <div className={styles["form-group"]}>
                    <label>Age</label>
                    <input
                      type="number"
                      min="0"
                      value={profileForm.age}
                      onChange={(e) => handleProfileChange("age", e.target.value)}
                      placeholder="Your age"
                    />
                  </div>

                  <div className={styles["form-group"]}>
                    <label>Gender</label>
                    <select value={profileForm.gender} onChange={(e) => handleProfileChange("gender", e.target.value)}>
                      <option value="">Select gender</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className={cx("form-group", "form-group-full")}>
                    <label>Medical History</label>
                    <textarea
                      value={profileForm.medical_history}
                      onChange={(e) => handleProfileChange("medical_history", e.target.value)}
                      placeholder="Allergies, prior treatments, ongoing medications"
                      rows={4}
                    />
                  </div>

                  <div className={styles["form-group"]}>
                    <label>Phone</label>
                    <input
                      value={profileForm.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>

                  <div className={styles["form-group"]}>
                    <label>Address</label>
                    <input
                      value={profileForm.address}
                      onChange={(e) => handleProfileChange("address", e.target.value)}
                      placeholder="Your address"
                    />
                  </div>
                </div>

                <div className={styles["button-group"]}>
                  <button className={styles["btn-primary"]} type="submit" disabled={isSavingProfile}>
                    {isSavingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </>
          ) : activeTab === "doctors" ? (
            <>
              <h3 className={styles["section-title"]}>Find & Book Doctors</h3>
              {readyDoctors.length ? (
                <div className={styles["doctors-list"]}>
                  {readyDoctors.map((doctor) => (
                    <div key={doctor.id} className={styles["doctor-item"]}>
                      <DoctorCard doctor={doctor} />
                      <div className={styles["doctor-actions-row"]}>
                        <button className={styles["btn-primary"]} onClick={() => handleOpenBookingForm(doctor.doctor_id || doctor.id)}>
                          Book Appointment
                        </button>
                        <button className={styles["btn-secondary"]} onClick={() => handleOpenChat(doctor)}>
                          Chat
                        </button>
                      </div>

                      {bookingDoctorId === (doctor.doctor_id || doctor.id) ? (
                        <form className={styles["booking-form-section"]} onSubmit={handleBookAppointment}>
                          <h4>Book with {doctor.name || "Doctor"}</h4>

                          <div className={styles["booking-form-row"]}>
                            <div className={styles["form-group"]}>
                              <label>Date</label>
                              <input
                                type="date"
                                min={getTodayDate()}
                                value={bookingForm.date}
                                onChange={(e) => setBookingForm((prev) => ({ ...prev, date: e.target.value }))}
                                required
                              />
                            </div>

                            <div className={styles["form-group"]}>
                              <label>Time</label>
                              <input
                                type="time"
                                step="60"
                                value={bookingForm.time}
                                onChange={(e) => setBookingForm((prev) => ({ ...prev, time: e.target.value }))}
                                required
                              />
                            </div>
                          </div>

                          <div className={styles["button-group"]}>
                            <button className={styles["btn-primary"]} type="submit" disabled={isBooking}>
                              {isBooking ? "Booking..." : "Confirm Appointment"}
                            </button>
                            <button className={styles["btn-secondary"]} type="button" onClick={handleCloseBookingForm}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles["no-data"]}>No approved doctors available</div>
              )}
            </>
          ) : activeTab === "chat" ? (
            <>
              <h3 className={styles["section-title"]}>Doctor Chat</h3>
              <div className={styles["chat-layout"]}>
                <aside className={styles["chat-sidebar"]}>
                  <div className={styles["chat-sidebar-header"]}>
                    <h4>Approved doctors</h4>
                    <p>Select who you want to speak with.</p>
                  </div>

                  {readyDoctors.length ? (
                    <div className={styles["chat-contact-list"]}>
                      {readyDoctors.map((doctor) => (
                        <button
                          key={doctor.id}
                          type="button"
                          className={cx("chat-contact-item", selectedDoctor?.id === doctor.id ? "active" : "")}
                          onClick={() => setSelectedDoctor({ id: doctor.id, name: doctor.name || "Doctor" })}
                        >
                          <span>
                            <strong>{doctor.name || "Doctor"}</strong>
                            <small>{doctor.department || doctor.specialization || "Ready"}</small>
                          </span>
                          <span className={styles["chat-contact-arrow"]}>Open</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={styles["no-data"]}>No approved doctors available for chat</div>
                  )}
                </aside>

                <div className={styles["chat-main"]}>
                  <ChatPanel
                    currentUser={user}
                    peerUserId={selectedDoctor?.id}
                    peerName={selectedDoctor?.name}
                    peerRole="doctor"
                    peerStatus="approved"
                    showToast={showToast}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className={styles["section-title"]}>Your Appointments</h3>
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
                          {getAppointmentStatusLabel(appointment.status)}
                        </span>
                      </div>

                      <div className={styles["appointment-body"]}>
                        <p><strong>Doctor:</strong> {appointment.doctor_name || "Doctor"}</p>
                        <p><strong>Department:</strong> {appointment.department || "N/A"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles["no-data"]}>No appointments booked yet</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientPage;
