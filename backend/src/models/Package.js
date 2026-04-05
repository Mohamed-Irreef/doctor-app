const mongoose = require("mongoose");

const testGroupSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    tests: [{ type: String }],
  },
  { _id: false }
);

const howItWorksStepSchema = new mongoose.Schema(
  { step: { type: String } },
  { _id: false }
);

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, trim: true, index: true },
    category: {
      type: String,
      enum: ["General", "Women", "Senior", "Executive", "Diabetes", "Cardiac", "Full Body", "Other"],
      default: "General",
      index: true,
    },
    tags: [{ type: String }],
    shortDescription: { type: String, trim: true },
    fullDescription: { type: String },
    image: { type: String },
    brochure: { type: String },
    thumbnailImage: { type: String },
    price: {
      original: { type: Number, required: true, default: 0 },
      offer: { type: Number, required: true, default: 0 },
      discount: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      final: { type: Number, default: 0 },
    },
    tests: [testGroupSchema],
    testCount: { type: Number, default: 0 },
    ageRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 },
    },
    gender: { type: String, enum: ["All", "Male", "Female"], default: "All" },
    suitableFor: [{ type: String }],
    details: {
      whoShouldBook: { type: String },
      preparation: { type: String },
      howItWorks: [howItWorksStepSchema],
      highlyRecommendedFor: [{ type: String }],
    },
    instructions: {
      before: { type: String },
      after: { type: String },
      collection: { type: String },
    },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: "LabPartnerProfile", index: true },
    labName: { type: String },
    status: {
      type: String,
      enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED", "DRAFT"],
      default: "PENDING_APPROVAL",
      index: true,
    },
    approvalNote: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

packageSchema.index({ name: "text", category: "text" });
packageSchema.index({ status: 1, active: 1 });

module.exports = mongoose.model("Package", packageSchema);
