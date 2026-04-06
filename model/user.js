const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String },
    role: { 
      type: String, 
      enum: ["ADMIN", "BUILDER", "STAFF", "SALES", "MANAGER"], 
      default: "BUILDER" 
    },
    // For staff members to link to their employer Builder account
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Builder",
    },
    // Which real estate sites this staff member can access
    assignedSites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site"
    }],
    status: { type: String, default: "active" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
