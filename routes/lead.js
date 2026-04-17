const express = require("express");
const router = express.Router();
const multer = require("multer");
const leadController = require("../controller/leadController");
const authMiddleware = require("../middleware/auth");

// Memory storage for Excel import (no disk write needed)
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.post("/", leadController.createLead);
router.get("/", leadController.fetchBuilderLeads);
router.get("/today-counts", leadController.getTodayCounts);
router.get("/statuses", leadController.getLeadStatuses);
router.get("/staff-dropdown", leadController.getStaffDropdown);
router.get("/sites-dropdown", leadController.getSitesDropdown);
router.get("/site-team-members/:siteId", leadController.getSiteTeamMembers);
router.get("/export-excel", leadController.exportLeads);
router.get("/sample-excel-data", leadController.getSampleExcelData);
router.get("/sample-excel", leadController.downloadSampleExcel);
router.post("/import-excel", upload.single("file"), leadController.importLeads);
router.get("/:id", leadController.getLeadById);
router.put("/:id", leadController.updateLead);
router.delete("/:id", leadController.deleteLead);

// Followup routes
router.post("/followup", leadController.createFollowup);
router.get("/:leadId/followups", leadController.getLeadFollowups);
router.put("/followup/:id", leadController.updateFollowup);
router.delete("/followup/:id", leadController.deleteFollowup);

module.exports = router;