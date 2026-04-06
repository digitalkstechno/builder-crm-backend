const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    required: true,
  },
  planName: { type: String }, // Snapshot of plan name
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  amountPaid: { type: Number, required: true },
  noOfStaff: { type: Number, default: 0 }, // Snapshot
  noOfSites: { type: Number, default: 0 }, // Snapshot
  noOfWhatsapp: { type: Number, default: 0 }, // Snapshot
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  status: {
    type: String,
    enum: ["active", "upcoming", "expired", "cancelled"],
    default: "active",
  },
}, { timestamps: true });

const BuilderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: { type: String },
    address: { type: String },
    
    // Current active limits (for quick access)
    currentLimits: {
      noOfStaff: { type: Number, default: 0 },
      noOfSites: { type: Number, default: 0 },
      noOfWhatsapp: { type: Number, default: 0 },
    },
    
    // Detailed history and future plans
    subscriptions: [SubscriptionSchema],
    
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Builder", BuilderSchema);
