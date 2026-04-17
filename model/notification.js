const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["site_added", "site_deleted", "site_updated", "whatsapp_updated", "lead_assigned", "reminder", "other"], default: "other" },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: "Site" },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
    builderId: { type: mongoose.Schema.Types.ObjectId, ref: "Builder" },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // For staff/user specific notifications
    targetRole: { type: String, enum: ["ADMIN", "BUILDER", "STAFF"] },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
