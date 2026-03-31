const mongoose = require("mongoose");

const statusTimelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const labBookingSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    labTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabTest",
      required: true,
      index: true,
    },
    bookingDate: { type: Date, required: true },
    scheduledDate: { type: Date },
    collectionTimeSlot: { type: String },
    collectionType: {
      type: String,
      enum: ["home", "lab"],
      default: "home",
      index: true,
    },
    homeCollectionAddress: { type: mongoose.Schema.Types.Mixed },
    deliveryCost: { type: Number, default: 0 },
    distanceKm: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        "booked",
        "sample-collected",
        "report-ready",
        "completed",
        "cancelled",
      ],
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
    reportUrl: { type: String },
    reportUploadedAt: { type: Date },
    statusTimeline: [statusTimelineSchema],
  },
  { timestamps: true },
);

labBookingSchema.pre("validate", function ensureTimeline() {
  if (!Array.isArray(this.statusTimeline) || this.statusTimeline.length === 0) {
    this.statusTimeline = [
      {
        status: this.status || "booked",
        at: new Date(),
      },
    ];
  }
});

module.exports = mongoose.model("LabBooking", labBookingSchema);
