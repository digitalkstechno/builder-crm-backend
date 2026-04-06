var express = require("express");
var router = express.Router();

router.use("/health", require("./health"));
router.use("/user", require("./user"));
router.use("/plan", require("./plan"));
router.use("/builder", require("./builder"));

module.exports = router;
