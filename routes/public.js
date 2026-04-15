const express = require("express");
const router = express.Router();
const { getSiteById, getBuilderCities, getBuilderCityAreas, getUserIdByPhone, createPublicLead, getBuilderRequirementTypes, getBuilderPropertyTypes, getBuilderBudgets, getBuilderSites, getBuilderPublicProfile, createPublicLeadWithDetails } = require("../controller/publicController");


router.get("/user-by-phone/:phone", getUserIdByPhone);
router.post("/leads", createPublicLead);
router.get("/builders/:builderId", getBuilderPublicProfile);
router.get("/builders/:builderId/requirement-types", getBuilderRequirementTypes);
router.get("/builders/:builderId/property-types", getBuilderPropertyTypes);
router.get("/builders/:builderId/budgets", getBuilderBudgets);
router.get("/builders/:builderId/cities", getBuilderCities);
router.get("/builders/:builderId/cities/:city/areas", getBuilderCityAreas);
router.get("/builders/:builderId/sites", getBuilderSites);
router.post("/builders/:builderId/leads", createPublicLeadWithDetails);




router.get("/sites/:siteId", getSiteById);
module.exports = router;
