const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
    date: { type: Date, required: true, index: true },
    time: { type: String, required: true },
    type: {
      type: String,
      enum: ["video", "chat", "in-person"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "upcoming", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    fee: { type: Number, required: true },
    notes: { type: String },
    prescription: { type: String },
    cancellationReason: { type: String },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  },
  { timestamps: true },
);

appointmentSchema.index({ patient: 1, createdAt: -1 });
appointmentSchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
