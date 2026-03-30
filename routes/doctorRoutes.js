const router = require("express").Router();
const ctrl = require("../controllers/doctorController");
const verifyAdmin = require("../middleware/verifyAdmin");
const verifyToken = require("../middleware/verifyToken");
const { handleDoctorImageUpload } = require("../middleware/doctorImageUpload");

router.get("/", verifyToken, ctrl.getDoctors);
router.get("/me", verifyToken, ctrl.getMyDoctorProfile);
router.put("/me", verifyToken, handleDoctorImageUpload, ctrl.updateMyDoctorProfile);

router.get("/admin/all", verifyAdmin, ctrl.getAllDoctorsWithStatus);
router.get("/admin/pending", verifyAdmin, ctrl.getPendingDoctors);
router.put("/admin/approve/:id", verifyAdmin, ctrl.approveDoctorAccount);
router.put("/admin/reject/:id", verifyAdmin, ctrl.rejectDoctorAccount);
router.put("/:id", verifyAdmin, handleDoctorImageUpload, ctrl.updateDoctorProfile);

module.exports = router;
