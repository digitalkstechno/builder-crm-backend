const {
  createStaffService,
  fetchBuilderStaffService,
  updateStaffService,
  deleteStaffService,
  getStaffDropdownService,
} = require("../service/staff");

exports.createStaff = async (req, res) => {
  try {
    // req.user.id is the ID of the logged-in builder (User model)
    const staffDetails = await createStaffService(req.user.id, req.body);
    return res.status(201).json({ 
      status: "Success", 
      message: "Staff member added successfully", 
      data: staffDetails 
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.fetchBuilderStaff = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    
    const { totalStaff, staffData } = await fetchBuilderStaffService(req.user.id, { page, limit, search });
    
    return res.status(200).json({
      status: "Success",
      message: "Staff fetched successfully",
      pagination: { 
        totalRecords: totalStaff, 
        currentPage: page, 
        totalPages: Math.ceil(totalStaff / limit), 
        limit 
      },
      data: staffData,
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const updatedStaff = await updateStaffService(req.params.id, req.user.id, req.body);
    return res.status(200).json({ 
      status: "Success", 
      message: "Staff updated successfully", 
      data: updatedStaff 
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    await deleteStaffService(req.params.id, req.user.id);
    return res.status(200).json({ 
      status: "Success", 
      message: "Staff deleted successfully" 
    });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.getStaffDropdown = async (req, res) => {
  try {
    const staffList = await getStaffDropdownService(req.user.id);
    return res.status(200).json({ 
      status: "Success", 
      message: "Staff dropdown data fetched successfully", 
      data: staffList 
    });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

