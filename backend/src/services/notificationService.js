const Notification = require("../models/Notification");

async function createNotification(payload) {
  return Notification.create(payload);
}

async function listForUser(user) {
  const query = {
    $or: [
      { audienceType: "all" },
      { audienceType: user.role === "doctor" ? "doctors" : "patients" },
      { audienceType: "single", recipient: user._id },
    ],
  };

  return Notification.find(query).sort({ createdAt: -1 }).limit(100).lean();
}

module.exports = {
  createNotification,
  listForUser,
};
