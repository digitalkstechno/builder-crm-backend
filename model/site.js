const mongoose = require("mongoose");

const SiteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, required: true },
    description: { type: String },
    propertyTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PropertyType' }],
    requirementTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RequirementType' }],
    budgets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Budget' }],
    whatsappNumber: { type: String },
    staff: { type: String },
    teamId: { type: String },
    status: {
      type: String,
      enum: ["Planning", "Active"],
      default: "Planning",
    },
    whatsappStatus: {
      type: String,
      enum: ["connected", "disconnected"],
      default: "disconnected",
    },
    chatbotStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },

    images: [{ type: String }],
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Builder",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deleteRequested: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Site", SiteSchema);
