const {
  createLeadService,
  fetchBuilderLeadsService,
  deleteLeadService,
  updateLeadService,
  getLeadByIdService,
  getLeadStatusesService,
  getStaffDropdownService,
  getSitesDropdownService,
  getSiteTeamMembersService,
} = require("../service/lead");

exports.createLead = async (req, res) => {
  try {
    const lead = await createLeadService(req.user.id, req.body);
    return res.status(201).json({
      status: "Success",
      message: "Lead created successfully",
      data: lead
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.fetchBuilderLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const { totalLeads, leadData } = await fetchBuilderLeadsService(req.user.id, { page, limit, search });

    return res.status(200).json({
      status: "Success",
      message: "Leads fetched successfully",
      pagination: {
        totalRecords: totalLeads,
        currentPage: page,
        totalPages: Math.ceil(totalLeads / limit),
        limit
      },
      data: leadData
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    await deleteLeadService(req.params.id, req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Lead deleted successfully"
    });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const updatedLead = await updateLeadService(req.params.id, req.user.id, req.body);
    return res.status(200).json({
      status: "Success",
      message: "Lead updated successfully",
      data: updatedLead
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.getLeadById = async (req, res) => {
  try {
    const lead = await getLeadByIdService(req.params.id, req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Lead fetched successfully",
      data: lead
    });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.getLeadStatuses = async (req, res) => {
  try {
    const statuses = await getLeadStatusesService(req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Lead statuses fetched successfully",
      data: statuses
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.getStaffDropdown = async (req, res) => {
  try {
    const staff = await getStaffDropdownService(req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Staff fetched successfully",
      data: staff
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.getSitesDropdown = async (req, res) => {
  try {
    const sites = await getSitesDropdownService(req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Sites fetched successfully",
      data: sites
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.getSiteTeamMembers = async (req, res) => {
  try {
    const { siteId } = req.params;
    const teamMembers = await getSiteTeamMembersService(siteId, req.user.id);
    return res.status(200).json({
      status: "Success",
      message: "Site team members fetched successfully",
      data: teamMembers
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};