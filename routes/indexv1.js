var express = require("express");
var router = express.Router();

router.use("/health", require("./health"));
router.use("/user", require("./user"));
router.use("/plan", require("./plan"));
router.use("/builder", require("./builder"));
router.use("/admin", require("./admin"));
router.use("/staff", require("./staff"));
router.use("/team", require("./team"));
router.use("/site", require("./site"));
router.use("/lead-status", require("./leadStatus"));
router.use("/whatsapp", require("./whatsapp"));

module.exports = router;
