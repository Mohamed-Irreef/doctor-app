const Plan = require("../models/Plan");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

const getPlans = catchAsync(async (_req, res) => {
  const plans = await Plan.find({ isActive: true }).sort({ price: 1 }).lean();
  return res.status(200).json(new ApiResponse(200, "Plans fetched", plans));
});

module.exports = { getPlans };
