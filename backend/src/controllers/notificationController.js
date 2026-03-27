const Notification = require("../models/Notification");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

const getMyNotifications = catchAsync(async (req, res) => {
  const query = {
    $or: [
      { audienceType: "all" },
      { audienceType: req.user.role === "doctor" ? "doctors" : "patients" },
      { audienceType: "single", recipient: req.user._id },
    ],
  };

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .lean();
  return res
    .status(200)
    .json(new ApiResponse(200, "Notifications fetched", notifications));
});

module.exports = { getMyNotifications };
