const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    moderationStatus: {
      type: String,
      enum: ["visible", "hidden"],
      default: "visible",
    },
  },
  { timestamps: true },
);

reviewSchema.index({ doctor: 1, createdAt: -1 });
reviewSchema.index(
  { appointment: 1 },
  {
    unique: true,
    partialFilterExpression: { appointment: { $type: "objectId" } },
  },
);
reviewSchema.index(
  { doctor: 1, patient: 1 },
  { unique: true, partialFilterExpression: { appointment: null } },
);

module.exports = mongoose.model("Review", reviewSchema);
