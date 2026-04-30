    require("dotenv").config();

    const path = require("path");
    const http = require("http");
    const express = require("express");
    const cors = require("cors");
    const cookieParser = require("cookie-parser");
    const jwt = require("jsonwebtoken");
    const { Server } = require("socket.io");
    const db = require("./config/db");

    const authRoutes = require("./routes/authRoutes");
    const doctorRoutes = require("./routes/doctorRoutes");
    const patientRoutes = require("./routes/patientRoutes");
    const appointmentRoutes = require("./routes/appointmentRoutes");
    const chatRoutes = require("./routes/chatRoutes");

    const app = express();
    const PORT = process.env.PORT || 5000;
    const server = http.createServer(app);

    const allowedOrigins = [
        process.env.FRONTEND_ORIGIN,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://hospitalmanagementsystem-a94f.onrender.com",
    ].filter(Boolean);

    const getCookieValue = (cookieHeader = "", name) => {
        const cookiePair = cookieHeader
            .split(";")
            .map((item) => item.trim())
            .find((item) => item.startsWith(`${name}=`));

        if (!cookiePair) {
            return null;
        }

        return decodeURIComponent(cookiePair.slice(name.length + 1));
    };

    app.use(
        // console.log("CORS configured for frontend").
        cors({
                origin: allowedOrigins,
                credentials: true,
        })
        // console.log("CORS configured for frontend"),
    );
    app.use(express.json());
    app.use(cookieParser());

    app.get("/api/health", (req, res) => {
        res.json({ ok: true });
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/doctors", doctorRoutes);
    app.use("/api/patients", patientRoutes);
    app.use("/api/appointments", appointmentRoutes);
    app.use("/api/chat", chatRoutes);

    const frontendBuildPath = path.join(__dirname, "frontend", "build");
    app.use(express.static(frontendBuildPath));

    app.get("*", (req, res) => {
        if (req.path.startsWith("/api")) {
            return res.status(404).json({ message: "API route not found" });
        }
        return res.sendFile(path.join(frontendBuildPath, "index.html"));
    });

    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
    });

    const query = (sql, params = []) =>
        new Promise((resolve, reject) => {
            db.query(sql, params, (err, rows) => {
                if (err) {
                    return reject(err);
                }

                return resolve(rows);
            });
        });

    const ensureAppointmentStatusEnum = async () => {
        await query(
            "ALTER TABLE appointments MODIFY status ENUM('booked', 'approved', 'completed', 'cancelled') NOT NULL DEFAULT 'booked'"
        );
    };

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

    io.use((socket, next) => {
        try {
            const authToken = socket.handshake.auth?.token || getCookieValue(socket.request.headers.cookie, "token");

            if (!authToken) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(authToken, process.env.JWT_SECRET);

            db.query("SELECT id, name, role, is_approved FROM users WHERE id = ? LIMIT 1", [decoded.id], (err, rows) => {
                if (err) {
                    return next(err);
                }

                if (!rows.length) {
                    return next(new Error("User not found"));
                }

                socket.user = rows[0];
                return next();
            });
        } catch (error) {
            return next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        socket.on("chat:join", async ({ peerUserId }, acknowledge) => {
            try {
                const conversation = await resolveConversation(socket.user.id, peerUserId);
                socket.join(conversation.roomKey);

                if (typeof acknowledge === "function") {
                    acknowledge({ ok: true, room: conversation.roomKey });
                }
            } catch (error) {
                if (typeof acknowledge === "function") {
                    acknowledge({ ok: false, message: error.message });
                }
            }
        });

        socket.on("chat:message", async ({ peerUserId, message }, acknowledge) => {
            try {
                const conversation = await resolveConversation(socket.user.id, peerUserId);
                const text = typeof message === "string" ? message.trim() : "";

                if (!text) {
                    throw new Error("Message cannot be empty");
                }

                const senderUserId = socket.user.id;
                const recipientUserId = Number(socket.user.id) === Number(conversation.doctorUser.id) ? conversation.patientUser.id : conversation.doctorUser.id;

                const inserted = await query(
                    "INSERT INTO chat_messages (doctor_user_id, patient_user_id, sender_user_id, message) VALUES (?, ?, ?, ?)",
                    [conversation.doctorUser.id, conversation.patientUser.id, senderUserId, text]
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

                const payload = {
                    ...rows[0],
                    recipient_user_id: recipientUserId,
                };

                io.to(conversation.roomKey).emit("chat:new", payload);

                if (typeof acknowledge === "function") {
                    acknowledge({ ok: true, message: payload });
                }
            } catch (error) {
                if (typeof acknowledge === "function") {
                    acknowledge({ ok: false, message: error.message });
                }
            }
        });
    });

    const startServer = async () => {
        try {
            await ensureAppointmentStatusEnum();
        } catch (error) {
            console.error("Failed to ensure appointment status enum", error.message || error);
        }

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    };

    startServer();