const User = require("../model/user");
const Builder = require("../model/builder");
const Plan = require("../model/plan");
const PendingRegistration = require("../model/pendingRegistration");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const { encryptData, decryptData } = require("../utils/crypto");
const jwt = require("jsonwebtoken");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "razorpay_secret_placeholder",
});

const builderLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find only with role BUILDER
    const user = await User.findOne({ email, role: "BUILDER", isDeleted: false });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        status: "Fail",
        message: "Only builders can login here" 
      });
    }

    const decryptedPassword = decryptData(user.password);
    if (String(decryptedPassword) !== String(password)) {
      return res.status(401).json({ 
        success: false, 
        status: "Fail",
        message: "Invalid email or password" 
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY);
    const builder = await Builder.findOne({ userId: user._id });

    res.status(200).json({
      success: true,
      status: "Success",
      message: "Welcome back!",
      data: { user, builder },
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, status: "Fail", message: error.message });
  }
};

const getBuilderProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    const builder = await Builder.findOne({ userId });
    
    res.status(200).json({
      success: true,
      status: "Success",
      data: { user, builder }
    });
  } catch (error) {
    res.status(500).json({ success: false, status: "Fail", message: error.message });
  }
};

const checkPhoneStatus = async (req, res) => {
  try {
    const { phone } = req.body;
    
    // Check if fully registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(200).json({ 
        success: true, 
        status: "ALREADY_REGISTERED",
        message: "User already registered" 
      });
    }

    // Check if payment done but registration pending
    const pending = await PendingRegistration.findOne({ phone, status: "pending" }).populate('planId');
    if (pending) {
      return res.status(200).json({ 
        success: true, 
        status: "PAYMENT_DONE_PENDING_DETAILS",
        data: pending 
      });
    }

    return res.status(200).json({ 
      success: true, 
      status: "NEW_USER" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const savePaymentInfo = async (req, res) => {
  try {
    const { phone, planId, amountPaid, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Upsert pending registration
    const pending = await PendingRegistration.findOneAndUpdate(
      { phone },
      { 
        planId, 
        amountPaid, 
        razorpayOrderId, 
        razorpayPaymentId, 
        razorpaySignature,
        status: "pending" 
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { amount, planId } = req.body;
    
    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const registerBuilder = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      companyName,
      address,
      // These are optional if we have pending registration
      planId,
      amountPaid,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    // 0. Find Pending Registration if any
    let finalPlanId = planId;
    let finalAmountPaid = amountPaid;
    let finalOrderId = razorpayOrderId;
    let finalPaymentId = razorpayPaymentId;
    let finalSignature = razorpaySignature;

    const pending = await PendingRegistration.findOne({ phone, status: "pending" });
    if (pending) {
      finalPlanId = pending.planId;
      finalAmountPaid = pending.amountPaid;
      finalOrderId = pending.razorpayOrderId;
      finalPaymentId = pending.razorpayPaymentId;
      finalSignature = pending.razorpaySignature;
    }

    // 1. Create User
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User with this email or phone already exists." 
      });
    }

    const newUser = new User({
      fullName,
      email,
      phone,
      password, // Password hashing normally happens in pre-save or controller
      role: "BUILDER",
    });

    const savedUser = await newUser.save();

    // 2. Fetch Plan to calculate duration
    const plan = await Plan.findById(finalPlanId);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    let endDate = new Date();
    if (plan.duration === "Monthly") endDate.setMonth(endDate.getMonth() + 1);
    else if (plan.duration === "Quarterly") endDate.setMonth(endDate.getMonth() + 3);
    else if (plan.duration === "Bi-Annually") endDate.setMonth(endDate.getMonth() + 6);
    else if (plan.duration === "Annually") endDate.setFullYear(endDate.getFullYear() + 1);

    // 3. Create Builder record
    const newBuilder = new Builder({
      userId: savedUser._id,
      planId: finalPlanId,
      companyName,
      address,
      amountPaid: finalAmountPaid,
      razorpayOrderId: finalOrderId,
      razorpayPaymentId: finalPaymentId,
      razorpaySignature: finalSignature,
      subscriptionEndDate: endDate,
    });

    await newBuilder.save();

    // 4. Mark pending as completed
    if (pending) {
      pending.status = "completed";
      await pending.save();
    }

    res.status(201).json({
      success: true,
      message: "Builder registered successfully",
      data: {
        user: savedUser,
        builder: newBuilder,
      },
    });
  } catch (error) {
    console.error("Register Builder Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const extraManualRegister = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      companyName,
      address,
      planId,
      amountPaid, // Manual price
    } = req.body;

    // Similar logic to registerBuilder but without razorpay verification
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User with this email or phone already exists." 
      });
    }

    const newUser = new User({
      fullName,
      email,
      phone,
      password,
      role: "BUILDER",
    });

    const savedUser = await newUser.save();
    
    const plan = await Plan.findById(planId);
    let endDate = new Date();
    if (plan) {
        if (plan.duration === "Monthly") endDate.setMonth(endDate.getMonth() + 1);
        else if (plan.duration === "Quarterly") endDate.setMonth(endDate.getMonth() + 3);
        else if (plan.duration === "Bi-Annually") endDate.setMonth(endDate.getMonth() + 6);
        else if (plan.duration === "Annually") endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
        // If plan is not found, default to 1 month
        endDate.setMonth(endDate.getMonth() + 1);
    }

    const newBuilder = new Builder({
      userId: savedUser._id,
      planId: planId,
      companyName,
      address,
      amountPaid, // Custom price
      subscriptionEndDate: endDate,
      razorpayOrderId: "MANUAL",
      razorpayPaymentId: "MANUAL",
    });

    await newBuilder.save();

    res.status(201).json({
      success: true,
      message: "Manual builder registration successful",
      data: {
        user: savedUser,
        builder: newBuilder,
      },
    });
  } catch (error) {
    console.error("Manual Register Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkPhoneStatus,
  savePaymentInfo,
  createOrder,
  registerBuilder,
  extraManualRegister,
  builderLogin,
  getBuilderProfile,
};
