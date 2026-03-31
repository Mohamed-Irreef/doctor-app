const mongoose = require("mongoose");

const labSlotHoldSchema = new mongoose.Schema(
  {
    labTest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabTest",
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scheduledDate: { type: Date, required: true, index: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ["held", "booked", "released", "expired"],
      default: "held",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "LabBooking" },
  },
  { timestamps: true },
);

labSlotHoldSchema.index(
  { labTest: 1, scheduledDate: 1, timeSlot: 1, status: 1 },
  { name: "lab_slot_hold_lookup" },
);

module.exports = mongoose.model("LabSlotHold", labSlotHoldSchema);
