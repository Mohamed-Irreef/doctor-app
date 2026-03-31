const app = require("./app");
const http = require("http");
const { connectDB } = require("./config/db");
const env = require("./config/env");
const { initSocket } = require("./realtime/socket");
const { logError, logInfo } = require("./utils/logger");

async function start() {
  await connectDB();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    console.log(`NiviDoc backend running on port ${env.port}`);
    console.log("Mongodb Connected");
    logInfo("server_started", {
      port: env.port,
      env: process.env.NODE_ENV || "development",
    });
  });
}

start().catch((err) => {
   
  console.error(err);
  logError("server_start_failed", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logError(
    "unhandled_rejection",
    reason instanceof Error ? reason : new Error(String(reason)),
  );
});

process.on("uncaughtException", (error) => {
  logError("uncaught_exception", error);
});
