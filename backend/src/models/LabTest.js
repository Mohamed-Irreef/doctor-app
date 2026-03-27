const mongoose = require("mongoose");

const labTestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    description: { type: String },
    originalPrice: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    turnaround: { type: String, default: "24 hrs" },
    popular: { type: Boolean, default: false },
    includes: [{ type: String }],
    prepSteps: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

labTestSchema.index({ name: "text", category: "text" });

module.exports = mongoose.model("LabTest", labTestSchema);
