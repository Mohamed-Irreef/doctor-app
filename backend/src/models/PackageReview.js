const mongoose = require("mongoose");

const packageReviewSchema = new mongoose.Schema(
  {
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    name: { type: String },
  },
  { timestamps: true }
);

packageReviewSchema.index({ packageId: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("PackageReview", packageReviewSchema);
