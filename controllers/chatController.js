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

const buildRoomKey = (doctorUserId, patientUserId) => `chat:${doctorUserId}:${patientUserId}`;

const resolveConversation = async (currentUserId, peerUserId) => {
    const users = await query("SELECT id, name, role, is_approved FROM users WHERE id IN (?, ?) ORDER BY id ASC", [currentUserId, peerUserId]);

    if (users.length !== 2) {
        const error = new Error("Conversation participant not found");
        error.statusCode = 404;
        throw error;
    }

    const currentUser = users.find((user) => Number(user.id) === Number(currentUserId));
    const peerUser = users.find((user) => Number(user.id) === Number(peerUserId));

    if (!currentUser || !peerUser) {
        const error = new Error("Conversation participant not found");
        error.statusCode = 404;
        throw error;
    }

    const doctorUser = currentUser.role === "doctor" ? currentUser : peerUser.role === "doctor" ? peerUser : null;
    const patientUser = currentUser.role === "patient" ? currentUser : peerUser.role === "patient" ? peerUser : null;

    if (!doctorUser || !patientUser) {
        const error = new Error("Doctor-patient chat only");
        error.statusCode = 403;
        throw error;
    }

    if (Number(doctorUser.is_approved) !== 1) {
        const error = new Error("Only approved doctors can chat");
        error.statusCode = 403;
        throw error;
    }

    const doctorProfiles = await query("SELECT department, biography, qualifications, experience_years FROM doctor WHERE user_id = ? LIMIT 1", [doctorUser.id]);
    const patientProfiles = await query("SELECT age, gender FROM patients WHERE user_id = ? LIMIT 1", [patientUser.id]);

    const doctorProfile = doctorProfiles[0] || {};
    const patientProfile = patientProfiles[0] || {};

    if (!["department", "biography", "qualifications", "experience_years"].every((field) => hasValue(doctorProfile[field]))) {
        const error = new Error("Doctor profile must be completed before chat");
        error.statusCode = 422;
        throw error;
    }

    if (!hasValue(patientProfile.age) || !hasValue(patientProfile.gender)) {
        const error = new Error("Patient profile must be completed before chat");
        error.statusCode = 422;
        throw error;
    }

    return {
        doctorUser,
        patientUser,
        roomKey: buildRoomKey(doctorUser.id, patientUser.id),
    };
};

exports.getMessages = async (req, res) => {
    const currentUserId = req.user.id;
    const peerUserId = Number(req.params.peerUserId);

    if (!peerUserId) {
        return res.status(400).json({ message: "peerUserId is required" });
    }

    try {
        const conversation = await resolveConversation(currentUserId, peerUserId);
        const rows = await query(
            `SELECT m.id, m.message, m.sender_user_id, m.doctor_user_id, m.patient_user_id, m.created_at,
                    s.name AS sender_name, s.role AS sender_role
             FROM chat_messages m
             INNER JOIN users s ON m.sender_user_id = s.id
             WHERE m.doctor_user_id = ? AND m.patient_user_id = ?
             ORDER BY m.created_at ASC, m.id ASC`,
            [conversation.doctorUser.id, conversation.patientUser.id]
        );

        return res.json(
            rows.map((row) => ({
                ...row,
                is_mine: Number(row.sender_user_id) === Number(currentUserId),
            }))
        );
    } catch (error) {
        return res.status(error.statusCode || 500).json({ message: error.message || "Failed to load messages" });
    }
};

exports.sendMessage = async (req, res) => {
    const currentUserId = req.user.id;
    const peerUserId = Number(req.params.peerUserId);
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

    if (!peerUserId) {
        return res.status(400).json({ message: "peerUserId is required" });
    }

    if (!message) {
        return res.status(400).json({ message: "Message cannot be empty" });
    }

    try {
        const conversation = await resolveConversation(currentUserId, peerUserId);
        const senderUserId = currentUserId;
        const recipientUserId = Number(currentUserId) === Number(conversation.doctorUser.id) ? conversation.patientUser.id : conversation.doctorUser.id;

        const inserted = await query(
            "INSERT INTO chat_messages (doctor_user_id, patient_user_id, sender_user_id, message) VALUES (?, ?, ?, ?)",
            [conversation.doctorUser.id, conversation.patientUser.id, senderUserId, message]
        );

        const rows = await query(
            `SELECT m.id, m.message, m.sender_user_id, m.doctor_user_id, m.patient_user_id, m.created_at,
                    s.name AS sender_name, s.role AS sender_role
             FROM chat_messages m
             INNER JOIN users s ON m.sender_user_id = s.id
             WHERE m.id = ?
             LIMIT 1`,
            [inserted.insertId]
        );

        return res.status(201).json({
            ...rows[0],
            recipient_user_id: recipientUserId,
            is_mine: true,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ message: error.message || "Failed to send message" });
    }
};