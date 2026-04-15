const mongoose = require("mongoose");

const CityAreaSchema = new mongoose.Schema(
  {
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Builder",
      required: true,
    },
    city: { type: String, required: true },
    areas: [{ type: String }],
  },
  { timestamps: true }
);

CityAreaSchema.index({ builderId: 1, city: 1 }, { unique: true });

module.exports = mongoose.model("CityArea", CityAreaSchema);
