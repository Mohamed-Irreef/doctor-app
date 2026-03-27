const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    description: { type: String },
    image: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true, index: true },
    prescriptionRequired: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

medicineSchema.pre("save", function setStockFlag(next) {
  this.inStock = this.stock > 0;
  next();
});

medicineSchema.index({ name: "text", category: "text" });

module.exports = mongoose.model("Medicine", medicineSchema);
