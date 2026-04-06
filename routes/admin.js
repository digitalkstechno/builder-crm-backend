const express = require("express");
const router = express.Router();
const User = require("../model/user");
const { decryptData } = require("../utils/crypto");
const jwt = require("jsonwebtoken");

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

module.exports = router;
