const mongoose = require("mongoose");

const RequirementTypeSchema = new mongoose.Schema(
  {
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Builder",
      required: true,
    },
    name: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RequirementType", RequirementTypeSchema);
