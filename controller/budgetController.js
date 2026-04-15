const { fetchBudgetsService, createBudgetService, updateBudgetService, deleteBudgetService } = require("../service/budget");

exports.fetchBudgets = async (req, res) => {
  try {
    const data = await fetchBudgetsService(req.user.id);
    return res.status(200).json({ status: "Success", data });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.createBudget = async (req, res) => {
  try {
    const data = await createBudgetService(req.user.id, req.body);
    return res.status(201).json({ status: "Success", message: "Created successfully", data });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const data = await updateBudgetService(req.params.id, req.user.id, req.body);
    return res.status(200).json({ status: "Success", message: "Updated successfully", data });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    await deleteBudgetService(req.params.id, req.user.id);
    return res.status(200).json({ status: "Success", message: "Deleted successfully" });
  } catch (error) {
    return res.status(400).json({ status: "Fail", message: error.message });
  }
};
