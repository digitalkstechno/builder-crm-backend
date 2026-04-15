const express = require("express");
const router = express.Router();
const ctrl = require("../controller/propertyTypeController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/", ctrl.fetchPropertyTypes);
router.post("/", ctrl.createPropertyType);
router.put("/:id", ctrl.updatePropertyType);
router.delete("/:id", ctrl.deletePropertyType);

module.exports = router;
