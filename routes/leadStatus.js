const express = require("express");
const router = express.Router();
const leadStatusController = require("../controller/leadStatusController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/", leadStatusController.fetchLeadStatuses);
router.post("/", leadStatusController.createLeadStatus);
router.put("/reorder", leadStatusController.reorderLeadStatuses);
router.put("/:id", leadStatusController.updateLeadStatus);
router.delete("/:id", leadStatusController.deleteLeadStatus);

module.exports = router;
