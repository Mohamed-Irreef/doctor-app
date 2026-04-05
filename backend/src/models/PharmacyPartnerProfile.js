const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    name: { type: String },
    url: { type: String, required: true },
    mimeType: { type: String },
  },
  { _id: false },
);

const pharmacyPartnerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    profilePhoto: { type: String },
    companyLogo: { type: String },
    pharmacyName: { type: String, required: true, trim: true, index: true },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    gstNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    yearsOfExperience: { type: Number, default: 0 },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    pincode: { type: String, required: true, index: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    supportPhone: { type: String, required: true },
    supportEmail: { type: String, required: true, lowercase: true, trim: true },
    operationalHours: { type: String, trim: true },
    drugLicense: documentSchema,
    gstCertificate: documentSchema,
    ownerIdProof: documentSchema,
    termsAccepted: { type: Boolean, default: false },
    declarationAccepted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    isApproved: { type: Boolean, default: false, index: true },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "PharmacyPartnerProfile",
  pharmacyPartnerProfileSchema,
);
