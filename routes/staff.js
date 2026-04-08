const express = require("express");
const router = express.Router();
const staffController = require("../controller/staffController");
const authMiddleware = require("../middleware/auth");

// All staff routes require authentication
router.use(authMiddleware);

router.post("/", staffController.createStaff);
router.get("/", staffController.fetchBuilderStaff);
router.get("/dropdown", staffController.getStaffDropdown);
router.put("/:id", staffController.updateStaff);
router.delete("/:id", staffController.deleteStaff);

module.exports = router;
