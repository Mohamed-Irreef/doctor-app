const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["subscription", "appointment", "lab", "pharmacy"],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    commissionAmount: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    revenueSplit: {
      total: { type: Number, default: 0 },
      adminShare: { type: Number, default: 0 },
      partnerShare: { type: Number, default: 0 },
      partnerSharePercent: { type: Number, default: 0 },
      adminSharePercent: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "pending", "refunded"],
      default: "created",
      index: true,
    },
    method: { type: String, default: "razorpay" },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String },
    relatedModel: {
      type: String,
      enum: ["Appointment", "LabBooking", "Order", "Subscription"],
      required: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    receiptUrl: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

paymentSchema.index({ relatedModel: 1, relatedId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
