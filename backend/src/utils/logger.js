const fs = require("fs");
const path = require("path");

const LOG_DIR = path.resolve(__dirname, "../../logs");

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function writeLine(fileName, payload) {
  ensureLogDir();
  const line = `${JSON.stringify({ timestamp: new Date().toISOString(), ...payload })}\n`;
  fs.appendFile(path.join(LOG_DIR, fileName), line, () => {
    // Intentionally no-op; logging should never break request flow.
  });
}

function logInfo(event, payload = {}) {
  writeLine("app.log", { level: "info", event, ...payload });
}

function logError(event, error, payload = {}) {
  writeLine("error.log", {
    level: "error",
    event,
    message: error?.message || "Unknown error",
    stack: error?.stack,
    ...payload,
  });
}

function logPayment(event, payload = {}) {
  writeLine("payment.log", { level: "info", event, ...payload });
}

module.exports = {
  logInfo,
  logError,
  logPayment,
};
