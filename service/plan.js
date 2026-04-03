const PLAN = require("../model/plan");

exports.createPlanService = async (planData) => {
  const plan = await PLAN.create(planData);
  return plan;
};

exports.fetchAllPlansService = async ({ page, limit, search }) => {
  const skip = (page - 1) * limit;
  const query = { isDeleted: false };
  if (search) {
    query.planName = { $regex: search, $options: "i" };
  }
  const totalPlans = await PLAN.countDocuments(query);
  const plansData = await PLAN.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
  return { totalPlans, plansData, page, limit };
};

exports.fetchPlanByIdService = async (planId) => {
  const planData = await PLAN.findOne({ _id: planId, isDeleted: false });
  if (!planData) throw new Error("Plan not found");
  return planData;
};

exports.planUpdateService = async (planId, body) => {
  const updatedPlan = await PLAN.findOneAndUpdate({ _id: planId, isDeleted: false }, body, { new: true });
  if (!updatedPlan) throw new Error("Plan not found");
  return updatedPlan;
};

exports.planDeleteService = async (planId) => {
  const plan = await PLAN.findOneAndUpdate({ _id: planId, isDeleted: false }, { isDeleted: true }, { new: true });
  if (!plan) throw new Error("Plan not found");
};
