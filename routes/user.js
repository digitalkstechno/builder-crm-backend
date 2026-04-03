var express = require("express");
var router = express.Router();
const createUploader = require("../utils/multer");
const upload = createUploader("images/UserProfileImages");
let {
  createUser,
  loginUser,
  fetchAllUsers,
  fetchUserById,
  userUpdate,
  userDelete,
  getCurrentUser,
} = require("../controller/user");
const authMiddleware = require("../middleware/auth");

router.post("/create", createUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getCurrentUser);
router.get("/", authMiddleware, fetchAllUsers);
router.get("/:id", authMiddleware, fetchUserById);
router.put("/:id", authMiddleware, userUpdate);
router.delete("/:id", authMiddleware, userDelete);

module.exports = router;
