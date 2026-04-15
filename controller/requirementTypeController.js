const {
  fetchRequirementTypesService,
  createRequirementTypeService,
  updateRequirementTypeService,
  deleteRequirementTypeService,
} = require("../service/requirementType");

exports.fetchRequirementTypes = async (req, res) => {
  try {
    const data = await fetchRequirementTypesService(req.user.id);
    return res.status(200).json({ status: "Success", data });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.createRequirementType = async (req, res) => {
  try {
    const data = await createRequirementTypeService(req.user.id, req.body);
    return res.status(201).json({ status: "Success", message: "Created successfully", data });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.updateRequirementType = async (req, res) => {
  try {
    const data = await updateRequirementTypeService(req.params.id, req.user.id, req.body);
    return res.status(200).json({ status: "Success", message: "Updated successfully", data });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.deleteRequirementType = async (req, res) => {
  try {
    await deleteRequirementTypeService(req.params.id, req.user.id);
    return res.status(200).json({ status: "Success", message: "Deleted successfully" });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};
