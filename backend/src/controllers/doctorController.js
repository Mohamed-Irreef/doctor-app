const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");
const Subscription = require("../models/Subscription");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

const mapDoctorCard = (row) => ({
  id: row.user._id,
  name: row.user.name,
  specialization: row.specialization,
  experience: `${row.experienceYears} Years`,
  rating: row.rating,
  reviews: row.reviewsCount,
  fee: row.consultationFee,
  hospital: row.hospital,
  about: row.bio,
  image: row.user.image,
  availableSlots: [],
  qualifications: row.qualifications,
  status: row.user.status,
  doctorApprovalStatus: row.user.doctorApprovalStatus,
});

const doctorSignupRequest = catchAsync(async (req, res) => {
  const exists = await User.findOne({ email: req.body.email.toLowerCase() });
  if (exists) throw new ApiError(409, "Email already registered");

  const user = new User({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    role: "doctor",
    authProvider: "local",
    doctorApprovalStatus: "pending",
  });

  await user.setPassword(req.body.password);
  await user.save();

  const profile = await DoctorProfile.create({
    user: user._id,
    specialization: req.body.specialization,
    qualifications: req.body.qualifications,
    licenseNumber: req.body.licenseNumber,
    experienceYears: req.body.experienceYears,
    consultationFee: req.body.consultationFee,
    consultationFeeVideo: req.body.consultationFeeVideo,
    consultationFeeInPerson: req.body.consultationFeeInPerson,
    consultationFeeChat: req.body.consultationFeeChat,
    availabilityType: req.body.availabilityType,
    clinicName: req.body.clinicName,
    clinicAddress: req.body.clinicAddress,
    hospital: req.body.hospital,
    bio: req.body.bio,
    languages: req.body.languages,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, "Doctor signup request submitted", {
        userId: user._id,
        profileId: profile._id,
      }),
    );
});

const getDoctors = catchAsync(async (req, res) => {
  const { q, specialization, sort = "rating" } = req.query;

  const profileFilter = {};
  if (specialization) profileFilter.specialization = specialization;

  let query = DoctorProfile.find(profileFilter).populate({
    path: "user",
    select: "name image status doctorApprovalStatus",
    match: {
      role: "doctor",
      doctorApprovalStatus: "approved",
      status: "active",
    },
  });

  if (sort === "experience") query = query.sort({ experienceYears: -1 });
  else if (sort === "fee") query = query.sort({ consultationFee: 1 });
  else query = query.sort({ rating: -1 });

  const rows = (await query.lean()).filter((x) => x.user);
  let doctors = rows.map(mapDoctorCard);

  if (q) {
    const needle = String(q).toLowerCase();
    doctors = doctors.filter((d) =>
      `${d.name} ${d.specialization} ${d.hospital}`
        .toLowerCase()
        .includes(needle),
    );
  }

  return res.status(200).json(new ApiResponse(200, "Doctors fetched", doctors));
});

const getDoctorById = catchAsync(async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.params.id })
    .populate("user", "name image status doctorApprovalStatus")
    .lean();
  if (!profile || !profile.user) throw new ApiError(404, "Doctor not found");
  return res
    .status(200)
    .json(new ApiResponse(200, "Doctor fetched", mapDoctorCard(profile)));
});

const updateDoctorProfile = catchAsync(async (req, res) => {
  const profile = await DoctorProfile.findOneAndUpdate(
    { user: req.user._id },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!profile) throw new ApiError(404, "Doctor profile not found");

  return res
    .status(200)
    .json(new ApiResponse(200, "Doctor profile updated", profile));
});

const getDoctorAppointments = catchAsync(async (req, res) => {
  const appointments = await Appointment.find({ doctor: req.user._id })
    .populate("patient", "name email phone image")
    .sort({ createdAt: -1 })
    .lean();
  return res
    .status(200)
    .json(new ApiResponse(200, "Doctor appointments fetched", appointments));
});

const getDoctorSubscription = catchAsync(async (req, res) => {
  const subscription = await Subscription.findOne({ doctor: req.params.id })
    .populate("plan")
    .sort({ createdAt: -1 })
    .lean();
  if (!subscription) throw new ApiError(404, "No subscription found");
  return res
    .status(200)
    .json(new ApiResponse(200, "Doctor subscription fetched", subscription));
});

module.exports = {
  doctorSignupRequest,
  getDoctors,
  getDoctorById,
  updateDoctorProfile,
  getDoctorAppointments,
  getDoctorSubscription,
};
