const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["site_added", "site_deleted", "site_updated", "whatsapp_updated", "other"], default: "other" },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: "Site" },
    builderId: { type: mongoose.Schema.Types.ObjectId, ref: "Builder" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
