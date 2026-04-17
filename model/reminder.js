const mongoose = require("mongoose");

const ReminderSchema = new mongoose.Schema(
  {
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Builder",
      required: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    followupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Followup",
      required: true,
    },
    reminderDate: {
      type: Date,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isSent: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
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

// Performance index for scheduler
ReminderSchema.index({ reminderDate: 1, isSent: 1, isActive: 1, isDeleted: 1 });

module.exports = mongoose.model("Reminder", ReminderSchema);