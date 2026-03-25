const jwt = require("jsonwebtoken");
const db = require("../config/db");

module.exports = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    db.query("SELECT id, role FROM users WHERE id = ? LIMIT 1", [decoded.id], (err, rows) => {
      if (err) return res.status(500).json(err);
      if (!rows.length || rows[0].role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      req.user = decoded;
      req.adminId = decoded.id;
      return next();
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
