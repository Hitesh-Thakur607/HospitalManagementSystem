const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { signToken } = require("../authentication/auth");
const { setAuthCookie } = require("../cookie/cookie");

exports.register = async (req, res) => {
  const { name, email, password, role = "patient", phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  if (!["admin", "doctor", "patient"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const isApproved = role === "doctor" ? 0 : 1;

    db.query(
      "INSERT INTO users (name, email, password, role, is_approved, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, isApproved, phone || null, address || null],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Email already exists" });
          }
          return res.status(500).json(err);
        }

        if (role === "doctor") {
          db.query("INSERT INTO doctor (user_id) VALUES (?)", [result.insertId]);
        }

        if (role === "patient") {
          db.query("INSERT INTO patients (user_id) VALUES (?)", [result.insertId]);
        }

        return res.status(201).json({
          message:
            role === "doctor"
              ? "Doctor registered. Awaiting admin approval."
              : "Registration successful",
        });
      }
    );
  } catch (error) {
    return res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email], async (err, rows) => {
    if (err) return res.status(500).json(err);
    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);

    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (user.role === "doctor" && Number(user.is_approved) !== 1) {
      return res.status(403).json({ message: "Your doctor account is pending admin approval" });
    }

    const token = signToken({ id: user.id, role: user.role, name: user.name });
    setAuthCookie(res, token);

    return res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out" });
};
