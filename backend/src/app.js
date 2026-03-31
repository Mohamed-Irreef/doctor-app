const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const requestLogger = require("./middlewares/requestLogger");
const sanitizeInput = require("./middlewares/sanitizeInput");
const env = require("./config/env");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

let sentry;
try {
  // Optional: enabled only when @sentry/node is installed and SENTRY_DSN is configured.
   
  sentry = require("@sentry/node");
  if (process.env.SENTRY_DSN) {
    sentry.init({ dsn: process.env.SENTRY_DSN });
  }
} catch (_error) {
  sentry = null;
}

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);
app.use(morgan("dev"));
app.use(requestLogger);
app.use(
  cors({
    origin: env.corsOrigin.length ? env.corsOrigin : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeInput);

if (sentry && process.env.SENTRY_DSN) {
  app.use(sentry.Handlers.requestHandler());
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many authentication requests. Please try again later.",
  },
});

app.use("/api/auth", authLimiter);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  routes,
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "nividoc-backend" });
});

app.use(notFound);
if (sentry && process.env.SENTRY_DSN) {
  app.use(sentry.Handlers.errorHandler());
}
app.use(errorHandler);

module.exports = app;
