const Budget = require("../model/budget");
const Builder = require("../model/builder");

const getBuilder = async (userId) => {
  const builder = await Builder.findOne({ userId });
  if (!builder) throw new Error("Builder not found");
  return builder;
};

exports.fetchBudgetsService = async (userId) => {
  const builder = await getBuilder(userId);
  return await Budget.find({ builderId: builder._id, isDeleted: false }).sort({ minAmount: 1 });
};

exports.createBudgetService = async (userId, data) => {
  const builder = await getBuilder(userId);
  const exists = await Budget.findOne({ builderId: builder._id, label: data.label, isDeleted: false });
  if (exists) throw new Error("Budget range already exists");
  return await Budget.create({ ...data, builderId: builder._id });
};

exports.updateBudgetService = async (id, userId, data) => {
  const builder = await getBuilder(userId);
  const item = await Budget.findOne({ _id: id, builderId: builder._id });
  if (!item) throw new Error("Budget not found");
  return await Budget.findByIdAndUpdate(id, { label: data.label, minAmount: data.minAmount, maxAmount: data.maxAmount }, { new: true });
};

exports.deleteBudgetService = async (id, userId) => {
  const builder = await getBuilder(userId);
  const item = await Budget.findOne({ _id: id, builderId: builder._id });
  if (!item) throw new Error("Budget not found");
  item.isDeleted = true;
  await item.save();
};
