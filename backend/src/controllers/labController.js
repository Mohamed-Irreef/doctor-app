const dayjs = require("dayjs");
const LabTest = require("../models/LabTest");
const LabBooking = require("../models/LabBooking");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { requirePatientProfileComplete } = require("../utils/profileCompletion");

const getLabs = catchAsync(async (req, res) => {
  const filter = { active: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.q) {
    filter.$text = { $search: req.query.q };
  }

  const labs = await LabTest.find(filter)
    .sort({ popular: -1, createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, "Lab tests fetched", labs));
});

const getLabById = catchAsync(async (req, res) => {
  const lab = await LabTest.findById(req.params.id).lean();
  if (!lab) throw new ApiError(404, "Lab test not found");
  return res.status(200).json(new ApiResponse(200, "Lab test fetched", lab));
});

const bookLab = catchAsync(async (req, res) => {
  await requirePatientProfileComplete(req.user._id);

  const lab = await LabTest.findById(req.body.labTestId);
  if (!lab || !lab.active) throw new ApiError(404, "Lab test not found");

  const booking = await LabBooking.create({
    patient: req.user._id,
    labTest: lab._id,
    bookingDate: dayjs(req.body.bookingDate).toDate(),
    amount: lab.price,
    status: "booked",
  });

  return res.status(201).json(new ApiResponse(201, "Lab booked", booking));
});

module.exports = {
  getLabs,
  getLabById,
  bookLab,
};
