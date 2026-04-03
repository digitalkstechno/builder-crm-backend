const express = require("express");
const router = express.Router();
const {
  createPlan,
  fetchAllPlans,
  fetchPlanById,
  planUpdate,
  planDelete,
} = require("../controller/plan");
const authMiddleware = require("../middleware/auth");

router.post("/", authMiddleware, createPlan);
router.get("/", fetchAllPlans);
router.get("/:id", fetchPlanById);
router.put("/:id", authMiddleware, planUpdate);
router.delete("/:id", authMiddleware, planDelete);

module.exports = router;
