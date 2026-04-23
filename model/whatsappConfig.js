const mongoose = require("mongoose");

const WhatsappConfigSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Builder",
      required: true,
    },
    accessToken: { type: String, default: null },
    apiVersion: { type: String, default: null },
    phoneNumberId: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WhatsappConfig", WhatsappConfigSchema);
