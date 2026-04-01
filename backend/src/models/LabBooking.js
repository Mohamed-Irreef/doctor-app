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
    bookingType: {
      type: String,
      enum: ["home_collection", "lab_visit"],
      index: true,
    },
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
    tests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LabTest",
      },
    ],
    bookingDate: { type: Date, required: true },
    scheduledDate: { type: Date },
    timeSlot: { type: String },
    collectionTimeSlot: { type: String },
    collectionType: {
      type: String,
      enum: ["home", "lab"],
      default: "home",
      index: true,
    },
    address: {
      flat: { type: String, trim: true },
      street: { type: String, trim: true },
      landmark: { type: String, trim: true },
      city: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    homeCollectionAddress: { type: mongoose.Schema.Types.Mixed },
    contactNumber: { type: String, trim: true },
    labLocation: { type: String, trim: true },
    deliveryCost: { type: Number, default: 0 },
    distanceKm: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "on-the-way",
        "reached",
        "arrived",
        "sample-collected",
        "report-submitted",
        "closed",
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
  if (!this.bookingType) {
    this.bookingType =
      this.collectionType === "lab" ? "lab_visit" : "home_collection";
  }

  if ((!Array.isArray(this.tests) || this.tests.length === 0) && this.labTest) {
    this.tests = [this.labTest];
  }

  if (!this.timeSlot && this.collectionTimeSlot) {
    this.timeSlot = this.collectionTimeSlot;
  }

  if (
    (!this.address || !Object.keys(this.address).length) &&
    this.homeCollectionAddress
  ) {
    this.address = {
      flat:
        this.homeCollectionAddress?.flat ||
        this.homeCollectionAddress?.flatHouse ||
        "",
      street:
        this.homeCollectionAddress?.street ||
        this.homeCollectionAddress?.area ||
        "",
      landmark: this.homeCollectionAddress?.landmark || "",
      city: this.homeCollectionAddress?.city || "",
      pincode: this.homeCollectionAddress?.pincode || "",
    };
  }

  if (!this.status) {
    this.status = "pending";
  }

  if (!Array.isArray(this.statusTimeline) || this.statusTimeline.length === 0) {
    this.statusTimeline = [
      {
        status: this.status || "pending",
        at: new Date(),
      },
    ];
  }
});

module.exports = mongoose.model("LabBooking", labBookingSchema);
