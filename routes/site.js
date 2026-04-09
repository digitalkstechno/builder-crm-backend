const express = require("express");
const router = express.Router();
const siteController = require("../controller/siteController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(authMiddleware);

router.post("/", upload.array('images', 10), siteController.createSite);
router.get("/", siteController.fetchBuilderSites);
router.get("/:id", siteController.getSiteById);
router.put("/:id", upload.array('images', 10), siteController.updateSite);
router.delete("/:id", siteController.deleteSite);

module.exports = router;