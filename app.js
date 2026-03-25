    require("dotenv").config();

    const path = require("path");
    const express = require("express");
    const cors = require("cors");
    const cookieParser = require("cookie-parser");

    const authRoutes = require("./routes/authRoutes");
    const doctorRoutes = require("./routes/doctorRoutes");
    const patientRoutes = require("./routes/patientRoutes");
    const appointmentRoutes = require("./routes/appointmentRoutes");

    const app = express();
    const PORT = process.env.PORT || 5000;

    app.use(
        cors({
            origin: process.env.FRONTEND_URL || "https://hospital-management-system-enwd.onrender.com",
            credentials: true,
        })
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

    const frontendBuildPath = path.join(__dirname, "frontend", "build");
    app.use(express.static(frontendBuildPath));

    app.get("*", (req, res) => {
        if (req.path.startsWith("/api")) {
            return res.status(404).json({ message: "API route not found" });
        }
        return res.sendFile(path.join(frontendBuildPath, "index.html"));
    });

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });