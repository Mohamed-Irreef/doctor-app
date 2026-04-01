const { Server } = require("socket.io");
const { randomUUID } = require("crypto");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const CallLog = require("../models/CallLog");
const env = require("../config/env");
const { verifyAccessToken } = require("../utils/token");
const chatService = require("../modules/chat/chat.service");

let io;
const onlineSocketsByUser = new Map();
const pendingCallsByRoom = new Map();
const activeCallsByRoom = new Map();
const activeCallRoomByUser = new Map();

async function resolveUserFromToken(token) {
  if (!token) return null;
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub)
      .select("_id role status")
      .lean();
    return user || null;
  } catch {
    return null;
  }
}

function getSocketServer() {
  return io;
}

function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${String(userId)}`).emit(event, payload);
}

function emitToRole(role, event, payload) {
  if (!io || !role) return;
  io.to(`role:${String(role)}`).emit(event, payload);
}

function setUserOnline(userId, socketId) {
  const key = String(userId);
  const existing = onlineSocketsByUser.get(key) || new Set();
  existing.add(socketId);
  onlineSocketsByUser.set(key, existing);
}

function setUserOffline(userId, socketId) {
  const key = String(userId);
  const existing = onlineSocketsByUser.get(key);
  if (!existing) return;
  existing.delete(socketId);
  if (!existing.size) {
    onlineSocketsByUser.delete(key);
    return;
  }
  onlineSocketsByUser.set(key, existing);
}

function isUserOnline(userId) {
  const key = String(userId);
  const sockets = onlineSocketsByUser.get(key);
  return Boolean(sockets && sockets.size > 0);
}

function clearPendingCall(roomId, reason = "ended") {
  const key = String(roomId || "");
  const call = pendingCallsByRoom.get(key);
  if (!call) return;

  if (call.timeoutId) {
    clearTimeout(call.timeoutId);
  }

  pendingCallsByRoom.delete(key);
  if (String(activeCallRoomByUser.get(String(call.callerId)) || "") === key) {
    activeCallRoomByUser.delete(String(call.callerId));
  }
  if (String(activeCallRoomByUser.get(String(call.receiverId)) || "") === key) {
    activeCallRoomByUser.delete(String(call.receiverId));
  }

  CallLog.findOneAndUpdate(
    { roomId: key, endedAt: null },
    {
      $set: {
        status: reason,
        endedAt: new Date(),
      },
    },
  ).catch(() => null);
}

function clearActiveCall(roomId, reason = "ended") {
  const key = String(roomId || "");
  const call = activeCallsByRoom.get(key);
  if (!call) return;

  activeCallsByRoom.delete(key);
  if (String(activeCallRoomByUser.get(String(call.callerId)) || "") === key) {
    activeCallRoomByUser.delete(String(call.callerId));
  }
  if (String(activeCallRoomByUser.get(String(call.receiverId)) || "") === key) {
    activeCallRoomByUser.delete(String(call.receiverId));
  }

  CallLog.findOneAndUpdate(
    { roomId: key, endedAt: null },
    {
      $set: {
        status: reason,
        endedAt: new Date(),
      },
    },
  ).catch(() => null);
}

async function resolveAppointmentForCall(caller, receiverId, appointmentId) {
  if (!appointmentId) return null;

  const item = await Appointment.findById(appointmentId)
    .select("_id doctor patient status type")
    .lean();
  if (!item) return null;

  const isCallerDoctor = caller.role === "doctor";
  const doctorId = isCallerDoctor ? caller._id : receiverId;
  const patientId = isCallerDoctor ? receiverId : caller._id;

  const isParticipantMatch =
    String(item.doctor) === String(doctorId) &&
    String(item.patient) === String(patientId);

  if (!isParticipantMatch) return null;
  if (item.type !== "video") return null;
  if (!["pending", "upcoming", "completed"].includes(String(item.status))) {
    return null;
  }

  return item;
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: env.corsOrigin.length ? env.corsOrigin : true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const header = socket.handshake?.headers?.authorization || "";
    const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : "";
    const authToken = socket.handshake?.auth?.token || "";
    const token = authToken || bearerToken;

    const user = await resolveUserFromToken(token);
    if (!user) return next(new Error("Unauthorized"));

    socket.data.user = user;
    return next();
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    if (!user?._id) return;
    const userId = String(user._id);

    socket.join(`user:${userId}`);
    if (user.role) {
      socket.join(`role:${String(user.role)}`);
    }
    setUserOnline(userId, socket.id);

    socket.broadcast.emit("user_status", {
      userId,
      online: true,
    });

    socket.emit("lab:socket-ready", {
      connected: true,
      userId,
      role: user.role,
    });

    socket.emit("chat_socket_ready", {
      connected: true,
      userId,
      role: user.role,
    });

    socket.on("join_chat", async (chatId, ack) => {
      const normalizedChatId = String(chatId || "");
      try {
        await chatService.assertChatAccess(normalizedChatId, user._id);
        socket.join(`chat:${normalizedChatId}`);
        if (typeof ack === "function") {
          ack({ ok: true, chatId: normalizedChatId });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, error: error?.message || "Unable to join chat" });
        }
      }
    });

    socket.on("call:initiate", async (payload = {}, ack) => {
      try {
        const receiverId = String(payload.receiverId || "");
        if (!receiverId) {
          if (typeof ack === "function")
            ack({ ok: false, error: "receiverId is required" });
          return;
        }

        if (!isUserOnline(receiverId)) {
          if (typeof ack === "function")
            ack({ ok: false, error: "User not available" });
          return;
        }

        if (activeCallRoomByUser.get(userId)) {
          if (typeof ack === "function")
            ack({ ok: false, error: "You are already in a call" });
          return;
        }
        if (activeCallRoomByUser.get(receiverId)) {
          if (typeof ack === "function")
            ack({ ok: false, error: "User is already in another call" });
          return;
        }

        const appointment = await resolveAppointmentForCall(
          user,
          receiverId,
          String(payload.appointmentId || ""),
        );

        const isCallerDoctor = String(user.role || "") === "doctor";
        const derivedDoctorId = isCallerDoctor ? userId : receiverId;
        const derivedPatientId = isCallerDoctor ? receiverId : userId;

        const roomId = String(payload.roomId || randomUUID());
        const call = {
          roomId,
          callerId: userId,
          callerName: String(payload.callerName || ""),
          receiverId,
          role: String(payload.role || user.role || ""),
          appointmentId: appointment?._id ? String(appointment._id) : undefined,
          status: "initiated",
          createdAt: new Date(),
        };

        const timeoutId = setTimeout(() => {
          emitToUser(userId, "call:timeout", {
            roomId,
            receiverId,
            appointmentId: call.appointmentId,
          });
          clearPendingCall(roomId, "missed");
        }, 30000);

        pendingCallsByRoom.set(roomId, { ...call, timeoutId });
        activeCallRoomByUser.set(userId, roomId);
        activeCallRoomByUser.set(receiverId, roomId);

        CallLog.create({
          roomId,
          callerId: userId,
          receiverId,
          doctorId: appointment?.doctor
            ? String(appointment.doctor)
            : String(derivedDoctorId),
          patientId: appointment?.patient
            ? String(appointment.patient)
            : String(derivedPatientId),
          ...(call.appointmentId ? { appointmentId: call.appointmentId } : {}),
          status: "initiated",
          startedAt: new Date(),
        }).catch(() => null);

        emitToUser(receiverId, "call:incoming", {
          roomId,
          callerId: userId,
          callerName: call.callerName,
          receiverId,
          role: call.role,
          appointmentId: call.appointmentId,
        });

        if (typeof ack === "function") {
          ack({ ok: true, roomId, appointmentId: call.appointmentId });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({
            ok: false,
            error: error?.message || "Unable to initiate call",
          });
        }
      }
    });

    socket.on("call:accept", (payload = {}, ack) => {
      const roomId = String(payload.roomId || "");
      const call = pendingCallsByRoom.get(roomId);
      if (!call) {
        if (typeof ack === "function")
          ack({ ok: false, error: "Call not found" });
        return;
      }

      if (String(call.receiverId) !== userId) {
        if (typeof ack === "function") ack({ ok: false, error: "Not allowed" });
        return;
      }

      if (call.timeoutId) clearTimeout(call.timeoutId);
      pendingCallsByRoom.delete(roomId);
      activeCallsByRoom.set(roomId, {
        ...call,
        status: "accepted",
        acceptedAt: new Date(),
      });

      CallLog.findOneAndUpdate(
        { roomId },
        {
          $set: {
            status: "accepted",
          },
        },
      ).catch(() => null);

      emitToUser(call.callerId, "call:accept", {
        roomId,
        callerId: call.callerId,
        receiverId: call.receiverId,
        appointmentId: call.appointmentId,
      });
      emitToUser(call.receiverId, "call:accept", {
        roomId,
        callerId: call.callerId,
        receiverId: call.receiverId,
        appointmentId: call.appointmentId,
      });

      if (typeof ack === "function") ack({ ok: true, roomId });
    });

    socket.on("call:decline", (payload = {}, ack) => {
      const roomId = String(payload.roomId || "");
      const call = pendingCallsByRoom.get(roomId);
      if (!call) {
        if (typeof ack === "function")
          ack({ ok: false, error: "Call not found" });
        return;
      }

      const isParticipant =
        String(call.callerId) === userId || String(call.receiverId) === userId;
      if (!isParticipant) {
        if (typeof ack === "function") ack({ ok: false, error: "Not allowed" });
        return;
      }

      emitToUser(call.callerId, "call:decline", {
        roomId,
        by: userId,
      });
      emitToUser(call.receiverId, "call:decline", {
        roomId,
        by: userId,
      });

      clearPendingCall(roomId, "declined");
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("call:join-room", (payload = {}, ack) => {
      const roomId = String(payload.roomId || "");
      if (!roomId) {
        if (typeof ack === "function")
          ack({ ok: false, error: "roomId is required" });
        return;
      }
      socket.join(`call:${roomId}`);
      socket.to(`call:${roomId}`).emit("call:peer-joined", {
        roomId,
        userId,
      });
      if (typeof ack === "function") ack({ ok: true, roomId });
    });

    socket.on("offer", (payload = {}, ack) => {
      const roomId = String(payload.roomId || "");
      socket.to(`call:${roomId}`).emit("offer", {
        roomId,
        sdp: payload.sdp,
        from: userId,
      });
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("answer", (payload = {}, ack) => {
      const roomId = String(payload.roomId || "");
      socket.to(`call:${roomId}`).emit("answer", {
        roomId,
        sdp: payload.sdp,
        from: userId,
      });
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("ice-candidate", (payload = {}, ack) => {
      const roomId = String(payload.roomId || "");
      socket.to(`call:${roomId}`).emit("ice-candidate", {
        roomId,
        candidate: payload.candidate,
        from: userId,
      });
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("call:end", (payload = {}, ack) => {
      const roomId = String(payload.roomId || "");
      const pending = pendingCallsByRoom.get(roomId);
      const active = activeCallsByRoom.get(roomId);

      io.to(`call:${roomId}`).emit("call:end", {
        roomId,
        by: userId,
      });

      if (pending) clearPendingCall(roomId, "ended");
      if (active) clearActiveCall(roomId, "ended");

      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("leave_chat", (chatId, ack) => {
      const normalizedChatId = String(chatId || "");
      if (normalizedChatId) {
        socket.leave(`chat:${normalizedChatId}`);
      }
      if (typeof ack === "function") {
        ack({ ok: true, chatId: normalizedChatId });
      }
    });

    socket.on("send_message", async (payload = {}, ack) => {
      try {
        const chatId = String(payload.chatId || "");
        const { chat, message } = await chatService.sendMessage(
          chatId,
          user._id,
          {
            type: payload.type,
            message: payload.message,
            fileUrl: payload.fileUrl,
          },
        );

        const chatPayload = {
          chatId: String(chat._id),
          message,
        };

        io.to(`chat:${chatId}`).emit("receive_message", chatPayload);
        emitToUser(String(chat.patientId), "receive_message", chatPayload);
        emitToUser(String(chat.doctorId), "receive_message", chatPayload);

        if (typeof ack === "function") {
          ack({ ok: true, message });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, error: error?.message || "Unable to send message" });
        }
      }
    });

    socket.on("typing", async (payload = {}) => {
      const chatId = String(payload.chatId || "");
      if (!chatId) return;

      try {
        await chatService.assertChatAccess(chatId, user._id);
        socket.to(`chat:${chatId}`).emit("typing", {
          chatId,
          userId,
          isTyping: Boolean(payload.isTyping),
        });
      } catch (_error) {
        // Ignore invalid typing payloads silently.
      }
    });

    socket.on("mark_seen", async (payload = {}, ack) => {
      const chatId = String(payload.chatId || "");
      if (!chatId) {
        if (typeof ack === "function") {
          ack({ ok: false, error: "chatId is required" });
        }
        return;
      }

      try {
        const chat = await chatService.assertChatAccess(chatId, user._id);
        await chatService.markSeen(chatId, user._id);

        io.to(`chat:${chatId}`).emit("messages_seen", {
          chatId,
          seenBy: userId,
        });
        emitToUser(String(chat.patientId), "messages_seen", {
          chatId,
          seenBy: userId,
        });
        emitToUser(String(chat.doctorId), "messages_seen", {
          chatId,
          seenBy: userId,
        });

        if (typeof ack === "function") {
          ack({ ok: true });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, error: error?.message || "Failed to mark seen" });
        }
      }
    });

    socket.on("block_chat", async (payload = {}, ack) => {
      const chatId = String(payload.chatId || "");

      try {
        const chat = await chatService.blockChat(
          chatId,
          user,
          Boolean(payload.block),
        );
        const data = {
          chatId: String(chat._id),
          isBlocked: Boolean(chat.isBlocked),
          blockedBy: chat.blockedBy ? String(chat.blockedBy) : null,
        };

        io.to(`chat:${chatId}`).emit("chat_blocked", data);
        emitToUser(
          String(chat.patientId?._id || chat.patientId),
          "chat_blocked",
          data,
        );
        emitToUser(
          String(chat.doctorId?._id || chat.doctorId),
          "chat_blocked",
          data,
        );

        if (typeof ack === "function") {
          ack({ ok: true, data });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, error: error?.message || "Failed to block chat" });
        }
      }
    });

    socket.on("disconnect", () => {
      const roomId = String(activeCallRoomByUser.get(userId) || "");
      if (roomId) {
        io.to(`call:${roomId}`).emit("call:end", {
          roomId,
          by: userId,
          reason: "disconnect",
        });
        if (pendingCallsByRoom.has(roomId)) clearPendingCall(roomId, "ended");
        if (activeCallsByRoom.has(roomId)) clearActiveCall(roomId, "ended");
      }

      setUserOffline(userId, socket.id);
      socket.broadcast.emit("user_status", {
        userId,
        online: isUserOnline(userId),
      });
    });
  });

  return io;
}

module.exports = {
  initSocket,
  getSocketServer,
  emitToUser,
  emitToRole,
};
