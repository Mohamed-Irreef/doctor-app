const ApiResponse = require("../../utils/ApiResponse");
const catchAsync = require("../../utils/catchAsync");
const aiService = require("./ai.service");

const chat = catchAsync(async (req, res) => {
  const result = await aiService.chatWithAi({
    messages: req.body.messages,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "AI response generated", result));
});

module.exports = {
  chat,
};
