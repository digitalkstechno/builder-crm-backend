const express = require("express");
const router = express.Router();
const User = require("../model/user");
const { decryptData } = require("../utils/crypto");
const jwt = require("jsonwebtoken");
const { createBuilder, updateBuilder, deleteBuilder, getBuilderById, getAllBuilders } = require("../controller/builderController");

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find only with role ADMIN
    const user = await User.findOne({ email, role: "ADMIN", isDeleted: false });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Only super administrators can login here"
      });
    }

    const decryptedPassword = decryptData(user.password);
    if (String(decryptedPassword) !== String(password)) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials"
      });
    }

    const token = jwt.sign({ id: user._id, role: "ADMIN" }, process.env.JWT_SECRET_KEY);

    res.status(200).json({
      success: true,
      message: "Welcome Super Admin!",
      data: { user },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Builder Management Routes
router.use("/builders", verifyAdmin);

router.get("/builders", getAllBuilders);
router.get("/builders/:id", getBuilderById);
router.post("/builders", createBuilder);
router.put("/builders/:id", updateBuilder);
router.delete("/builders/:id", deleteBuilder);

module.exports = router;
