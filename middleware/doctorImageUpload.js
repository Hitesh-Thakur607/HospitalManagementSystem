const multer = require("multer");

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

const uploadDoctorImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP, and GIF images are allowed"));
    }
    return cb(null, true);
  },
});

const handleDoctorImageUpload = (req, res, next) => {
  uploadDoctorImage.single("image")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Image size exceeds 5 MB limit" });
    }

    return res.status(400).json({ message: error.message || "Invalid image upload" });
  });
};

module.exports = { handleDoctorImageUpload, MAX_IMAGE_SIZE_BYTES };
