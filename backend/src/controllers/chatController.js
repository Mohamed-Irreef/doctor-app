const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const {
  listAppointmentMessages,
  createAppointmentMessage,
} = require("../services/chatService");
const { emitToUser } = require("../realtime/socket");

const getAppointmentMessages = catchAsync(async (req, res) => {
  const data = await listAppointmentMessages(req.params.id, req.user._id, {
    limit: req.query.limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Chat messages fetched", data));
});

const sendAppointmentMessage = catchAsync(async (req, res) => {
  const { appointment, message } = await createAppointmentMessage(
    req.params.id,
    req.user._id,
    req.body,
  );

  emitToUser(String(appointment.patient), "chat:message:new", message);
  emitToUser(String(appointment.doctor), "chat:message:new", message);

  return res.status(201).json(new ApiResponse(201, "Message sent", message));
});

module.exports = {
  getAppointmentMessages,
  sendAppointmentMessage,
};
