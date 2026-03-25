import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { getErrorMessage } from "../utils/helpers";
import "./AuthPages.css";

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
    <div className="auth-page">
      <div className="auth-card">
        <h1>Login</h1>
        <form className="auth-form" onSubmit={onSubmit}>
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button type="submit">Login</button>
        </form>
        <p>New user? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;
