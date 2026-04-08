const mongoose = require("mongoose");

const LeadStatusSchema = new mongoose.Schema(
  {
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Builder",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    key: {
      type: String, // 'NEW', 'WON', 'LOST', or 'CUSTOM'
      default: 'CUSTOM'
    },
    color: {
      type: String,
      default: "#cbd5e1", // Default slate color
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeadStatus", LeadStatusSchema);
