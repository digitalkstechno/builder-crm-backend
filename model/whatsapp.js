const mongoose = require("mongoose");

const WhatsappSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    number: { type: String, required: true },
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Builder",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deleteRequested: { type: Boolean, default: false },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Whatsapp", WhatsappSchema);
