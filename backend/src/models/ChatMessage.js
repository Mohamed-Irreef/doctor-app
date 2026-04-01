const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "both"],
      default: "text",
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

chatMessageSchema.index({ appointment: 1, createdAt: 1 });
chatMessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
