const db = require("../config/db");

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";

exports.getPatients = (req, res) => {
  db.query(
    `SELECT u.id, u.name, u.email, u.phone, u.address, p.age, p.gender, p.medical_history
     FROM users u
     INNER JOIN patients p ON u.id = p.user_id`,
    (err, data) => {
      if (err) return res.status(500).json(err);
      return res.json(data);
    }
  );
};

exports.getMyPatientProfile = (req, res) => {
  const userId = req.user.id;

  db.query(
    `SELECT u.id, u.name, u.email, u.phone, u.address, p.age, p.gender, p.medical_history
     FROM users u
     INNER JOIN patients p ON u.id = p.user_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (!rows.length) return res.status(404).json({ message: "Patient profile not found" });
  
      return res.json({
        ...rows[0],
        profile_complete: hasValue(rows[0].age) && hasValue(rows[0].gender),
      });
    }
  );
};

exports.updatePatient = (req, res) => {
  const id = req.params.id;
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Invalid patient id" });
  }

  const { age, gender, medical_history, phone, address } = req.body;

  db.query(
    "UPDATE patients SET age = ?, gender = ?, medical_history = ? WHERE user_id = ?",
    [age, gender, medical_history, userId],
    (err) => {
      if (err) return res.status(500).json(err);

      db.query("UPDATE users SET phone = ?, address = ? WHERE id = ?", [phone, address, userId], (userErr) => {
        if (userErr) return res.status(500).json(userErr);
        return res.json({ message: "Patient updated successfully" });
      });
    }
  );
};

exports.updateMyPatientProfile = (req, res) => {
  const id = req.user.id;
  const { age, gender, medical_history, phone, address } = req.body;

  db.query(
    "UPDATE patients SET age = ?, gender = ?, medical_history = ? WHERE user_id = ?",
    [age, gender, medical_history, id],
    (err) => {
      if (err) return res.status(500).json(err);

      db.query("UPDATE users SET phone = ?, address = ? WHERE id = ?", [phone, address, id], (userErr) => {
        if (userErr) return res.status(500).json(userErr);
        return res.json({ message: "Patient profile updated successfully" });
      });
    }
  );
};
