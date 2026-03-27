import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { getErrorMessage } from "../utils/helpers";
import styles from "./AuthPages.module.css";

const LoginPage = ({ showToast }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await authAPI.login(form);
      login(data.user);
      showToast("Login successful", "success");
      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "doctor") navigate("/doctor");
      else navigate("/patient");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <div className={styles["auth-page"]}>
      <div className={styles["auth-card"]}>
        <h1 className={styles["auth-title"]}>Hospital Management System</h1>
        <h2 className={styles["auth-subtitle"]}>Login</h2>
        <form className={styles["auth-form"]} onSubmit={onSubmit}>
          <div className={styles["form-group"]}>
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className={styles["form-group"]}>
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" className={styles["btn-submit"]}>Login</button>
        </form>
        <p className={styles["auth-link"]}>New user? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;
