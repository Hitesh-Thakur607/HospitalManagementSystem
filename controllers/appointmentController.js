const db = require("../config/db");

exports.getMyAppointments = (req, res) => {
  const userId = req.user.id;

  db.query("SELECT role FROM users WHERE id = ? LIMIT 1", [userId], (roleErr, roleRows) => {
    if (roleErr) return res.status(500).json(roleErr);
    if (!roleRows.length) return res.status(404).json({ message: "User not found" });

    const role = roleRows[0].role;

    if (role === "doctor") {
      return db.query(
        `SELECT a.*, u.name AS patient_name, p.user_id AS patient_user_id, d.user_id AS doctor_user_id
         FROM appointments a
         INNER JOIN patients p ON a.patient_id = p.id
         INNER JOIN users u ON p.user_id = u.id
         INNER JOIN doctor d ON a.doctor_id = d.id
         WHERE d.user_id = ?
         ORDER BY a.created_at DESC`,
        [userId],
        (err, data) => {
          if (err) return res.status(500).json(err);
          return res.json(
            data.map((appointment) => ({
              ...appointment,
              patient_user_id: appointment.patient_user_id,
              doctor_user_id: userId,
            }))
          );
        }
      );
    }

    if (role === "patient") {
      return db.query(
        `SELECT a.*, u.name AS doctor_name, d.department, d.user_id AS doctor_user_id, p.user_id AS patient_user_id
         FROM appointments a
         INNER JOIN doctor d ON a.doctor_id = d.id
         INNER JOIN users u ON d.user_id = u.id
         INNER JOIN patients p ON a.patient_id = p.id
         WHERE p.user_id = ?
         ORDER BY a.created_at DESC`,
        [userId],
        (err, data) => {
          if (err) return res.status(500).json(err);
          return res.json(
            data.map((appointment) => ({
              ...appointment,
              doctor_user_id: appointment.doctor_user_id,
            }))
          );
        }
      );
    }

    return db.query(
      "SELECT * FROM appointments ORDER BY created_at DESC",
      (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
      }
    );
  });
};

exports.bookAppointment = (req, res) => {
  const { doctor_id, date, time } = req.body;
  const userId = req.user.id;

  if (!doctor_id || !date || !time) {
    return res.status(400).json({ message: "doctor_id, date and time are required" });
  }

  db.query("SELECT id FROM patients WHERE user_id = ? LIMIT 1", [userId], (pErr, pRows) => {
    if (pErr) return res.status(500).json(pErr);
    if (!pRows.length) return res.status(403).json({ message: "Only patients can book appointments" });

    db.query(
      `SELECT d.id
       FROM doctor d
       INNER JOIN users u ON d.user_id = u.id
       INNER JOIN doctor profile ON profile.user_id = u.id
       WHERE d.id = ? AND u.is_approved = 1
         AND profile.department IS NOT NULL AND profile.department <> ''
         AND profile.biography IS NOT NULL AND profile.biography <> ''
         AND profile.qualifications IS NOT NULL AND profile.qualifications <> ''
         AND profile.experience_years IS NOT NULL`,
      [doctor_id],
      (dErr, dRows) => {
        if (dErr) return res.status(500).json(dErr);
        if (!dRows.length) return res.status(403).json({ message: "Doctor is not approved to handle appointments" });

        db.query(
          "INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, 'booked')",
          [pRows[0].id, doctor_id, date, time],
          (iErr) => {
            if (iErr) {
              if (iErr.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ message: "This time slot is already booked" });
              }
              return res.status(500).json(iErr);
            }
            return res.status(201).json({ message: "Appointment booked successfully" });
          }
        );
      }
    );
  });
};

exports.completeAppointment = (req, res) => {
  const appointmentId = req.params.id;

  db.query("UPDATE appointments SET status = 'completed' WHERE id = ?", [appointmentId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.affectedRows) return res.status(404).json({ message: "Appointment not found" });
    return res.json({ message: "Appointment marked completed" });
  });
};

exports.approveAppointment = (req, res) => {
  const appointmentId = req.params.id;
  const userId = req.user.id;

  // Ensure the requester is the doctor who owns the appointment
  db.query(
    `SELECT a.id FROM appointments a
     INNER JOIN doctor d ON a.doctor_id = d.id
     WHERE a.id = ? AND d.user_id = ? LIMIT 1`,
    [appointmentId, userId],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (!rows.length) return res.status(404).json({ message: "Appointment not found or not authorized" });

      db.query("UPDATE appointments SET status = 'approved' WHERE id = ? AND status = 'booked'", [appointmentId], (uErr, result) => {
        if (uErr) return res.status(500).json(uErr);
        if (!result.affectedRows) return res.status(404).json({ message: "Appointment not found" });
        return res.json({ message: "Appointment approved" });
      });
    }
  );
};
