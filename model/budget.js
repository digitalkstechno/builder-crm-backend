const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema(
  {
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Builder",
      required: true,
    },
    label: { type: String, required: true },
    minAmount: { type: Number, required: true },
    maxAmount: { type: Number, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Budget", BudgetSchema);
