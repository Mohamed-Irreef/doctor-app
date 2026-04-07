const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const DoctorProfile = require("../models/DoctorProfile");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { signAccessToken, signRefreshToken } = require("../utils/token");
const env = require("../config/env");
const { sendEmail } = require("../services/emailService");

const googleClient = new OAuth2Client(env.googleClientId);

function buildAuthPayload(user) {
  const payload = { sub: String(user._id), role: user.role, email: user.email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      image: user.image,
      role: user.role,
      doctorApprovalStatus: user.doctorApprovalStatus,
      labApprovalStatus: user.labApprovalStatus,
      pharmacyApprovalStatus: user.pharmacyApprovalStatus,
    },
  };
}

function isPatientProfileComplete(user, profile) {
  return Boolean(
    user?.name &&
    user?.phone &&
    user?.image &&
    profile?.gender &&
    profile?.dateOfBirth &&
    profile?.bloodGroup &&
    profile?.address &&
    profile?.emergencyContact,
  );
}

const registerPatient = catchAsync(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email.toLowerCase() });
  if (existing) throw new ApiError(409, "Email already registered");

  const user = new User({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    image: req.body.image,
    role: "patient",
    authProvider: "local",
  });
  await user.setPassword(req.body.password);
  await user.save();

  await PatientProfile.create({
    user: user._id,
    gender: req.body.gender,
    dateOfBirth: req.body.dateOfBirth
      ? new Date(req.body.dateOfBirth)
      : undefined,
    bloodGroup: req.body.bloodGroup,
    address: req.body.address,
    emergencyContact: req.body.emergencyContact,
    location: req.body.location,
    allergies: req.body.allergies || [],
    medicalConditions: req.body.medicalConditions || [],
  });

  await sendEmail({
    to: user.email,
    subject: "Welcome to NiviDoc",
    html: `<p>Hi ${user.name}, your patient account is ready.</p>`,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Patient registered", buildAuthPayload(user)));
});

const login = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (!user) throw new ApiError(401, "Invalid credentials");

  if (user.role !== req.body.role) {
    throw new ApiError(403, "Role mismatch for this account");
  }

  const ok = await user.comparePassword(req.body.password);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  if (user.role === "doctor" && user.doctorApprovalStatus !== "approved") {
    throw new ApiError(403, "Doctor account is pending admin approval");
  }
  if (user.role === "lab_admin" && user.labApprovalStatus !== "approved") {
    throw new ApiError(403, "Lab account is pending admin approval");
  }
  if (
    user.role === "pharmacy_admin" &&
    user.pharmacyApprovalStatus !== "approved"
  ) {
    throw new ApiError(403, "Pharmacy account is pending admin approval");
  }

  if (user.status !== "active") throw new ApiError(403, "Account is inactive");

  return res
    .status(200)
    .json(new ApiResponse(200, "Login successful", buildAuthPayload(user)));
});

const googleAuth = catchAsync(async (req, res) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: req.body.idToken,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();

  if (!payload?.email) {
    throw new ApiError(400, "Invalid Google profile");
  }

  let user = await User.findOne({ email: payload.email.toLowerCase() });
  if (!user) {
    user = await User.create({
      name: payload.name || "Google User",
      email: payload.email.toLowerCase(),
      phone: "",
      role: req.body.role,
      image: payload.picture,
      authProvider: "google",
      googleId: payload.sub,
      doctorApprovalStatus: req.body.role === "doctor" ? "pending" : "none",
      isEmailVerified: true,
    });

    if (req.body.role === "patient") {
      await PatientProfile.create({ user: user._id });
    } else {
      await DoctorProfile.create({
        user: user._id,
        specialization: "General",
        qualifications: [],
        licenseNumber: `GOOGLE-${user._id}`,
      });
    }
  }

  if (user.role !== req.body.role) {
    throw new ApiError(403, "Role mismatch for this Google account");
  }

  if (user.role === "doctor" && user.doctorApprovalStatus !== "approved") {
    throw new ApiError(403, "Doctor account is pending admin approval");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Google login successful", buildAuthPayload(user)),
    );
});

const me = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select("-passwordHash").lean();
  let profile = null;
  if (user.role === "doctor") {
    profile = await DoctorProfile.findOne({ user: user._id }).lean();
  } else if (user.role === "patient") {
    profile = await PatientProfile.findOne({ user: user._id }).lean();
  }

  const profileComplete =
    user.role === "patient" ? isPatientProfileComplete(user, profile) : true;

  return res.status(200).json(
    new ApiResponse(200, "Profile fetched", {
      user,
      profile,
      profileComplete,
    }),
  );
});

const updatePatientProfile = catchAsync(async (req, res) => {
  if (req.user.role !== "patient") {
    throw new ApiError(403, "Only patient can update this profile");
  }

  const userUpdates = {};
  if (req.body.name) userUpdates.name = req.body.name;
  if (req.body.phone) userUpdates.phone = req.body.phone;
  if (req.body.image) userUpdates.image = req.body.image;

  if (Object.keys(userUpdates).length) {
    await User.findByIdAndUpdate(req.user._id, userUpdates, {
      new: true,
      runValidators: true,
    });
  }

  const profileUpdates = {
    gender: req.body.gender,
    dateOfBirth: req.body.dateOfBirth
      ? new Date(req.body.dateOfBirth)
      : undefined,
    bloodGroup: req.body.bloodGroup,
    address: req.body.address,
    emergencyContact: req.body.emergencyContact,
    location: req.body.location,
    allergies: req.body.allergies,
    medicalConditions: req.body.medicalConditions,
  };

  Object.keys(profileUpdates).forEach((key) => {
    if (profileUpdates[key] === undefined) {
      delete profileUpdates[key];
    }
  });

  const profile = await PatientProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: profileUpdates,
      $setOnInsert: { user: req.user._id },
    },
    {
      new: true,
      runValidators: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  ).lean();

  const user = await User.findById(req.user._id).select("-passwordHash").lean();
  const profileComplete = isPatientProfileComplete(user, profile);

  return res.status(200).json(
    new ApiResponse(200, "Patient profile updated", {
      user,
      profile,
      profileComplete,
    }),
  );
});

module.exports = {
  registerPatient,
  login,
  googleAuth,
  me,
  updatePatientProfile,
};
