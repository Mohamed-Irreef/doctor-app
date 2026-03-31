const fs = require("fs");
const path = require("path");

const LOG_FILE = path.resolve(__dirname, "../../logs/error.log");

function parseLogLine(line) {
  if (!line || !line.trim()) return null;

  try {
    return JSON.parse(line);
  } catch {
    return {
      level: "error",
      event: "unparsed_log_line",
      message: line.trim(),
      timestamp: null,
    };
  }
}

function getErrorLogs({ limit = 100 } = {}) {
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }

  const raw = fs.readFileSync(LOG_FILE, "utf8");
  const parsed = raw
    .split("\n")
    .map(parseLogLine)
    .filter(Boolean)
    .slice(-Math.max(1, Math.min(Number(limit) || 100, 500)))
    .reverse();

  return parsed;
}

module.exports = {
  getErrorLogs,
};
