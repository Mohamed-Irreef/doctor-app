const mongoose = require("mongoose");

const labTestReviewSchema = new mongoose.Schema(
  {
    labTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabTest",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

labTestReviewSchema.index({ labTest: 1, user: 1 }, { unique: true });
labTestReviewSchema.index({ labTest: 1, createdAt: -1 });

module.exports = mongoose.model("LabTestReview", labTestReviewSchema);
