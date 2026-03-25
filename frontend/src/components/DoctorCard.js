import React from "react";
import { escapeHtml } from "../utils/helpers";
import "./DoctorCard.css";

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
    <div className="doctor-card">
      <div className="doctor-header">
        {doctor.image ? (
          <img src={escapeHtml(doctor.image)} alt={escapeHtml(doctor.name)} className="doctor-avatar" />
        ) : (
          <div className="doctor-avatar-fallback">{escapeHtml((doctor.name || "D").charAt(0).toUpperCase())}</div>
        )}
        <div className="doctor-info">
          <h3 className="doctor-name">{escapeHtml(doctor.name || "Unknown")}</h3>
          <p className="doctor-email">{escapeHtml(doctor.email || "")}</p>
        </div>
        {showApprovalStatus && (
          <span className={`badge badge-${approvalStatus}`}>{approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}</span>
        )}
      </div>

      <div className="doctor-body">
        <p><strong>Department:</strong> {escapeHtml(doctor.department || "N/A")}</p>
        <p><strong>Specialization:</strong> {escapeHtml(doctor.specialization || "N/A")}</p>
        <p><strong>Qualifications:</strong> {escapeHtml(doctor.qualifications || "N/A")}</p>
        <p><strong>Experience:</strong> {experienceText}</p>
        <p><strong>Phone:</strong> {escapeHtml(doctor.phone || "-")}</p>
        <p className="doctor-bio"><strong>Bio:</strong> {escapeHtml(doctor.biography || "No biography available")}</p>
      </div>

      {isAdmin && (canShowApprove || canShowReject) && (
        <div className="doctor-actions">
          {canShowApprove && (
            <button className="btn btn-success" onClick={() => onApprove(doctor.id)}>
              Approve
            </button>
          )}
          {canShowReject && (
            <button className="btn btn-danger" onClick={() => onReject(doctor.id)}>
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorCard;
