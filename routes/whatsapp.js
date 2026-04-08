const express = require("express");
const router = express.Router();
const whatsappController = require("../controller/whatsappController");
const authMiddleware = require("../middleware/auth");

// All whatsapp routes require authentication
router.use(authMiddleware);

router.post("/", whatsappController.addWhatsapp);
router.get("/", whatsappController.getWhatsappList);
router.put("/:id", whatsappController.updateWhatsapp);
router.delete("/:id", whatsappController.deleteWhatsapp);

module.exports = router;
