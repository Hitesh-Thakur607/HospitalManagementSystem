const router = require("express").Router();
const ctrl = require("../controllers/patientController");
const verifyToken = require("../middleware/verifyToken");

router.get("/", verifyToken, ctrl.getPatients);
router.get("/me", verifyToken, ctrl.getMyPatientProfile);
router.put("/me", verifyToken, ctrl.updateMyPatientProfile);
router.put("/:id", verifyToken, ctrl.updatePatient);

module.exports = router;
