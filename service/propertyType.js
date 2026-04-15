const PropertyType = require("../model/propertyType");
const Builder = require("../model/builder");

exports.fetchPropertyTypesService = async (builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");
  return await PropertyType.find({ builderId: builder._id, isDeleted: false }).sort({ createdAt: 1 });
};

exports.createPropertyTypeService = async (builderUserId, data) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");
  const exists = await PropertyType.findOne({ builderId: builder._id, name: data.name, isDeleted: false });
  if (exists) throw new Error("Property type already exists");
  return await PropertyType.create({ ...data, builderId: builder._id });
};

exports.updatePropertyTypeService = async (id, builderUserId, data) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");
  const item = await PropertyType.findOne({ _id: id, builderId: builder._id });
  if (!item) throw new Error("Property type not found");
  return await PropertyType.findByIdAndUpdate(id, { name: data.name }, { new: true });
};

exports.deletePropertyTypeService = async (id, builderUserId) => {
  const builder = await Builder.findOne({ userId: builderUserId });
  if (!builder) throw new Error("Builder not found");
  const item = await PropertyType.findOne({ _id: id, builderId: builder._id });
  if (!item) throw new Error("Property type not found");
  item.isDeleted = true;
  await item.save();
};
