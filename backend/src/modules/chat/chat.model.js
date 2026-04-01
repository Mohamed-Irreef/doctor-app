const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lastMessage: {
      type: String,
      trim: true,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    unreadFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

chatSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });
chatSchema.index({ doctorId: 1, updatedAt: -1 });
chatSchema.index({ patientId: 1, updatedAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
