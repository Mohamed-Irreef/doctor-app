const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const Appointment = require("../models/Appointment");
const ChatMessage = require("../models/ChatMessage");

async function assertAppointmentChatAccess(appointmentId, userId) {
  if (!mongoose.Types.ObjectId.isValid(String(appointmentId))) {
    throw new ApiError(400, "Invalid appointment id");
  }

  const appointment = await Appointment.findById(appointmentId)
    .select("_id patient doctor status")
    .lean();

  if (!appointment) throw new ApiError(404, "Appointment not found");

  const isParticipant =
    String(appointment.patient) === String(userId) ||
    String(appointment.doctor) === String(userId);

  if (!isParticipant)
    throw new ApiError(403, "Not allowed to access this chat");

  return appointment;
}

async function listAppointmentMessages(appointmentId, userId, options = {}) {
  await assertAppointmentChatAccess(appointmentId, userId);

  const limit = Math.min(100, Math.max(1, Number(options.limit || 50)));
  const messages = await ChatMessage.find({ appointment: appointmentId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate("sender", "name image role")
    .populate("receiver", "name image role")
    .lean();

  return messages;
}

function resolveMessageType(text, imageUrl) {
  if (text && imageUrl) return "both";
  if (imageUrl) return "image";
  return "text";
}

async function createAppointmentMessage(appointmentId, userId, payload) {
  const appointment = await assertAppointmentChatAccess(appointmentId, userId);

  const text = String(payload?.text || "").trim();
  const imageUrl = String(payload?.imageUrl || "").trim();

  if (!text && !imageUrl) {
    throw new ApiError(400, "Message text or image is required");
  }

  const receiverId =
    String(appointment.patient) === String(userId)
      ? appointment.doctor
      : appointment.patient;

  const doc = await ChatMessage.create({
    appointment: appointment._id,
    sender: userId,
    receiver: receiverId,
    messageType: resolveMessageType(text, imageUrl),
    text: text || undefined,
    imageUrl: imageUrl || undefined,
  });

  const populated = await ChatMessage.findById(doc._id)
    .populate("sender", "name image role")
    .populate("receiver", "name image role")
    .lean();

  return {
    appointment,
    message: populated,
  };
}

module.exports = {
  assertAppointmentChatAccess,
  listAppointmentMessages,
  createAppointmentMessage,
};
