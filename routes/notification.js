const express = require("express");
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require("../controller/notificationController");
const authMiddleware = require("../middleware/auth");

router.get("/", authMiddleware, getNotifications);
router.patch("/:id/read", authMiddleware, markAsRead);
router.patch("/read-all", authMiddleware, markAllAsRead);

module.exports = router;
