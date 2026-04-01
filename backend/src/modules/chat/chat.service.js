const mongoose = require("mongoose");
const ApiError = require("../../utils/ApiError");
const Chat = require("./chat.model");
const Message = require("./message.model");
const User = require("../../models/User");

function toObjectId(value, label) {
  if (!mongoose.Types.ObjectId.isValid(String(value || ""))) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return new mongoose.Types.ObjectId(String(value));
}

function isDoctor(role) {
  return role === "doctor";
}

function isPatient(role) {
  return role === "patient";
}

async function resolveChatPair(user, payload = {}) {
  let doctorId;
  let patientId;

  if (isPatient(user.role)) {
    if (!payload.doctorId) {
      throw new ApiError(400, "doctorId is required");
    }
    doctorId = toObjectId(payload.doctorId, "doctorId");
    patientId = toObjectId(user._id, "userId");
  } else if (isDoctor(user.role)) {
    doctorId = toObjectId(user._id, "userId");
    if (!payload.patientId) {
      throw new ApiError(400, "patientId is required");
    }
    patientId = toObjectId(payload.patientId, "patientId");
  } else {
    throw new ApiError(403, "Only patient and doctor can use chat");
  }

  const [doctor, patient] = await Promise.all([
    User.findOne({ _id: doctorId, role: "doctor", status: "active" })
      .select("_id")
      .lean(),
    User.findOne({ _id: patientId, role: "patient", status: "active" })
      .select("_id")
      .lean(),
  ]);

  if (!doctor) throw new ApiError(404, "Doctor not found");
  if (!patient) throw new ApiError(404, "Patient not found");

  return {
    doctorId,
    patientId,
  };
}

async function createOrGetChat(user, payload) {
  const pair = await resolveChatPair(user, payload);

  const existing = await Chat.findOne({
    doctorId: pair.doctorId,
    patientId: pair.patientId,
  })
    .populate("doctorId", "name image role")
    .populate("patientId", "name image role")
    .lean();

  if (existing) return existing;

  const created = await Chat.create({
    doctorId: pair.doctorId,
    patientId: pair.patientId,
    lastMessageTime: new Date(),
  });

  return Chat.findById(created._id)
    .populate("doctorId", "name image role")
    .populate("patientId", "name image role")
    .lean();
}

async function assertChatAccess(chatId, userId) {
  const id = toObjectId(chatId, "chatId");
  const chat = await Chat.findById(id).lean();
  if (!chat) throw new ApiError(404, "Chat not found");

  const isMember =
    String(chat.doctorId) === String(userId) ||
    String(chat.patientId) === String(userId);
  if (!isMember) throw new ApiError(403, "Not allowed to access this chat");

  return chat;
}

async function getUserChats(userId) {
  const filter = {
    $or: [{ doctorId: userId }, { patientId: userId }],
  };

  const chats = await Chat.find(filter)
    .populate("doctorId", "name image role")
    .populate("patientId", "name image role")
    .sort({ lastMessageTime: -1, updatedAt: -1 })
    .lean();

  return chats;
}

async function listMessages(chatId, userId, query = {}) {
  const chat = await assertChatAccess(chatId, userId);

  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 30)));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Message.find({ chatId })
      .populate("senderId", "name image role")
      .populate("receiverId", "name image role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ chatId }),
  ]);

  await markSeen(chatId, userId);

  return {
    items: items.reverse(),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
    chat,
  };
}

async function sendMessage(chatId, senderId, payload = {}) {
  const chat = await assertChatAccess(chatId, senderId);

  if (chat.isBlocked && String(chat.blockedBy || "") !== String(senderId)) {
    throw new ApiError(403, "You are blocked from sending messages");
  }

  const message = String(payload.message || "").trim();
  const fileUrl = String(payload.fileUrl || "").trim();

  if (!message && !fileUrl) {
    throw new ApiError(400, "Message content is required");
  }

  let type = payload.type;
  if (!type) {
    type = fileUrl ? "image" : "text";
  }

  if (type === "text" && !message) {
    throw new ApiError(400, "Text message is required");
  }
  if (type === "image" && !fileUrl) {
    throw new ApiError(400, "Image URL is required");
  }

  const receiverId =
    String(chat.doctorId) === String(senderId) ? chat.patientId : chat.doctorId;

  const created = await Message.create({
    chatId,
    senderId,
    receiverId,
    type,
    message: message || "",
    fileUrl: fileUrl || "",
    isSeen: false,
    deliveredAt: new Date(),
  });

  const lastMessage = type === "image" ? "Image" : message;
  await Chat.findByIdAndUpdate(chatId, {
    $set: {
      lastMessage,
      lastMessageTime: created.createdAt,
      unreadFor: receiverId,
      updatedAt: new Date(),
    },
    $inc: {
      unreadCount: 1,
    },
  });

  const messageDoc = await Message.findById(created._id)
    .populate("senderId", "name image role")
    .populate("receiverId", "name image role")
    .lean();

  return {
    chat,
    message: messageDoc,
  };
}

async function markSeen(chatId, userId) {
  const chat = await assertChatAccess(chatId, userId);

  await Message.updateMany(
    {
      chatId,
      receiverId: userId,
      isSeen: false,
    },
    {
      $set: {
        isSeen: true,
      },
    },
  );

  if (String(chat.unreadFor || "") === String(userId)) {
    await Chat.findByIdAndUpdate(chatId, {
      $set: {
        unreadCount: 0,
        unreadFor: null,
      },
    });
  }
}

async function blockChat(chatId, user, shouldBlock = true) {
  const chat = await assertChatAccess(chatId, user._id);

  if (!isDoctor(user.role) || String(chat.doctorId) !== String(user._id)) {
    throw new ApiError(403, "Only doctor can block/unblock patient");
  }

  const updated = await Chat.findByIdAndUpdate(
    chatId,
    {
      $set: {
        isBlocked: Boolean(shouldBlock),
        blockedBy: shouldBlock ? user._id : null,
      },
    },
    { new: true },
  )
    .populate("doctorId", "name image role")
    .populate("patientId", "name image role")
    .lean();

  return updated;
}

module.exports = {
  createOrGetChat,
  assertChatAccess,
  getUserChats,
  listMessages,
  sendMessage,
  markSeen,
  blockChat,
};
