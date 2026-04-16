const fs = require("fs");
const {
  createSiteService,
  fetchBuilderSitesService,
  deleteSiteService,
  updateSiteService,
  getSiteByIdService,
} = require("../service/site");

exports.createSite = async (req, res) => {
  try {
    // Handle uploaded images
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    }

    const rtRaw = req.body['requirementTypes'];
    const requirementTypes = rtRaw
      ? Array.isArray(rtRaw) ? rtRaw : [rtRaw]
      : [];

    const ptRaw = req.body['propertyTypes'];
    const propertyTypes = ptRaw
      ? Array.isArray(ptRaw) ? ptRaw : [ptRaw]
      : [];

    const budgetsRaw = req.body['budgets'];
    const budgets = budgetsRaw
      ? Array.isArray(budgetsRaw) ? budgetsRaw : [budgetsRaw]
      : [];

    const { requirementTypes: _rIgnore, propertyTypes: _pIgnore, ...restBody } = req.body;

    const siteData = {
      ...restBody,
      requirementTypes,
      propertyTypes,
      budgets,
      images: imageUrls
    };

    const site = await createSiteService(req.user.id, siteData);
    return res.status(201).json({
      status: "Success",
      message: "Site created successfully",
      data: site
    });
  } catch (error) {
    // Delete uploaded files if site creation failed
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        try { fs.unlinkSync(file.path); } catch (e) {}
      });
    }
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.fetchBuilderSites = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const { totalSites, siteData } = await fetchBuilderSitesService(req.user.id, { page, limit, search });

    return res.status(200).json({
      status: "Success",
      message: "Sites fetched successfully",
      pagination: {
        totalRecords: totalSites,
        currentPage: page,
        totalPages: Math.ceil(totalSites / limit),
        limit
      },
      data: siteData
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.deleteSite = async (req, res) => {
  try {
    await deleteSiteService(req.params.id, req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Site deleted successfully"
    });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.getAllSitesForAdmin = async (req, res) => {
  try {
    const { getAllSitesForAdminService } = require("../service/site");
    const sites = await getAllSitesForAdminService();
    return res.status(200).json({
      status: "Success",
      data: sites,
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.updateSiteStatus = async (req, res) => {
  try {
    const { updateSiteStatusService } = require("../service/site");
    const updatedSite = await updateSiteStatusService(req.params.id, req.body);
    return res.status(200).json({
      status: "Success",
      message: "Site status updated successfully",
      data: updatedSite,
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.updateSite = async (req, res) => {
  try {
    // Handle uploaded images
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      newImageUrls = req.files.map(file => `/uploads/${file.filename}`);
    }

    // Parse kept images from the request
    let keptImages = [];
    if (req.body.keptImages) {
      try {
        keptImages = JSON.parse(req.body.keptImages);
      } catch (e) {
        keptImages = [];
      }
    }

    const rtRaw = req.body['requirementTypes'];
    const requirementTypes = rtRaw
      ? Array.isArray(rtRaw) ? rtRaw : [rtRaw]
      : [];

    const ptRaw = req.body['propertyTypes'];
    const propertyTypes = ptRaw
      ? Array.isArray(ptRaw) ? ptRaw : [ptRaw]
      : [];

    const budgetsRaw = req.body['budgets'];
    const budgets = budgetsRaw
      ? Array.isArray(budgetsRaw) ? budgetsRaw : [budgetsRaw]
      : [];

    const { requirementTypes: _rIgnore, propertyTypes: _pIgnore, budgets: _bIgnore, keptImages: _ki, ...restBody } = req.body;

    const updateData = {
      ...restBody,
      requirementTypes,
      propertyTypes,
      budgets,
      images: [...keptImages, ...newImageUrls]
    };

    const updatedSite = await updateSiteService(req.params.id, req.user.id, updateData, keptImages);
    return res.status(200).json({
      status: "Success",
      message: "Site updated successfully",
      data: updatedSite
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.getSiteById = async (req, res) => {
  try {
    const site = await getSiteByIdService(req.params.id, req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Site fetched successfully",
      data: site
    });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.getSiteByWhatsappId = async (req, res) => {
  try {
    const site = await getSiteByWhatsappIdService(req.params.id, req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Site fetched successfully",
      data: site
    });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};