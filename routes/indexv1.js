var express = require("express");
var router = express.Router();

router.use("/health", require("./health"));
router.use("/user", require("./user"));
router.use("/plan", require("./plan"));

module.exports = router;
