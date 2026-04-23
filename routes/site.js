const express = require("express");
const router = express.Router();
const siteController = require("../controller/siteController");
const whatsappConfigController = require("../controller/whatsappConfigController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(authMiddleware);

// Admin WhatsApp Config Routes
router.post("/admin/whatsapp-config", whatsappConfigController.updateWhatsappConfig);
router.get("/admin/whatsapp-config/:number", whatsappConfigController.getWhatsappConfigByNumber);

const uploadFields = upload.fields([
  { name: 'images', maxCount: 6 },
  { name: 'brochure', maxCount: 1 }
]);

router.post("/", uploadFields, siteController.createSite);
router.get("/", siteController.fetchBuilderSites);
router.get("/admin/all", siteController.getAllSitesForAdmin);
router.get("/:id", siteController.getSiteById);
router.put("/:id", uploadFields, siteController.updateSite);
router.patch("/:id/status", siteController.updateSiteStatus);
router.delete("/:id", siteController.deleteSite);
router.get("/whatsapp/:id", siteController.getSiteByWhatsappId);

module.exports = router;