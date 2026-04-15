const express = require("express");
const router = express.Router();
const ctrl = require("../controller/requirementTypeController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/", ctrl.fetchRequirementTypes);
router.post("/", ctrl.createRequirementType);
router.put("/:id", ctrl.updateRequirementType);
router.delete("/:id", ctrl.deleteRequirementType);

module.exports = router;
