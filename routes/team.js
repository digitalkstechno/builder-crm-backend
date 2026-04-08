const express = require("express");
const router = express.Router();
const teamController = require("../controller/teamController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.post("/", teamController.createTeam);
router.get("/", teamController.fetchBuilderTeams);
router.put("/:id", teamController.updateTeam);
router.delete("/:id", teamController.deleteTeam);

module.exports = router;
