const db = require("../config/db");

const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
            if (err) {
                return reject(err);
            }

            return resolve(rows);
        });
    });

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";

const buildResponse = (role, missingFields) => ({
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} profile must be completed before continuing`,
    missingFields,
});

module.exports = ({ role: expectedRole = null, requireApprovedDoctor = false } = {}) => async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const users = await query("SELECT id, role, is_approved FROM users WHERE id = ? LIMIT 1", [userId]);

        if (!users.length) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = users[0];

        if (expectedRole && user.role !== expectedRole) {
            return res.status(403).json({ message: `Only ${expectedRole}s can perform this action` });
        }

        if (user.role === "doctor") {
            if (requireApprovedDoctor && Number(user.is_approved) !== 1) {
                return res.status(403).json({ message: "Only approved doctors can perform this action" });
            }

            const doctors = await query("SELECT department, biography, qualifications, experience_years FROM doctor WHERE user_id = ? LIMIT 1", [userId]);
            const doctor = doctors[0] || {};
            const missingFields = ["department", "biography", "qualifications", "experience_years"].filter((field) => !hasValue(doctor[field]));

            if (missingFields.length) {
                return res.status(422).json(buildResponse("doctor", missingFields));
            }
        }

        if (user.role === "patient") {
            const patients = await query("SELECT age, gender FROM patients WHERE user_id = ? LIMIT 1", [userId]);
            const patient = patients[0] || {};
            const missingFields = ["age", "gender"].filter((field) => !hasValue(patient[field]));

            if (missingFields.length) {
                return res.status(422).json(buildResponse("patient", missingFields));
            }
        }

        return next();
    } catch (error) {
        return res.status(500).json({ message: "Failed to validate profile completion" });
    }
};