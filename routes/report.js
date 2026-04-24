const express = require("express");
const router = express.Router();
const reportController = require("../controller/reportController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/stats", reportController.getReportStats);

module.exports = router;
