const db = require("../config/db");

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

exports.updatePatient = (req, res) => {
  const id = req.params.id;
  const { age, gender, medical_history, phone, address } = req.body;

  db.query("UPDATE patients SET age = ?, gender = ?, medical_history = ? WHERE user_id = ?", [age, gender, medical_history, id], (err) => {
    if (err) return res.status(500).json(err);

    db.query("UPDATE users SET phone = ?, address = ? WHERE id = ?", [phone, address, id], (userErr) => {
      if (userErr) return res.status(500).json(userErr);
      return res.json({ message: "Patient updated successfully" });
    });
  });
};
