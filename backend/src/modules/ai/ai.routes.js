const express = require("express");
const rateLimit = require("express-rate-limit");
const validate = require("../../middlewares/validate");
const { aiChatSchema } = require("./ai.validation");
const { chat } = require("./ai.controller");

const router = express.Router();

// AI calls are costlier than regular API requests.
router.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: "error",
      message: "Too many AI requests. Please try again shortly.",
    },
  }),
);

router.post("/chat", validate(aiChatSchema), chat);

module.exports = router;
