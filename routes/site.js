const express = require("express");
const router = express.Router();
const siteController = require("../controller/siteController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(authMiddleware);

const uploadFields = upload.fields([
  { name: 'images', maxCount: 10 },
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