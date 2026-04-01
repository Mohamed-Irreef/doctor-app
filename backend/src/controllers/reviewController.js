const Review = require("../models/Review");
const DoctorProfile = require("../models/DoctorProfile");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

const createReview = catchAsync(async (req, res) => {
  const doctorId = req.body.doctorId;
  const appointmentId = req.body.appointmentId || null;

  if (!doctorId) {
    throw new ApiError(400, "Doctor id is required");
  }

  if (appointmentId) {
    const exists = await Review.findOne({ appointment: appointmentId }).lean();
    if (exists) {
      throw new ApiError(409, "Review already submitted for this appointment");
    }
  } else {
    const exists = await Review.findOne({
      doctor: doctorId,
      patient: req.user._id,
      appointment: null,
    }).lean();
    if (exists) {
      throw new ApiError(409, "You have already reviewed this doctor");
    }
  }

  const review = await Review.create({
    doctor: doctorId,
    patient: req.user._id,
    appointment: appointmentId,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  const stats = await Review.aggregate([
    { $match: { doctor: review.doctor } },
    {
      $group: { _id: "$doctor", avg: { $avg: "$rating" }, count: { $sum: 1 } },
    },
  ]);

  if (stats[0]) {
    await DoctorProfile.findOneAndUpdate(
      { user: review.doctor },
      { rating: Number(stats[0].avg.toFixed(1)), reviewsCount: stats[0].count },
      { new: true },
    );
  }

  return res.status(201).json(new ApiResponse(201, "Review submitted", review));
});

module.exports = { createReview };
