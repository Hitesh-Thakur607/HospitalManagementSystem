const db = require("../config/db");
const cloudinary = require("../config/cloudinary");

const isHttpUrl = (value = "") => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const cloudinaryUploadOptions = (doctorId) => ({
  folder: "hospital-management/doctors",
  public_id: `doctor-${doctorId}`,
  overwrite: true,
  invalidate: true,
  resource_type: "image",
  allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  transformation: [{ width: 800, height: 800, crop: "limit" }, { quality: "auto", fetch_format: "auto" }],
});

const uploadDoctorImageByUrl = async (imageUrl, doctorId) => {
  const uploadResult = await cloudinary.uploader.upload(imageUrl, cloudinaryUploadOptions(doctorId));
  return uploadResult.secure_url;
};

const uploadDoctorImageByBuffer = async (fileBuffer, doctorId) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(cloudinaryUploadOptions(doctorId), (error, result) => {
      if (error) {
        return reject(error);
      }

      if (!result || !result.secure_url) {
        return reject(new Error("Image upload failed"));
      }

      return resolve(result.secure_url);
    });

    uploadStream.end(fileBuffer);
  });

const applyDoctorProfileUpdate = async (doctorId, payload, uploadedFile, res) => {
  const { department, biography, qualifications, experience_years, specialization } = payload;
  const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl.trim() : "";

  db.query("SELECT * FROM doctor WHERE user_id = ?", [doctorId], async (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    let uploadedImage = result[0].image;

    if (experience_years !== undefined && experience_years !== null && experience_years !== "") {
      const parsedExperienceYears = Number(experience_years);
      if (!Number.isInteger(parsedExperienceYears) || parsedExperienceYears < 0 || parsedExperienceYears > 80) {
        return res.status(400).json({ message: "experience_years must be an integer between 0 and 80" });
      }
    }

    if (uploadedFile) {
      try {
        uploadedImage = await uploadDoctorImageByBuffer(uploadedFile.buffer, doctorId);
      } catch (uploadErr) {
        return res.status(400).json({
          message: "Failed to upload doctor image",
          error: uploadErr.message,
        });
      }
    } else if (imageUrl && imageUrl !== result[0].image) {
      if (!isHttpUrl(imageUrl)) {
        return res.status(400).json({ message: "Invalid image URL format" });
      }

      try {
        uploadedImage = await uploadDoctorImageByUrl(imageUrl, doctorId);
      } catch (uploadErr) {
        return res.status(400).json({
          message: "Failed to upload doctor image",
          error: uploadErr.message,
        });
      }
    }

    db.query(
      "UPDATE doctor SET department=?, biography=?, qualifications=?, experience_years=?, image=? WHERE user_id = ?",
      [
        department || result[0].department,
        biography || result[0].biography,
        qualifications || result[0].qualifications,
        experience_years !== undefined && experience_years !== null && experience_years !== ""
          ? Number(experience_years)
          : result[0].experience_years,
        uploadedImage,
        doctorId,
      ],
      (updateErr) => {
        if (updateErr) return res.status(500).json(updateErr);

        if (specialization) {
          db.query("UPDATE users SET specialization = ? WHERE id = ?", [specialization, doctorId]);
        }

        return res.json({ message: "Doctor profile updated successfully" });
      }
    );
  });
};

exports.getDoctors = (req, res) => {
  const userId = req.user && req.user.id;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  db.query("SELECT role FROM users WHERE id = ?", [userId], (roleErr, roleResult) => {
    if (roleErr) return res.status(500).json(roleErr);
    if (!roleResult.length) return res.status(404).json({ message: "User not found" });

    const role = roleResult[0].role;
    let whereClause = "WHERE u.is_approved = 1";
    let params = [];

    if (role === "admin") {
      whereClause = "";
    } else if (role === "doctor") {
      whereClause = "WHERE u.id = ?";
      params = [userId];
    }

    db.query(
      `SELECT u.id, d.id AS doctor_id, u.name, u.email, u.phone, u.address, u.specialization,
              u.is_approved,
              d.department, d.biography, d.qualifications, d.experience_years, d.image
       FROM users u
       INNER JOIN doctor d ON u.id = d.user_id
       ${whereClause}`,
      params,
      (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
      }
    );
  });
};

exports.getAllDoctorsWithStatus = (req, res) => {
  db.query(
    `SELECT u.id, d.id AS doctor_id, u.name, u.email, u.phone, u.address, u.specialization, u.is_approved,
            d.department, d.biography, d.qualifications, d.experience_years, d.image,
            d.approved_by, d.approved_at
     FROM users u
     INNER JOIN doctor d ON u.id = d.user_id`,
    (err, data) => {
      if (err) return res.status(500).json(err);
      return res.json(data);
    }
  );
};

exports.getPendingDoctors = (req, res) => {
  db.query(
    `SELECT u.id, d.id AS doctor_id, u.name, u.email, u.phone, u.address,
            d.department, d.biography, d.experience_years
     FROM users u
     INNER JOIN doctor d ON u.id = d.user_id
     WHERE u.is_approved = 0`,
    (err, data) => {
      if (err) return res.status(500).json(err);
      return res.json(data);
    }
  );
};

exports.getMyDoctorProfile = (req, res) => {
  const userId = req.user.id;

  db.query(
    `SELECT u.id, d.id AS doctor_id, u.name, u.email, u.phone, u.address, u.specialization, u.is_approved,
            d.department, d.biography, d.qualifications, d.experience_years, d.image
     FROM users u
     INNER JOIN doctor d ON u.id = d.user_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (!result.length) return res.status(404).json({ message: "Doctor profile not found" });
      return res.json(result[0]);
    }
  );
};

exports.updateMyDoctorProfile = (req, res) => {
  const userId = req.user.id;

  db.query("SELECT role FROM users WHERE id = ?", [userId], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.length) return res.status(404).json({ message: "User not found" });
    if (result[0].role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can update doctor profile" });
    }
    return applyDoctorProfileUpdate(userId, req.body, req.file, res);
  });
};

exports.updateDoctorProfile = (req, res) => {
  const doctorId = req.params.id;
  return applyDoctorProfileUpdate(doctorId, req.body, req.file, res);
};

exports.approveDoctorAccount = (req, res) => {
  const doctorId = req.params.id;
  const adminId = req.adminId;

  db.query("UPDATE users SET is_approved = 1 WHERE id = ? AND role = 'doctor'", [doctorId], (err) => {
    if (err) return res.status(500).json(err);

    db.query("UPDATE doctor SET approved_by = ?, approved_at = NOW() WHERE user_id = ?", [adminId, doctorId]);

    return res.json({
      message: "Doctor approved successfully. Can now handle appointments.",
      status: "approved",
    });
  });
};

exports.rejectDoctorAccount = (req, res) => {
  const doctorId = req.params.id;
  const { reason } = req.body;

  db.query("UPDATE users SET is_approved = -1 WHERE id = ? AND role = 'doctor'", [doctorId], (err) => {
    if (err) return res.status(500).json(err);

    return res.json({
      message: `Doctor account rejected. ${reason ? `Reason: ${reason}` : ""}`,
      status: "rejected",
    });
  });
};
