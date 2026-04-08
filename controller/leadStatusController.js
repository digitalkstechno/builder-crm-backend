const {
  fetchLeadStatusesService,
  updateLeadStatusService,
  reorderStatusesService,
  createLeadStatusService,
  deleteLeadStatusService,
} = require("../service/leadStatus");

exports.fetchLeadStatuses = async (req, res) => {
  try {
    const statuses = await fetchLeadStatusesService(req.user.id);
    return res.status(200).json({ 
      status: "Success", 
      message: "Lead statuses fetched successfully", 
      data: statuses 
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.updateLeadStatus = async (req, res) => {
  try {
    const status = await updateLeadStatusService(req.params.id, req.user.id, req.body);
    return res.status(200).json({ 
      status: "Success", 
      message: "Lead status updated successfully", 
      data: status 
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.reorderLeadStatuses = async (req, res) => {
  try {
    await reorderStatusesService(req.user.id, req.body.orderings);
    return res.status(200).json({ 
      status: "Success", 
      message: "Lead statuses reordered successfully"
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.createLeadStatus = async (req, res) => {
  try {
    const status = await createLeadStatusService(req.user.id, req.body);
    return res.status(201).json({ 
      status: "Success", 
      message: "Lead status created successfully", 
      data: status 
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.deleteLeadStatus = async (req, res) => {
  try {
    await deleteLeadStatusService(req.params.id, req.user.id);
    return res.status(200).json({ 
      status: "Success", 
      message: "Lead status deleted successfully" 
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};
