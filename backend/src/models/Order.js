const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    name: { type: String, required: true },
    category: { type: String },
    image: { type: String },
    prescriptionRequired: { type: Boolean, default: false },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
  },
  { _id: false },
);

const orderTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      required: true,
    },
    note: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: { type: [orderItemSchema], required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "ordered",
        "placed",
        "confirmed",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "placed",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    statusTimeline: { type: [orderTimelineSchema], default: [] },
    prescription: {
      required: { type: Boolean, default: false },
      url: { type: String },
      note: { type: String },
      verified: { type: Boolean, default: false },
    },
    prescriptionUrl: { type: String },
    prescriptionVerified: { type: Boolean, default: false },
    deliveryAddress: { type: String },
    deliveryContactName: { type: String },
    deliveryContactPhone: { type: String },
    estimatedDeliveryAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    closedAt: { type: Date },
    trackingId: { type: String },
    adminShareAmount: { type: Number, default: 0 },
    pharmacyShareAmount: { type: Number, default: 0 },
    date: { type: Date, default: Date.now, index: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  },
  { timestamps: true },
);

orderSchema.pre("validate", function normalizeLegacyStatus() {
  if (this.status === "ordered") {
    this.status = "placed";
  }
});

module.exports = mongoose.model("Order", orderSchema);
