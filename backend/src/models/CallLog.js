const mongoose = require("mongoose");

const callLogSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true, unique: true },
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["initiated", "accepted", "declined", "missed", "ended"],
      default: "initiated",
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CallLog", callLogSchema);
