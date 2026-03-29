const mongoose = require("mongoose");

const patientProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    gender: { type: String },
    dateOfBirth: { type: Date },
    bloodGroup: { type: String },
    allergies: [{ type: String }],
    medicalConditions: [{ type: String }],
    address: { type: String },
    emergencyContact: { type: String },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PatientProfile", patientProfileSchema);
