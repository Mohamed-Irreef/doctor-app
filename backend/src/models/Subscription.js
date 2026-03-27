const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    price: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "pending"],
      default: "pending",
      index: true,
    },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: true },
);

subscriptionSchema.index({ doctor: 1, status: 1, endDate: -1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
