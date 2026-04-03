const {
  createPlanService,
  fetchAllPlansService,
  fetchPlanByIdService,
  planUpdateService,
  planDeleteService,
} = require("../service/plan");

exports.createPlan = async (req, res) => {
  try {
    const planDetails = await createPlanService(req.body);
    return res.status(201).json({ status: "Success", message: "Plan created successfully", data: planDetails });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.fetchAllPlans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const { totalPlans, plansData } = await fetchAllPlansService({ page, limit, search });
    return res.status(200).json({
      status: "Success",
      message: "Plans fetched successfully",
      pagination: { totalRecords: totalPlans, currentPage: page, totalPages: Math.ceil(totalPlans / limit), limit },
      data: plansData,
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.fetchPlanById = async (req, res) => {
  try {
    const planData = await fetchPlanByIdService(req.params.id);
    return res.status(200).json({ status: "Success", message: "Plan fetched successfully", data: planData });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.planUpdate = async (req, res) => {
  try {
    const updatedPlan = await planUpdateService(req.params.id, req.body);
    return res.status(200).json({ status: "Success", message: "Plan updated successfully", data: updatedPlan });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};

exports.planDelete = async (req, res) => {
  try {
    await planDeleteService(req.params.id);
    return res.status(200).json({ status: "Success", message: "Plan deleted successfully" });
  } catch (error) {
    return res.status(404).json({ status: "Fail", message: error.message });
  }
};
