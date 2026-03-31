const { Server } = require("socket.io");
const User = require("../models/User");
const env = require("../config/env");
const { verifyAccessToken } = require("../utils/token");

let io;

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

    socket.join(`user:${String(user._id)}`);
    if (user.role) {
      socket.join(`role:${String(user.role)}`);
    }

    socket.emit("lab:socket-ready", {
      connected: true,
      userId: String(user._id),
      role: user.role,
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
