const router = require("express").Router();
const ctrl = require("../controllers/patientController");
const verifyToken = require("../middleware/verifyToken");

router.get("/", verifyToken, ctrl.getPatients);
router.put("/:id", verifyToken, ctrl.updatePatient);

module.exports = router;
