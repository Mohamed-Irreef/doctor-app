const ApiError = require("../utils/ApiError");
const { logError } = require("../utils/logger");

function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Multer emits errors without statusCode; normalize to explicit 4xx responses.
  if (err?.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      statusCode = 413;
      message = "File too large. Maximum allowed size is 10 MB.";
    } else {
      statusCode = 400;
      message = err.message || "Invalid upload payload";
    }
  }

  if (err?.code === "UNSUPPORTED_FILE_TYPE") {
    statusCode = 400;
    message = err.message || "Unsupported file type";
  }

  logError("request_failed", err, {
    statusCode,
    message,
  });

  return res.status(statusCode).json({
    status: "error",
    message,
    details: err.details || null,
  });
}

module.exports = { notFound, errorHandler };
