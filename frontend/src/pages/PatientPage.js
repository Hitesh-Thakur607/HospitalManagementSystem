import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorCard from "../components/DoctorCard";
import { AuthContext } from "../context/AuthContext";
import { appointmentAPI, authAPI, doctorAPI } from "../services/api";
import { getErrorMessage } from "../utils/helpers";
import styles from "./DashboardPages.module.css";

const cx = (...names) => names.map((name) => styles[name]).filter(Boolean).join(" ");

const PatientPage = ({ showToast }) => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("doctors");
  const [bookingDoctorId, setBookingDoctorId] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({ date: "", time: "10:00" });
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

  const refreshAppointments = async () => {
    try {
      const data = await appointmentAPI.getAll();
      setAppointments(data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const handleOpenBookingForm = (doctorId) => {
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
            <div className={styles["user-info"]}>Logged in as <strong>{user?.name}</strong> ({user?.role})</div>
            <button className={styles["logout-btn"]} onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>
      <div className={styles.container}>
        <div className={styles["page-content"]}>
          <div className={styles.tabs}>
            <button className={cx("tab-btn", activeTab === "doctors" ? "active" : "")} onClick={() => setActiveTab("doctors")}>Find Doctors ({doctors.length})</button>
            <button className={cx("tab-btn", activeTab === "appointments" ? "active" : "")} onClick={() => setActiveTab("appointments")}>My Appointments ({appointments.length})</button>
          </div>

          {activeTab === "doctors" ? (
            <>
              <h3 className={styles["section-title"]}>Find & Book Doctors</h3>
              {doctors.length ? (
                <div className={styles["doctors-list"]}>
                  {doctors.map((doctor) => (
                    <div key={doctor.id} className={styles["doctor-item"]}>
                      <DoctorCard doctor={doctor} />
                      <button className={styles["btn-primary"]} onClick={() => handleOpenBookingForm(doctor.doctor_id || doctor.id)}>Book Appointment</button>

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
                            <button className={styles["btn-secondary"]} type="button" onClick={handleCloseBookingForm}>Cancel</button>
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
                          {appointment.status || "booked"}
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
