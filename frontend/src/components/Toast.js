import React from "react";
import "./Toast.css";

const Toast = ({ message, type = "info" }) => {
  if (!message) return null;
  return <div className={`toast toast-${type}`}>{message}</div>;
};

export default Toast;
