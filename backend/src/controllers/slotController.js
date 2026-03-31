const dayjs = require("dayjs");
const Slot = require("../models/Slot");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

function parseTimeToMinutes(label) {
  const [timePart, period] = String(label).trim().split(" ");
  const [rawHour, minute] = timePart.split(":").map(Number);
  let hour = rawHour;
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function hasOverlap(slotA, slotB) {
  const aStart = parseTimeToMinutes(slotA.startTime);
  const aEnd = parseTimeToMinutes(slotA.endTime);
  const bStart = parseTimeToMinutes(slotB.startTime);
  const bEnd = parseTimeToMinutes(slotB.endTime);
  return aStart < bEnd && bStart < aEnd;
}

async function ensureNoOverlap({
  doctorId,
  date,
  startTime,
  endTime,
  excludeId,
}) {
  const query = {
    doctor: doctorId,
    date,
  };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await Slot.find(query).lean();
  const conflict = existing.find((slot) =>
    hasOverlap(
      { startTime, endTime },
      { startTime: slot.startTime, endTime: slot.endTime },
    ),
  );
  if (conflict) {
    throw new ApiError(400, "Slot overlaps with an existing slot");
  }
}

async function clearExpiredHoldsForDoctor(doctorId) {
  await Slot.updateMany(
    {
      doctor: doctorId,
      status: "blocked",
      holdExpiresAt: { $lte: new Date() },
    },
    {
      $set: { status: "available" },
      $unset: { heldBy: 1, holdExpiresAt: 1, appointment: 1 },
    },
  );
}

const createSlot = catchAsync(async (req, res) => {
  const date = dayjs(req.body.date).startOf("day").toDate();
  const dayOfWeek = dayjs(date).day();

  await ensureNoOverlap({
    doctorId: req.user._id,
    date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
  });

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
  await clearExpiredHoldsForDoctor(req.params.doctorId);

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

const updateSlot = catchAsync(async (req, res) => {
  const slot = await Slot.findById(req.params.id);
  if (!slot) throw new ApiError(404, "Slot not found");

  if (
    String(slot.doctor) !== String(req.user._id) &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Not allowed to update this slot");
  }

  if (slot.status === "booked") {
    throw new ApiError(400, "Cannot update a booked slot");
  }

  const date = req.body.date
    ? dayjs(req.body.date).startOf("day").toDate()
    : slot.date;
  const startTime = req.body.startTime || slot.startTime;
  const endTime = req.body.endTime || slot.endTime;

  await ensureNoOverlap({
    doctorId: slot.doctor,
    date,
    startTime,
    endTime,
    excludeId: slot._id,
  });

  slot.date = date;
  slot.dayOfWeek = dayjs(date).day();
  slot.startTime = startTime;
  slot.endTime = endTime;
  if (req.body.durationMinutes !== undefined) {
    slot.durationMinutes = req.body.durationMinutes;
  }
  if (req.body.status !== undefined) {
    slot.status = req.body.status;
  }

  await slot.save();
  return res.status(200).json(new ApiResponse(200, "Slot updated", slot));
});

const bulkCopySlots = catchAsync(async (req, res) => {
  const fromDate = dayjs(req.body.fromDate).startOf("day");
  const toDate = dayjs(req.body.toDate).startOf("day");
  if (!fromDate.isValid() || !toDate.isValid() || toDate.isBefore(fromDate)) {
    throw new ApiError(400, "Invalid date range");
  }

  const templateDate = fromDate.day(req.body.sourceDayOfWeek);
  const sourceSlots = await Slot.find({
    doctor: req.user._id,
    date: {
      $gte: templateDate.startOf("day").toDate(),
      $lte: templateDate.endOf("day").toDate(),
    },
  }).lean();

  if (!sourceSlots.length) {
    throw new ApiError(400, "No source slots found for selected template day");
  }

  const newSlots = [];
  let cursor = fromDate.startOf("day");
  while (cursor.isBefore(toDate) || cursor.isSame(toDate, "day")) {
    if (cursor.day() === req.body.targetDayOfWeek) {
      const slotDate = cursor.toDate();
      for (const source of sourceSlots) {
        const exists = await Slot.findOne({
          doctor: req.user._id,
          date: slotDate,
          startTime: source.startTime,
        }).lean();
        if (exists) continue;

        await ensureNoOverlap({
          doctorId: req.user._id,
          date: slotDate,
          startTime: source.startTime,
          endTime: source.endTime,
        });

        const created = await Slot.create({
          doctor: req.user._id,
          date: slotDate,
          dayOfWeek: cursor.day(),
          startTime: source.startTime,
          endTime: source.endTime,
          durationMinutes: source.durationMinutes,
          status: "available",
        });
        newSlots.push(created);
      }
    }
    cursor = cursor.add(1, "day");
  }

  return res.status(201).json(
    new ApiResponse(201, "Slots copied", {
      created: newSlots.length,
      slots: newSlots,
    }),
  );
});

module.exports = {
  createSlot,
  getSlotsByDoctor,
  deleteSlot,
  updateSlot,
  bulkCopySlots,
};
