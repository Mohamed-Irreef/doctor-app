const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    name: { type: String, required: true, index: true },
    genericName: { type: String },
    category: { type: String, required: true, index: true },
    subcategory: { type: String },
    description: { type: String },
    image: { type: String },
    pdfUrl: { type: String },
    brand: { type: String },
    composition: { type: String },
    dosageForm: { type: String },
    strength: { type: String },
    manufacturer: { type: String },
    packSize: { type: String },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    manufactureDate: { type: Date },
    requiresColdStorage: { type: Boolean, default: false },
    storageInstructions: { type: String },
    usageInstructions: { type: String },
    indications: { type: String },
    dosageInstructions: { type: String },
    sideEffects: [{ type: String }],
    precautions: { type: String },
    contraindications: [{ type: String }],
    drugInteractions: [{ type: String }],
    tags: [{ type: String }],
    keywords: [{ type: String }],
    slug: { type: String, index: true },
    scheduleType: { type: String },
    mrp: { type: Number },
    price: { type: Number, required: true },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    gstPercent: { type: Number, min: 0, max: 100 },
    finalPrice: { type: Number },
    deliveryEtaHours: { type: Number, min: 0, default: 24 },
    minOrderQuantity: { type: Number, min: 1, default: 1 },
    maxOrderQuantity: { type: Number, min: 1, default: 20 },
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    inStock: { type: Boolean, default: true, index: true },
    prescriptionRequired: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
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
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

medicineSchema.pre("save", function setStockFlag() {
  this.inStock = this.stock > 0;
  if (!this.mrp || this.mrp < this.price) {
    this.mrp = this.price;
  }
  if (this.maxOrderQuantity < this.minOrderQuantity) {
    this.maxOrderQuantity = this.minOrderQuantity;
  }
});

medicineSchema.index({ name: "text", category: "text" });

module.exports = mongoose.model("Medicine", medicineSchema);
