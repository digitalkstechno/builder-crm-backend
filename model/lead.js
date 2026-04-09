const mongoose = require("mongoose");

const LeadSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      required: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
    },
    siteName: {
      type: String,
      required: true, // Store site name for quick access
    },
    source: {
      type: String,
      enum: ['WhatsApp', 'Facebook', 'Website', 'Walk-in', 'Referral'],
      required: true,
    },
    budget: {
      type: String,
      required: true,
    },
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeadStatus",
      required: true,
    },
    stageName: {
      type: String,
      required: true, // Store stage name for quick access
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    agentName: {
      type: String, // Store agent name for quick access
    },
    notes: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", LeadSchema);