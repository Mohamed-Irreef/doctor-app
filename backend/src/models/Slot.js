const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    durationMinutes: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ["available", "booked", "blocked"],
      default: "available",
      index: true,
    },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    heldBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    holdExpiresAt: { type: Date, index: true },
  },
  { timestamps: true },
);

slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model("Slot", slotSchema);
