const { Server } = require("socket.io");
const User = require("../models/User");
const env = require("../config/env");
const { verifyAccessToken } = require("../utils/token");
const chatService = require("../modules/chat/chat.service");

let io;
const onlineSocketsByUser = new Map();

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
