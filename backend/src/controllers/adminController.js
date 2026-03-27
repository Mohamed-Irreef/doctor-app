const dayjs = require("dayjs");
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");
const LabTest = require("../models/LabTest");
const Medicine = require("../models/Medicine");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const Review = require("../models/Review");
const Subscription = require("../models/Subscription");
const PlatformSetting = require("../models/PlatformSetting");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { sendDoctorApprovalEmail } = require("../services/emailService");

const getDashboard = catchAsync(async (_req, res) => {
  const [patientsCount, doctorsCount, appointmentsToday, revenueByType] =
    await Promise.all([
      User.countDocuments({ role: "patient" }),
      User.countDocuments({ role: "doctor", doctorApprovalStatus: "approved" }),
      Appointment.countDocuments({
        date: {
          $gte: dayjs().startOf("day").toDate(),
          $lte: dayjs().endOf("day").toDate(),
        },
      }),
      Payment.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
            commission: { $sum: "$commissionAmount" },
          },
        },
      ]),
    ]);

  return res.status(200).json(
    new ApiResponse(200, "Dashboard metrics fetched", {
      totals: {
        patientsCount,
        doctorsCount,
        appointmentsToday,
      },
      revenueByType,
    }),
  );
});

const getPatients = catchAsync(async (_req, res) => {
  const patients = await User.find({ role: "patient" })
    .select("name email phone status createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return res
    .status(200)
    .json(new ApiResponse(200, "Patients fetched", patients));
});

const getDoctors = catchAsync(async (req, res) => {
  const filter = { role: "doctor" };
  if (req.query.status) filter.doctorApprovalStatus = req.query.status;

  const doctors = await User.find(filter)
    .select("name email phone image status doctorApprovalStatus createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const ids = doctors.map((d) => d._id);
  const profiles = await DoctorProfile.find({ user: { $in: ids } }).lean();
  const profileMap = new Map(profiles.map((p) => [String(p.user), p]));

  const merged = doctors.map((doc) => ({
    ...doc,
    profile: profileMap.get(String(doc._id)) || null,
  }));

  return res.status(200).json(new ApiResponse(200, "Doctors fetched", merged));
});

const approveDoctor = catchAsync(async (req, res) => {
  const doctor = await User.findById(req.body.doctorUserId);
  if (!doctor || doctor.role !== "doctor")
    throw new ApiError(404, "Doctor account not found");

  doctor.doctorApprovalStatus = req.body.approved ? "approved" : "rejected";
  await doctor.save();

  await sendDoctorApprovalEmail(doctor.email, doctor.name, req.body.approved);

  return res
    .status(200)
    .json(new ApiResponse(200, "Doctor decision updated", doctor));
});

const getAppointments = catchAsync(async (_req, res) => {
  const appointments = await Appointment.find({})
    .populate("patient", "name")
    .populate("doctor", "name")
    .sort({ createdAt: -1 })
    .lean();
  return res
    .status(200)
    .json(new ApiResponse(200, "Appointments fetched", appointments));
});

const createLab = catchAsync(async (req, res) => {
  const lab = await LabTest.create(req.body);
  return res.status(201).json(new ApiResponse(201, "Lab test created", lab));
});

const createMedicine = catchAsync(async (req, res) => {
  const med = await Medicine.create(req.body);
  return res.status(201).json(new ApiResponse(201, "Medicine created", med));
});

const getPayments = catchAsync(async (_req, res) => {
  const payments = await Payment.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .lean();
  return res
    .status(200)
    .json(new ApiResponse(200, "Payments fetched", payments));
});

const createNotification = catchAsync(async (req, res) => {
  const notification = await Notification.create({
    title: req.body.title,
    message: req.body.message,
    type: req.body.type,
    audienceType: req.body.audienceType,
    recipient: req.body.recipientId || undefined,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Notification created", notification));
});

const updateSettings = catchAsync(async (req, res) => {
  const entries = Object.entries(req.body);
  const updated = [];

  for (const [key, value] of entries) {
    const doc = await PlatformSetting.findOneAndUpdate(
      { key },
      { value, updatedBy: req.user._id },
      { upsert: true, new: true },
    );
    updated.push(doc);
  }

  if (req.body.consultationCommissionPercent !== undefined) {
    await PlatformSetting.findOneAndUpdate(
      { key: "APPOINTMENT_COMMISSION_PERCENT" },
      {
        value: req.body.consultationCommissionPercent,
        updatedBy: req.user._id,
      },
      { upsert: true, new: true },
    );
  }

  if (req.body.pharmacyCommissionPercent !== undefined) {
    await PlatformSetting.findOneAndUpdate(
      { key: "PHARMACY_COMMISSION_PERCENT" },
      { value: req.body.pharmacyCommissionPercent, updatedBy: req.user._id },
      { upsert: true, new: true },
    );
  }

  if (req.body.labCommissionPercent !== undefined) {
    await PlatformSetting.findOneAndUpdate(
      { key: "LAB_COMMISSION_PERCENT" },
      { value: req.body.labCommissionPercent, updatedBy: req.user._id },
      { upsert: true, new: true },
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Settings updated", updated));
});

const getReviews = catchAsync(async (_req, res) => {
  const reviews = await Review.find({})
    .populate("patient", "name")
    .populate("doctor", "name")
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, "Reviews fetched", reviews));
});

const deleteReview = catchAsync(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found");
  await review.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, "Review deleted", { id: req.params.id }));
});

const getRevenueBreakdown = catchAsync(async (_req, res) => {
  const breakdown = await Payment.aggregate([
    { $match: { status: "paid" } },
    {
      $group: {
        _id: "$type",
        totalAmount: { $sum: "$amount" },
        platformRevenue: { $sum: "$commissionAmount" },
      },
    },
  ]);

  const subscriptions = await Subscription.countDocuments({ status: "active" });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Revenue breakdown fetched", {
        breakdown,
        activeSubscriptions: subscriptions,
      }),
    );
});

const getSubscriptions = catchAsync(async (_req, res) => {
  const subs = await Subscription.find({})
    .populate("doctor", "name email")
    .populate("plan", "name code price interval")
    .sort({ createdAt: -1 })
    .lean();
  return res
    .status(200)
    .json(new ApiResponse(200, "Subscriptions fetched", subs));
});

module.exports = {
  getDashboard,
  getPatients,
  getDoctors,
  approveDoctor,
  getAppointments,
  createLab,
  createMedicine,
  getPayments,
  createNotification,
  updateSettings,
  getReviews,
  deleteReview,
  getRevenueBreakdown,
  getSubscriptions,
};
