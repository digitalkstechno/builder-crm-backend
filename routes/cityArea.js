const express = require("express");
const router = express.Router();
const ctrl = require("../controller/cityAreaController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/cities", ctrl.getCities);
router.get("/areas/:city", ctrl.getAreasByCity);
router.post("/", ctrl.addCityArea);

module.exports = router;
