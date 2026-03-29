const mongoose = require("mongoose");

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    specialization: { type: String, required: true, index: true },
    gender: { type: String },
    qualifications: [{ type: String }],
    licenseNumber: { type: String, required: true, unique: true, index: true },
    experienceYears: { type: Number, default: 0 },
    bio: { type: String },
    bannerImage: { type: String },
    hospital: { type: String },
    clinicName: { type: String },
    clinicAddress: { type: String },
    clinicLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    languages: [{ type: String }],
    availabilityType: {
      type: String,
      enum: ["online", "offline", "both"],
      default: "both",
    },
    consultationFee: { type: Number, default: 0 },
    consultationFeeVideo: { type: Number, default: 0 },
    consultationFeeInPerson: { type: Number, default: 0 },
    consultationFeeChat: { type: Number, default: 0 },
    dailySlotLimit: { type: Number, default: 20 },
    noticePeriodHours: { type: Number, default: 24 },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    featuredUntil: { type: Date },
    certificateUrls: [{ type: String }],
    certificateFiles: [
      {
        url: { type: String },
        name: { type: String },
      },
    ],
  },
  { timestamps: true },
);

doctorProfileSchema.index({ specialization: 1, rating: -1 });

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
