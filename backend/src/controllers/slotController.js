const dayjs = require("dayjs");
const Slot = require("../models/Slot");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

const createSlot = catchAsync(async (req, res) => {
  const date = dayjs(req.body.date).startOf("day").toDate();
  const dayOfWeek = dayjs(date).day();

  const slot = await Slot.create({
    doctor: req.user._id,
    date,
    dayOfWeek,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    durationMinutes: req.body.durationMinutes,
    status: "available",
  });

  return res.status(201).json(new ApiResponse(201, "Slot created", slot));
});

const getSlotsByDoctor = catchAsync(async (req, res) => {
  const query = { doctor: req.params.doctorId };
  if (req.query.date) {
    const date = dayjs(req.query.date).startOf("day");
    query.date = { $gte: date.toDate(), $lte: date.endOf("day").toDate() };
  }

  const slots = await Slot.find(query).sort({ date: 1, startTime: 1 }).lean();
  return res.status(200).json(new ApiResponse(200, "Slots fetched", slots));
});

const deleteSlot = catchAsync(async (req, res) => {
  const slot = await Slot.findById(req.params.id);
  if (!slot) throw new ApiError(404, "Slot not found");

  if (
    String(slot.doctor) !== String(req.user._id) &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Not allowed to delete this slot");
  }

  if (slot.status === "booked") {
    throw new ApiError(400, "Cannot delete booked slot");
  }

  await slot.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, "Slot deleted", { id: req.params.id }));
});

module.exports = {
  createSlot,
  getSlotsByDoctor,
  deleteSlot,
};
