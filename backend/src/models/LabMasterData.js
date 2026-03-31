const mongoose = require("mongoose");

const masterItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
  },
  { _id: true },
);

const labMasterDataSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    categories: [masterItemSchema],
    subcategories: [masterItemSchema],
    sampleTypes: [masterItemSchema],
    tags: [masterItemSchema],
    collectionOptions: [masterItemSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("LabMasterData", labMasterDataSchema);
