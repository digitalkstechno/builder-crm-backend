const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String },
    role: { type: String, enum: ["ADMIN", "BUILDER", "STAFF"], default: "BUILDER" },
    builderId: { type: mongoose.Schema.Types.ObjectId, ref: "Builder", default: null }, // Only for STAFF
    status: { type: String, default: "active" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound unique indexes: Email/Phone must be unique WITHIN a builder's context
// For BUILDERS, builderId is null, ensuring global uniqueness among builders
UserSchema.index({ email: 1, builderId: 1 }, { unique: true });
UserSchema.index({ phone: 1, builderId: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);
