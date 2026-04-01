const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["text", "image"],
      required: true,
      default: "text",
    },
    message: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    fileUrl: {
      type: String,
      trim: true,
      default: "",
    },
    isSeen: {
      type: Boolean,
      default: false,
      index: true,
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ chatId: 1, isSeen: 1, receiverId: 1 });

module.exports = mongoose.model("Message", messageSchema);
