const RequirementType = require("../model/requirementType");
const Builder = require("../model/builder");

exports.fetchRequirementTypesService = async (builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");
  return await RequirementType.find({ builderId: builder._id, isDeleted: false }).sort({ createdAt: 1 });
};

exports.createRequirementTypeService = async (builderUserId, data) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");
  const exists = await RequirementType.findOne({ builderId: builder._id, name: data.name, isDeleted: false });
  if (exists) throw new Error("Requirement type already exists");
  return await RequirementType.create({ ...data, builderId: builder._id });
};

exports.updateRequirementTypeService = async (id, builderUserId, data) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");
  const item = await RequirementType.findOne({ _id: id, builderId: builder._id });
  if (!item) throw new Error("Requirement type not found");
  return await RequirementType.findByIdAndUpdate(id, { name: data.name }, { new: true });
};

exports.deleteRequirementTypeService = async (id, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");
  const item = await RequirementType.findOne({ _id: id, builderId: builder._id });
  if (!item) throw new Error("Requirement type not found");
  item.isDeleted = true;
  await item.save();
};
