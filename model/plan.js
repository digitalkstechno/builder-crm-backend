const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true },
    price: { type: Number, required: true },
    duration: {
      type: String,
      enum: ["Monthly", "Quarterly", "Bi-Annually", "Annually"],
      required: true,
    },
    noOfStaff: { type: Number, default: 0 },
    noOfSites: { type: Number, default: 0 },
    noOfWhatsapp: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", PlanSchema);
