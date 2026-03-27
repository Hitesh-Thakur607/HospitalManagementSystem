import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { getErrorMessage } from "../utils/helpers";
import styles from "./AuthPages.module.css";

const RegisterPage = ({ showToast }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
    phone: "",
    address: "",
  });
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await authAPI.register(form);
      showToast(data.message || "Registration successful", "success");
      navigate("/login");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <div className={styles["auth-page"]}>
      <div className={styles["auth-card"]}>
        <h1 className={styles["auth-title"]}>Hospital Management System</h1>
        <h2 className={styles["auth-subtitle"]}>Register</h2>
        <form className={styles["auth-form"]} onSubmit={onSubmit}>
          <div className={styles["form-group"]}>
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className={styles["form-group"]}>
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className={styles["form-group"]}>
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className={styles["form-group"]}>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          <div className={styles["form-group"]}>
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className={styles["form-group"]}>
            <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <button type="submit" className={styles["btn-submit"]}>Create Account</button>
        </form>
        <p className={styles["auth-link"]}>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};

export default RegisterPage;
