const express = require("express");
const validate = require("../../middlewares/validate");
const { protectRoute, authorizeRoles } = require("../../middlewares/auth");
const {
  createChat,
  getUserChats,
  getChatMessages,
  sendChatMessage,
  blockChat,
  markChatSeen,
} = require("./chat.controller");
const {
  createChatSchema,
  sendMessageSchema,
  listMessagesQuerySchema,
  blockChatSchema,
} = require("./chat.validation");

const router = express.Router();

router.post(
  "/create",
  protectRoute,
  authorizeRoles("patient", "doctor"),
  validate(createChatSchema),
  createChat,
);
router.get(
  "/user",
  protectRoute,
  authorizeRoles("patient", "doctor"),
  getUserChats,
);
router.get(
  "/:chatId/messages",
  protectRoute,
  authorizeRoles("patient", "doctor"),
  validate(listMessagesQuerySchema, "query"),
  getChatMessages,
);
router.post(
  "/:chatId/message",
  protectRoute,
  authorizeRoles("patient", "doctor"),
  validate(sendMessageSchema),
  sendChatMessage,
);
router.put(
  "/:chatId/block",
  protectRoute,
  authorizeRoles("doctor"),
  validate(blockChatSchema),
  blockChat,
);
router.put(
  "/:chatId/seen",
  protectRoute,
  authorizeRoles("patient", "doctor"),
  markChatSeen,
);

module.exports = router;
