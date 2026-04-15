const express = require("express");
const router = express.Router();
const Site = require("../model/site");
const mongoose = require("mongoose");

// GET /public/builders/:builderId/cities
// Returns distinct cities from active sites of a builder
router.get("/builders/:builderId/cities", async (req, res) => {
  try {
    const { builderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      return res.status(400).json({ status: "Fail", message: "Invalid builderId" });
    }

    const cities = await Site.distinct("city", {
      builderId: new mongoose.Types.ObjectId(builderId),
      isDeleted: false,
      deleteRequested: false,
      isActive: true,
    });

    return res.status(200).json({ status: "Success", data: cities.sort() });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
});

// GET /public/builders/:builderId/cities/:city/areas
// Returns distinct areas for a city from active sites of a builder
router.get("/builders/:builderId/cities/:city/areas", async (req, res) => {
  try {
    const { builderId, city } = req.params;

    if (!mongoose.Types.ObjectId.isValid(builderId)) {
      return res.status(400).json({ status: "Fail", message: "Invalid builderId" });
    }

    const areas = await Site.distinct("area", {
      builderId: new mongoose.Types.ObjectId(builderId),
      city: { $regex: new RegExp(`^${city}$`, "i") },
      isDeleted: false,
      deleteRequested: false,
      isActive: true,
    });

    return res.status(200).json({ status: "Success", data: areas.sort() });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
});

module.exports = router;
