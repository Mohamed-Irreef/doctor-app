const mongoose = require("mongoose");

const statusTimelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const packageBookingSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
      index: true,
    },
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabPartnerProfile",
      index: true,
    },
    status: {
      type: String,
      enum: ["booked", "cancelled"],
      default: "booked",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    adminShare: { type: Number, default: 0 },
    labShare: { type: Number, default: 0 },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    statusTimeline: [statusTimelineSchema],
  },
  { timestamps: true },
);

packageBookingSchema.pre("validate", function ensureTimeline() {
  if (!Array.isArray(this.statusTimeline) || this.statusTimeline.length === 0) {
    this.statusTimeline = [
      {
        status: this.status || "booked",
        at: new Date(),
      },
    ];
  }
});

module.exports = mongoose.model("PackageBooking", packageBookingSchema);
