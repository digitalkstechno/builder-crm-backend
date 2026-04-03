var express = require("express");
var router = express.Router();

router.use("/health", require("./health"));
router.use("/user", require("./user"));

module.exports = router;
