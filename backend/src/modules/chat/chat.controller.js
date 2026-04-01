const ApiResponse = require("../../utils/ApiResponse");
const catchAsync = require("../../utils/catchAsync");
const chatService = require("./chat.service");

const createChat = catchAsync(async (req, res) => {
  const chat = await chatService.createOrGetChat(req.user, req.body);
  return res.status(201).json(new ApiResponse(201, "Chat ready", chat));
});

const getUserChats = catchAsync(async (req, res) => {
  const chats = await chatService.getUserChats(req.user._id);
  return res.status(200).json(new ApiResponse(200, "Chats fetched", chats));
});

const getChatMessages = catchAsync(async (req, res) => {
  const data = await chatService.listMessages(
    req.params.chatId,
    req.user._id,
    req.query,
  );
  return res.status(200).json(new ApiResponse(200, "Messages fetched", data));
});

const sendChatMessage = catchAsync(async (req, res) => {
  const result = await chatService.sendMessage(
    req.params.chatId,
    req.user._id,
    req.body,
  );
  return res
    .status(201)
    .json(new ApiResponse(201, "Message sent", result.message));
});

const blockChat = catchAsync(async (req, res) => {
  const chat = await chatService.blockChat(
    req.params.chatId,
    req.user,
    req.body.block,
  );
  return res.status(200).json(new ApiResponse(200, "Chat updated", chat));
});

const markChatSeen = catchAsync(async (req, res) => {
  await chatService.markSeen(req.params.chatId, req.user._id);
  return res.status(200).json(
    new ApiResponse(200, "Messages marked as seen", {
      chatId: req.params.chatId,
    }),
  );
});

module.exports = {
  createChat,
  getUserChats,
  getChatMessages,
  sendChatMessage,
  blockChat,
  markChatSeen,
};
