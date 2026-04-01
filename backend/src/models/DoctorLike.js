const mongoose = require("mongoose");

const doctorLikeSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

doctorLikeSchema.index({ doctor: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("DoctorLike", doctorLikeSchema);
