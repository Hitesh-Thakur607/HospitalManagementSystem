import React from "react";
import { escapeHtml } from "../utils/helpers";
import styles from "./DoctorCard.module.css";

const cx = (...names) => names.map((name) => styles[name]).filter(Boolean).join(" ");

const DoctorCard = ({ doctor, isAdmin = false, onApprove, onReject, showApprovalStatus = false }) => {
  const approvalValue = Number(doctor.is_approved);
  const approvalStatus = approvalValue === 1 ? "approved" : approvalValue === -1 ? "rejected" : "pending";
  const canShowApprove = !!onApprove && approvalValue !== 1;
  const canShowReject = !!onReject;
  const experienceText =
    doctor.experience_years !== null && doctor.experience_years !== undefined && doctor.experience_years !== ""
      ? `${escapeHtml(String(doctor.experience_years))} years`
      : "N/A";

  return (
    <div className={styles["doctor-card"]}>
      <div className={styles["doctor-header"]}>
        {doctor.image ? (
          <img src={escapeHtml(doctor.image)} alt={escapeHtml(doctor.name)} className={styles["doctor-avatar"]} />
        ) : (
          <div className={styles["doctor-avatar-fallback"]}>{escapeHtml((doctor.name || "D").charAt(0).toUpperCase())}</div>
        )}
        <div className={styles["doctor-info"]}>
          <h3 className={styles["doctor-name"]}>{escapeHtml(doctor.name || "Unknown")}</h3>
          <p className={styles["doctor-email"]}>{escapeHtml(doctor.email || "")}</p>
        </div>
        {showApprovalStatus && (
          <span className={cx("badge", `badge-${approvalStatus}`)}>{approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}</span>
        )}
      </div>

      <div className={styles["doctor-body"]}>
        <p><strong>Department:</strong> {escapeHtml(doctor.department || "N/A")}</p>
        <p><strong>Specialization:</strong> {escapeHtml(doctor.specialization || "N/A")}</p>
        <p><strong>Qualifications:</strong> {escapeHtml(doctor.qualifications || "N/A")}</p>
        <p><strong>Experience:</strong> {experienceText}</p>
        <p><strong>Phone:</strong> {escapeHtml(doctor.phone || "-")}</p>
        <p className={styles["doctor-bio"]}><strong>Bio:</strong> {escapeHtml(doctor.biography || "No biography available")}</p>
      </div>

      {isAdmin && (canShowApprove || canShowReject) && (
        <div className={styles["doctor-actions"]}>
          {canShowApprove && (
            <button className={cx("btn", "btn-success")} onClick={() => onApprove(doctor.id)}>
              Approve
            </button>
          )}
          {canShowReject && (
            <button className={cx("btn", "btn-danger")} onClick={() => onReject(doctor.id)}>
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorCard;
