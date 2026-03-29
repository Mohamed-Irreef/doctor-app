const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const ApiError = require("./ApiError");

async function requirePatientProfileComplete(userId) {
  const [user, profile] = await Promise.all([
    User.findById(userId).select("name phone image role").lean(),
    PatientProfile.findOne({ user: userId }).lean(),
  ]);

  if (!user || user.role !== "patient") {
    throw new ApiError(403, "Only patient accounts can perform this action");
  }

  const isComplete = Boolean(
    user.name &&
      user.phone &&
      user.image &&
      profile?.gender &&
      profile?.dateOfBirth &&
      profile?.bloodGroup &&
      profile?.address &&
      profile?.emergencyContact,
  );

  if (!isComplete) {
    throw new ApiError(
      400,
      "Complete your profile before booking appointments or placing orders",
    );
  }
}

module.exports = {
  requirePatientProfileComplete,
};
