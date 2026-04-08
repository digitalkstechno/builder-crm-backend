const User = require("../model/user");
const Builder = require("../model/builder");
const Plan = require("../model/plan");
const PendingRegistration = require("../model/pendingRegistration");
const Payment = require("../model/payment");
const Staff = require("../model/staff");
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
    
    // Find all active users with this email (might have multiple for different builders now)
    const users = await User.find({ email, isDeleted: false });
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        status: "Fail",
        message: "Invalid email or password" 
      });
    }

    // Iterate and find the one with matching password
    let validUser = null;
    for (const user of users) {
      try {
        const decryptedPassword = decryptData(user.password);
        if (String(decryptedPassword) === String(password)) {
          validUser = user;
          break;
        }
      } catch (err) {
        // Skip if decryption fails for any reason
      }
    }

    if (!validUser) {
      return res.status(401).json({ 
        success: false, 
        status: "Fail",
        message: "Invalid email or password" 
      });
    }

    // Role check: Only BUILDER and STAFF allowed (Admins have their own panel)
    if (validUser.role !== "BUILDER" && validUser.role !== "STAFF") {
      return res.status(403).json({
        success: false,
        status: "Fail",
        message: "Admin accounts are not authorized to login here. Please use the Admin Panel."
      });
    }

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET_KEY);
    
    // Get builder context
    let builderData = null;
    if (validUser.role === "BUILDER") {
      builderData = await Builder.findOne({ userId: validUser._id });
    } else if (validUser.role === "STAFF") {
      // Find the builder this staff belongs to
      // First try using the scoped builderId on user record (for new users)
      // Otherwise, fallback to the Staff table (for backward compatibility)
      let targetBuilderId = validUser.builderId;
      
      if (!targetBuilderId) {
        const staffEntry = await Staff.findOne({ userId: validUser._id });
        if (staffEntry) {
          targetBuilderId = staffEntry.builderId;
        }
      }

      if (targetBuilderId) {
        builderData = await Builder.findById(targetBuilderId);
      }
    }

    res.status(200).json({
      success: true,
      status: "Success",
      message: "Welcome back!",
      data: { user: validUser, builder: builderData },
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
    if (!user) throw new Error("User not found");

    let builder = null;
    if (user.role === "BUILDER") {
      builder = await Builder.findOne({ userId });
    } else if (user.role === "STAFF") {
      // 1. Try from User record directly (New structure)
      if (user.builderId) {
        builder = await Builder.findById(user.builderId);
      }
      
      // 2. Fallback to Staff table (Old structure)
      if (!builder) {
        const staffEntry = await Staff.findOne({ userId });
        if (staffEntry) {
          builder = await Builder.findById(staffEntry.builderId);
        }
      }
    }
    
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
    
    // Check if fully registered as a builder
    const existingUser = await User.findOne({ phone, builderId: null });
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
    
    // Create order for both new and existing users (renewals)
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
const calculatePlanEndDate = (plan, startDate = new Date()) => {
  let endDate = new Date(startDate);
  if (plan.duration === "Monthly") endDate.setMonth(endDate.getMonth() + 1);
  else if (plan.duration === "Quarterly") endDate.setMonth(endDate.getMonth() + 3);
  else if (plan.duration === "Bi-Annually") endDate.setMonth(endDate.getMonth() + 6);
  else if (plan.duration === "Annually") endDate.setFullYear(endDate.getFullYear() + 1);
  else endDate.setMonth(endDate.getMonth() + 1); // Default to Monthly
  return endDate;
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
      planId,
      amountPaid,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const pending = await PendingRegistration.findOne({ phone, status: "pending" });
    if (!pending) {
      return res.status(400).json({ success: false, message: "No active payment found for this number. Please pay first." });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }], builderId: null });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email or phone already exists as a builder." });
    }

    const plan = await Plan.findById(pending.planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const newUser = new User({
      fullName,
      email,
      phone,
      password: encryptData(password),
      role: "BUILDER",
    });
    const savedUser = await newUser.save();

    const startDate = new Date();
    const endDate = calculatePlanEndDate(plan, startDate);

    // Initial Active Subscription Snapshot
    const activeSubscription = {
      planId: plan._id,
      planName: plan.planName,
      startDate,
      endDate,
      amountPaid: pending.amountPaid,
      noOfStaff: plan.noOfStaff,
      noOfSites: plan.noOfSites,
      noOfWhatsapp: plan.noOfWhatsapp,
      razorpayOrderId: pending.razorpayOrderId,
      razorpayPaymentId: pending.razorpayPaymentId,
      status: "active",
    };

    const newBuilder = new Builder({
      userId: savedUser._id,
      companyName,
      address,
      currentLimits: {
        noOfStaff: plan.noOfStaff,
        noOfSites: plan.noOfSites,
        noOfWhatsapp: plan.noOfWhatsapp,
      },
      subscriptions: [activeSubscription],
    });

    await newBuilder.save();

    pending.status = "completed";
    await pending.save();

    res.status(201).json({
      success: true,
      message: "Builder registered successfully",
      data: { user: savedUser, builder: newBuilder },
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
      amountPaid,
    } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }], builderId: null });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already registered as a builder." });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const newUser = new User({
      fullName,
      email,
      phone,
      password: encryptData(password),
      role: "BUILDER",
    });
    const savedUser = await newUser.save();

    const startDate = new Date();
    const endDate = calculatePlanEndDate(plan, startDate);

    const subscription = {
      planId: plan._id,
      planName: plan.planName,
      startDate,
      endDate,
      amountPaid,
      noOfStaff: plan.noOfStaff,
      noOfSites: plan.noOfSites,
      noOfWhatsapp: plan.noOfWhatsapp,
      razorpayOrderId: "MANUAL",
      razorpayPaymentId: "MANUAL",
      status: "active",
    };

    const newBuilder = new Builder({
      userId: savedUser._id,
      companyName,
      address,
      currentLimits: {
        noOfStaff: plan.noOfStaff,
        noOfSites: plan.noOfSites,
        noOfWhatsapp: plan.noOfWhatsapp,
      },
      subscriptions: [subscription],
    });

    await newBuilder.save();

    res.status(201).json({
      success: true,
      message: "Manual builder registration successful",
      data: { user: savedUser, builder: newBuilder },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const renewSubscription = async (req, res) => {
  try {
    const { builderId, planId, amountPaid, razorpayOrderId, razorpayPaymentId } = req.body;

    const builder = await Builder.findById(builderId);
    if (!builder) return res.status(404).json({ success: false, message: "Builder not found" });

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    // Find latest subscription to determine start date
    const latestSub = builder.subscriptions
      .filter(s => s.status !== "expired" && s.status !== "cancelled")
      .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0];

    let startDate = new Date();
    let status = "active";

    if (latestSub && new Date(latestSub.endDate) > new Date()) {
      startDate = new Date(latestSub.endDate);
      status = "upcoming";
    }

    const endDate = calculatePlanEndDate(plan, startDate);

    const newSubscription = {
      planId: plan._id,
      planName: plan.planName,
      startDate,
      endDate,
      amountPaid,
      noOfStaff: plan.noOfStaff,
      noOfSites: plan.noOfSites,
      noOfWhatsapp: plan.noOfWhatsapp,
      razorpayOrderId: razorpayOrderId || "MANUAL",
      razorpayPaymentId: razorpayPaymentId || "MANUAL",
      status,
    };

    builder.subscriptions.push(newSubscription);

    // If it's starting now, update global limits
    if (status === "active") {
      builder.currentLimits = {
        noOfStaff: plan.noOfStaff,
        noOfSites: plan.noOfSites,
        noOfWhatsapp: plan.noOfWhatsapp,
      };
    }

    await builder.save();

    res.status(200).json({
      success: true,
      message: status === "upcoming" ? "Subscription queued successfully" : "Subscription renewed successfully",
      data: builder
    });
  } catch (error) {
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
  renewSubscription,
};
