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
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    medicalDetails: {
      disease: { type: String },
      durationOfIssue: { type: String },
      severityLevel: { type: String },
      symptoms: [{ type: String }],
      currentMedicines: [{ type: String }],
      allergies: [{ type: String }],
      heightCm: { type: Number },
      weightKg: { type: Number },
      bloodGroup: { type: String },
      medicalHistory: [{ type: String }],
      additionalNotes: { type: String },
      reportFiles: [
        {
          url: { type: String, required: true },
          name: { type: String },
          mimeType: { type: String },
        },
      ],
    },
    consultationRoomId: { type: String, index: true },
    consultationStartedAt: { type: Date },
    consultationEndedAt: { type: Date },
    prescriptionDetails: {
      text: { type: String },
      pdfUrl: { type: String },
      prescribedAt: { type: Date },
      prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    adminReviewStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    revenueSplit: {
      doctorAmount: { type: Number, default: 0 },
      platformAmount: { type: Number, default: 0 },
      doctorPayoutStatus: {
        type: String,
        enum: ["pending", "processing", "paid"],
        default: "pending",
      },
      payoutReference: { type: String },
      payoutProcessedAt: { type: Date },
      verifiedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      verifiedAt: { type: Date },
    },
  },
  { timestamps: true },
);

appointmentSchema.index({ patient: 1, createdAt: -1 });
appointmentSchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
