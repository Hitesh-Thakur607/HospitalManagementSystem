const router = require("express").Router();
const ctrl = require("../controllers/chatController");
const verifyToken = require("../middleware/verifyToken");
const verifyProfileCompletion = require("../middleware/verifyProfileCompletion");

router.get("/:peerUserId/messages", verifyToken, verifyProfileCompletion(), ctrl.getMessages);
router.post("/:peerUserId/messages", verifyToken, verifyProfileCompletion(), ctrl.sendMessage);

module.exports = router;