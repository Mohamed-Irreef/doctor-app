const { logInfo } = require("../utils/logger");

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    logInfo("http_request", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      userId: req.user?._id,
    });
  });

  next();
}

module.exports = requestLogger;
