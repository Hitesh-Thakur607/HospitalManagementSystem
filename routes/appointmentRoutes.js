const router = require("express").Router();
const ctrl = require("../controllers/appointmentController");
const verifyToken = require("../middleware/verifyToken");
const verifyProfileCompletion = require("../middleware/verifyProfileCompletion");

router.get("/mine", verifyToken, ctrl.getMyAppointments);
router.post("/", verifyToken, verifyProfileCompletion({ role: "patient" }), ctrl.bookAppointment);
router.put("/:id/complete", verifyToken, ctrl.completeAppointment);

module.exports = router;
