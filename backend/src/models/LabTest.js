const mongoose = require("mongoose");

const parameterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalRange: { type: String, trim: true },
    unit: { type: String, trim: true },
  },
  { _id: false },
);

const labTestSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    slug: { type: String, index: true },
    testCode: { type: String, trim: true, index: true },
    shortDescription: { type: String, trim: true },
    fullDescription: { type: String },
    preparationInstructions: { type: String },
    beforeTestInstructions: { type: String },
    afterTestInstructions: { type: String },
    collectionInstructions: { type: String },
    name: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, index: true },
    tags: [{ type: String, index: true }],
    description: { type: String },
    originalPrice: { type: Number, required: true },
    price: { type: Number, required: true },
    gstPercent: { type: Number, default: 0 },
    finalPrice: { type: Number },
    discount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    discountPercentage: { type: Number, default: 0 },
    turnaround: { type: String, default: "24 hrs" },
    reportTime: { type: String, default: "24 hours" },
    parameters: [parameterSchema],
    sampleType: {
      type: String,
      enum: ["Blood", "Urine", "Saliva", "Other"],
      default: "Blood",
    },
    fastingRequired: { type: Boolean, default: false },
    fastingHours: { type: Number, default: 0 },
    sampleVolume: { type: String },
    containerType: { type: String },
    homeCollectionAvailable: { type: Boolean, default: true },
    labVisitRequired: { type: Boolean, default: false },
    bothAvailable: { type: Boolean, default: false },
    technicianRequired: { type: Boolean, default: false },
    collectionOption: {
      type: String,
      enum: ["home", "lab", "both"],
      default: "both",
    },
    collectionTimeSlots: [{ type: String }],
    processingTime: { type: String },
    normalRange: { type: String },
    method: { type: String },
    department: { type: String },
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],
    testImage: { type: String },
    imageUrl: { type: String },
    reportSampleUrl: { type: String },
    testVideoUrl: { type: String },
    labId: { type: mongoose.Schema.Types.ObjectId, ref: "LabPartnerProfile" },
    labName: { type: String },
    popular: { type: Boolean, default: false },
    recommendedTest: { type: Boolean, default: false },
    includes: [{ type: String }],
    prepSteps: [{ type: String }],
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
    isApproved: { type: Boolean, default: true, index: true },
    approvalNote: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    active: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "submitted",
      index: true,
    },
  },
  { timestamps: true },
);

function toSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

labTestSchema.pre("validate", function syncDerivedFields() {
  if (!this.slug && this.name) {
    this.slug = toSlug(this.name);
  }

  if (!this.shortDescription && this.description) {
    this.shortDescription = this.description;
  }

  if (!this.fullDescription && this.description) {
    this.fullDescription = this.description;
  }

  if (this.originalPrice && this.price && this.originalPrice > 0) {
    const pct = ((this.originalPrice - this.price) / this.originalPrice) * 100;
    this.discountPercentage = Number(Math.max(0, pct).toFixed(2));
    this.discount = this.discountPercentage;
  }
});

labTestSchema.index({ name: "text", category: "text" });
labTestSchema.index({ slug: 1, isApproved: 1, approvalStatus: 1 });

module.exports = mongoose.model("LabTest", labTestSchema);
