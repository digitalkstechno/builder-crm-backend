const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: { 
      type: String, 
      enum: ["created", "paid", "failed", "verified"], 
      default: "created" 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
