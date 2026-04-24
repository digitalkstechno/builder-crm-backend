const express = require("express");
const router = express.Router();
const whatsappController = require("../controller/whatsappController");
const authMiddleware = require("../middleware/auth");

// All whatsapp routes require authentication
router.use(authMiddleware);

// Builder Routes
router.post("/", whatsappController.addWhatsapp);
router.get("/", whatsappController.getWhatsappList);
router.put("/:id", whatsappController.updateWhatsapp);
router.delete("/:id", whatsappController.deleteWhatsapp);

// Admin Routes
router.get("/admin/all", whatsappController.getAdminWhatsappList);
router.patch("/admin/:id/status", whatsappController.updateWhatsappStatus);

module.exports = router;
