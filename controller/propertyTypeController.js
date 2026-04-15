const {
  fetchPropertyTypesService,
  createPropertyTypeService,
  updatePropertyTypeService,
  deletePropertyTypeService,
} = require("../service/propertyType");

exports.fetchPropertyTypes = async (req, res) => {
  try {
    const data = await fetchPropertyTypesService(req.user.id);
    return res.status(200).json({ status: "Success", data });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.createPropertyType = async (req, res) => {
  try {
    const data = await createPropertyTypeService(req.user.id, req.body);
    return res.status(201).json({ status: "Success", message: "Created successfully", data });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.updatePropertyType = async (req, res) => {
  try {
    const data = await updatePropertyTypeService(req.params.id, req.user.id, req.body);
    return res.status(200).json({ status: "Success", message: "Updated successfully", data });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.deletePropertyType = async (req, res) => {
  try {
    await deletePropertyTypeService(req.params.id, req.user.id);
    return res.status(200).json({ status: "Success", message: "Deleted successfully" });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};
