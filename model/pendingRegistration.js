const mongoose = require("mongoose");

const PendingRegistrationSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    amountPaid: { type: Number, required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, required: true },
    razorpaySignature: { type: String, required: true },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingRegistration", PendingRegistrationSchema);
