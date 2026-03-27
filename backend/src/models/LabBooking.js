const mongoose = require("mongoose");

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
    status: {
      type: String,
      enum: ["booked", "sample-collected", "completed", "cancelled"],
      default: "booked",
      index: true,
    },
    amount: { type: Number, required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LabBooking", labBookingSchema);
