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

router.post("/", createPlan);
router.get("/", fetchAllPlans);
router.get("/:id", fetchPlanById);
router.put("/:id", planUpdate);
router.delete("/:id", planDelete);

module.exports = router;
