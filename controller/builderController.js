const User = require("../model/user");
const Builder = require("../model/builder");
const Plan = require("../model/plan");
const PendingRegistration = require("../model/pendingRegistration");
const Payment = require("../model/payment");
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

    // VERY IMPORTANT: VERIFY SIGNATURE BEFORE SAVING
    const secret = process.env.RAZORPAY_KEY_SECRET || "razorpay_secret_placeholder";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generated_signature !== razorpaySignature) {
      console.error("Payment Verification Failed!");
      
      // Still log it as failed for security audit
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { razorpayPaymentId, razorpaySignature, status: "failed" }
      );

      return res.status(400).json({ success: false, message: "Invalid payment signature. Verification failed." });
    }

    // Update the payment record as verified
    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { razorpayPaymentId, razorpaySignature, status: "verified" }
    );

    // Upsert pending registration ONLY IF verified
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

    res.status(200).json({ success: true, message: "Payment verified and saved successfully", data: pending });
  } catch (error) {
    console.error("Save Payment Info Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { amount, planId, phone } = req.body;
    
    // Check if there is already a PAID payment or existing user
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already registered." });
    }

    const alreadyPaid = await PendingRegistration.findOne({ phone, status: "pending" });
    if (alreadyPaid) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment already confirmed for this number. Please complete registration.",
        resume: true 
      });
    }

    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `receipt_phone_${phone}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Track the payment attempt
    const payment = new Payment({
      phone,
      planId,
      amount,
      razorpayOrderId: order.id,
      status: "created"
    });
    await payment.save();
    
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
    if (!pending) {
      return res.status(400).json({ success: false, message: "No active payment found for this number. Please pay first." });
    }

    finalPlanId = pending.planId;
    finalAmountPaid = pending.amountPaid;
    finalOrderId = pending.razorpayOrderId;
    finalPaymentId = pending.razorpayPaymentId;
    finalSignature = pending.razorpaySignature;

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
      password: encryptData(password),
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
      password: encryptData(password),
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

const getAllBuilders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { isDeleted: false };
    
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const totalItems = await Builder.countDocuments(query);
    const builders = await Builder.find(query)
      .populate("userId", "fullName email phone status")
      .populate("planId", "planName price duration noOfStaff noOfSites noOfWhatsapp")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      status: "Success",
      data: builders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Get All Builders Error:", error);
    res.status(500).json({ success: false, status: "Fail", message: error.message });
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
  getAllBuilders,
};
