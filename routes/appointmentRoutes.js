const router = require("express").Router();
const ctrl = require("../controllers/appointmentController");
const verifyToken = require("../middleware/verifyToken");

router.get("/mine", verifyToken, ctrl.getMyAppointments);
router.post("/", verifyToken, ctrl.bookAppointment);
router.put("/:id/complete", verifyToken, ctrl.completeAppointment);

module.exports = router;
