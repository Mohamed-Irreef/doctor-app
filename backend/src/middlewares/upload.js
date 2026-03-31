const multer = require("multer");

const storage = multer.memoryStorage();
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      const error = new Error(
        "Unsupported file type. Allowed formats: PDF, JPEG, PNG, WEBP.",
      );
      error.statusCode = 400;
      error.code = "UNSUPPORTED_FILE_TYPE";
      cb(error);
      return;
    }
    cb(null, true);
  },
});

module.exports = upload;
