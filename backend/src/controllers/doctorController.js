const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const DoctorLike = require("../models/DoctorLike");
const Review = require("../models/Review");
const Appointment = require("../models/Appointment");
const Subscription = require("../models/Subscription");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

const DEFAULT_DOCTOR_BANNER_URL =
  "https://res.cloudinary.com/dvbpddm9g/image/upload/v1774791127/nividoc/doctors/banners/kbacvcvtl4a1rgjzy6cs.png";

const mapDoctorCard = (row) => ({
  id: row.user._id,
  name: row.user.name,
  specialization: row.specialization,
  experience: `${row.experienceYears} Years`,
  rating: row.rating,
  reviews: row.reviewsCount,
  likes: row.likesCount || 0,
  fee: row.consultationFee,
  hospital: row.hospital,
  about: row.bio,
  bannerImage: row.bannerImage || DEFAULT_DOCTOR_BANNER_URL,
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
    image: req.body.image,
    role: "doctor",
    authProvider: "local",
    doctorApprovalStatus: "pending",
  });

  await user.setPassword(req.body.password);
  await user.save();

  const certificateUrls = Array.isArray(req.body.certificateUrls)
    ? req.body.certificateUrls
    : [];
  const certificateFiles = Array.isArray(req.body.certificateFiles)
    ? req.body.certificateFiles
    : [];
  const normalizedCertificateUrls = certificateUrls.length
    ? certificateUrls
    : certificateFiles.map((file) => file?.url).filter(Boolean);

  const profile = await DoctorProfile.create({
    user: user._id,
    gender: req.body.gender,
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
    clinicLocation: req.body.clinicLocation,
    hospital: req.body.hospital,
    bio: req.body.bio,
    languages: req.body.languages,
    certificateUrls: normalizedCertificateUrls,
    certificateFiles,
  });

  await Notification.create({
    title: "New doctor signup request",
    message: `${user.name} submitted profile for approval`,
    type: "doctor-approval",
    audienceType: "all",
    targetEntityType: "User",
    targetEntityId: user._id,
  });

  return res.status(201).json(
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

const getDoctorReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({
    doctor: req.params.id,
    moderationStatus: "visible",
  })
    .populate("patient", "name image")
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, "Doctor reviews fetched", reviews));
});

const toggleDoctorLike = catchAsync(async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.params.id })
    .select("_id")
    .lean();
  if (!profile) throw new ApiError(404, "Doctor not found");

  const existing = await DoctorLike.findOne({
    doctor: req.params.id,
    user: req.user._id,
  }).lean();

  let liked = false;
  if (existing) {
    await DoctorLike.deleteOne({ _id: existing._id });
  } else {
    await DoctorLike.create({ doctor: req.params.id, user: req.user._id });
    liked = true;
  }

  const likesCount = await DoctorLike.countDocuments({ doctor: req.params.id });
  await DoctorProfile.updateOne({ user: req.params.id }, { likesCount });

  return res.status(200).json(
    new ApiResponse(200, liked ? "Doctor liked" : "Doctor unliked", {
      doctorId: req.params.id,
      liked,
      likesCount,
    }),
  );
});

const getMyDoctorLikes = catchAsync(async (req, res) => {
  const ids = String(req.query.ids || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const filter = { user: req.user._id };
  if (ids.length) {
    filter.doctor = { $in: ids };
  }

  const likes = await DoctorLike.find(filter).select("doctor -_id").lean();
  const likedDoctorIds = likes.map((item) => String(item.doctor));

  return res.status(200).json(
    new ApiResponse(200, "Doctor likes fetched", {
      likedDoctorIds,
    }),
  );
});

const updateDoctorProfile = catchAsync(async (req, res) => {
  const userUpdates = {};
  if (req.body.name !== undefined) userUpdates.name = req.body.name;
  if (req.body.phone !== undefined) userUpdates.phone = req.body.phone;
  if (req.body.image !== undefined) userUpdates.image = req.body.image;

  if (Object.keys(userUpdates).length) {
    await User.findByIdAndUpdate(req.user._id, userUpdates, {
      new: true,
      runValidators: true,
    });
  }

  const profileUpdates = { ...req.body };
  delete profileUpdates.name;
  delete profileUpdates.phone;
  delete profileUpdates.image;

  if (
    profileUpdates.certificateFiles &&
    Array.isArray(profileUpdates.certificateFiles) &&
    !profileUpdates.certificateUrls
  ) {
    profileUpdates.certificateUrls = profileUpdates.certificateFiles
      .map((file) => file?.url)
      .filter(Boolean);
  }

  const profile = await DoctorProfile.findOneAndUpdate(
    { user: req.user._id },
    profileUpdates,
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!profile) throw new ApiError(404, "Doctor profile not found");

  const user = await User.findById(req.user._id).select("-passwordHash").lean();

  return res
    .status(200)
    .json(new ApiResponse(200, "Doctor profile updated", { user, profile }));
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
  getDoctorReviews,
  toggleDoctorLike,
  getMyDoctorLikes,
  updateDoctorProfile,
  getDoctorAppointments,
  getDoctorSubscription,
};
