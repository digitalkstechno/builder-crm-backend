const mongoose = require("mongoose");

const SiteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, required: true },
    description: { type: String },
    propertyTypes: { type: String },
    priceRange: { type: String },
    whatsappNumber: { type: String },
    staff: { type: String },
    teamId: { type: String },
    status: {
      type: String,
      enum: ["Planning", "Active"],
      default: "Planning",
    },
    images: [{ type: String }],
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Builder",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Site", SiteSchema);
