const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    price: { type: Number, required: true },
    interval: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    appointmentLimit: { type: Number, default: 0 },
    hasPriorityListing: { type: Boolean, default: false },
    hasPatientChat: { type: Boolean, default: false },
    hasMarketingBoost: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    description: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Plan", planSchema);
