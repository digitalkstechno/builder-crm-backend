const express = require("express");
const router = express.Router();
const ctrl = require("../controller/budgetController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/", ctrl.fetchBudgets);
router.post("/", ctrl.createBudget);
router.put("/:id", ctrl.updateBudget);
router.delete("/:id", ctrl.deleteBudget);

module.exports = router;
