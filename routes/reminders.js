const express = require("express");
const router = express.Router();
const leadController = require("../controller/leadController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// Reminder routes
router.get("/", leadController.getReminders);
router.put("/:id/complete", leadController.markReminderCompleted);

module.exports = router;