const dayjs = require("dayjs");
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const PatientProfile = require("../models/PatientProfile");
const Appointment = require("../models/Appointment");
const LabTest = require("../models/LabTest");
const Medicine = require("../models/Medicine");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const Review = require("../models/Review");
const Subscription = require("../models/Subscription");
const Slot = require("../models/Slot");
const PlatformSetting = require("../models/PlatformSetting");
const cloudinary = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { sendDoctorApprovalEmail } = require("../services/emailService");

function parseCloudinaryAsset(url) {
  if (!url || typeof url !== "string") return null;

  const cleanedUrl = url.split("?")[0];
  const match = cleanedUrl.match(
    /res\.cloudinary\.com\/[^/]+\/([^/]+)\/([^/]+)\/(?:v\d+\/)?(.+)$/,
  );

  if (!match) return null;

  const resourceType = match[1] || "image";
  const deliveryType = match[2] || "upload";
  const pathWithExt = match[3] || "";
  const lastDotIndex = pathWithExt.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return {
      publicId: pathWithExt,
      format: undefined,
      resourceType,
      deliveryType,
    };
  }

  return {
    publicId: pathWithExt.slice(0, lastDotIndex),
    format: pathWithExt.slice(lastDotIndex + 1).toLowerCase(),
    resourceType,
    deliveryType,
  };
}

function buildSignedViewerUrl(url) {
  const parsed = parseCloudinaryAsset(url);
  if (!parsed?.publicId) return url;

  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 30;

  try {
    const privateUrl = cloudinary.utils.private_download_url(
      parsed.publicId,
      parsed.format,
      {
        resource_type: parsed.resourceType || "image",
        type: parsed.deliveryType || "upload",
        expires_at: expiresAt,
        attachment: false,
      },
    );

    if (privateUrl) return privateUrl;
  } catch {
    // Fallback to signed delivery URL below.
  }

  return cloudinary.url(parsed.publicId, {
    secure: true,
    sign_url: true,
    resource_type: parsed.resourceType || "image",
    type: parsed.deliveryType || "authenticated",
    format: parsed.format,
  });
}

function normalizeDoctorDocuments(profile) {
  if (!profile) return [];

  const files = Array.isArray(profile.certificateFiles)
    ? profile.certificateFiles
        .filter((item) => item && typeof item.url === "string" && item.url)
        .map((item) => ({
          url: item.url,
          name: item.name || "",
        }))
    : [];

  if (files.length) {
    return files.map((item) => ({
      ...item,
      viewerUrl: buildSignedViewerUrl(item.url),
    }));
  }

  const urls = Array.isArray(profile.certificateUrls)
    ? profile.certificateUrls.filter((item) => typeof item === "string" && item)
    : [];

  return urls.map((url) => ({
    url,
    name: "",
    viewerUrl: buildSignedViewerUrl(url),
  }));
}

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
    .select("name email phone image status createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const ids = patients.map((patient) => patient._id);
  const profiles = await PatientProfile.find({ user: { $in: ids } }).lean();
  const profileMap = new Map(
    profiles.map((profile) => [String(profile.user), profile]),
  );

  const merged = patients.map((patient) => ({
    ...patient,
    profile: profileMap.get(String(patient._id)) || null,
  }));

  return res.status(200).json(new ApiResponse(200, "Patients fetched", merged));
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

const getDoctorRequests = catchAsync(async (_req, res) => {
  const doctors = await User.find({
    role: "doctor",
    doctorApprovalStatus: "pending",
  })
    .select("name email phone image doctorApprovalStatus createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const ids = doctors.map((d) => d._id);
  const profiles = await DoctorProfile.find({ user: { $in: ids } }).lean();
  const profileMap = new Map(profiles.map((p) => [String(p.user), p]));

  const requests = doctors.map((doc) => ({
    ...(profileMap.get(String(doc._id))
      ? {
          profile: {
            ...profileMap.get(String(doc._id)),
            documents: normalizeDoctorDocuments(
              profileMap.get(String(doc._id)),
            ),
          },
        }
      : { profile: null }),
    ...doc,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, "Doctor requests fetched", requests));
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

const getLabs = catchAsync(async (_req, res) => {
  const labs = await LabTest.find({}).sort({ createdAt: -1 }).lean();
  return res.status(200).json(new ApiResponse(200, "Lab tests fetched", labs));
});

const updateLab = catchAsync(async (req, res) => {
  const lab = await LabTest.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).lean();
  if (!lab) throw new ApiError(404, "Lab test not found");
  return res.status(200).json(new ApiResponse(200, "Lab test updated", lab));
});

const deleteLab = catchAsync(async (req, res) => {
  const lab = await LabTest.findById(req.params.id);
  if (!lab) throw new ApiError(404, "Lab test not found");
  await lab.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, "Lab test deleted", { id: req.params.id }));
});

const createMedicine = catchAsync(async (req, res) => {
  const med = await Medicine.create(req.body);
  return res.status(201).json(new ApiResponse(201, "Medicine created", med));
});

const getMedicines = catchAsync(async (_req, res) => {
  const meds = await Medicine.find({}).sort({ createdAt: -1 }).lean();
  return res.status(200).json(new ApiResponse(200, "Medicines fetched", meds));
});

const updateMedicine = catchAsync(async (req, res) => {
  const med = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).lean();
  if (!med) throw new ApiError(404, "Medicine not found");
  return res.status(200).json(new ApiResponse(200, "Medicine updated", med));
});

const deleteMedicine = catchAsync(async (req, res) => {
  const med = await Medicine.findById(req.params.id);
  if (!med) throw new ApiError(404, "Medicine not found");
  await med.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, "Medicine deleted", { id: req.params.id }));
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

const getOrders = catchAsync(async (_req, res) => {
  const orders = await Order.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, "Orders fetched", orders));
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  order.status = req.body.status;
  await order.save();
  return res.status(200).json(new ApiResponse(200, "Order updated", order));
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

const getNotifications = catchAsync(async (_req, res) => {
  const notifications = await Notification.find({})
    .sort({ createdAt: -1 })
    .lean();
  return res
    .status(200)
    .json(new ApiResponse(200, "Notifications fetched", notifications));
});

const getSettings = catchAsync(async (_req, res) => {
  const settings = await PlatformSetting.find({}).lean();
  return res
    .status(200)
    .json(new ApiResponse(200, "Settings fetched", settings));
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

const getSlots = catchAsync(async (req, res) => {
  const query = {};
  if (req.query.doctorId) query.doctor = req.query.doctorId;
  if (req.query.date) {
    const date = dayjs(req.query.date);
    query.date = {
      $gte: date.startOf("day").toDate(),
      $lte: date.endOf("day").toDate(),
    };
  }

  const slots = await Slot.find(query)
    .populate("doctor", "name image")
    .sort({ date: -1, startTime: 1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, "Slots fetched", slots));
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

  return res.status(200).json(
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
  getDoctorRequests,
  approveDoctor,
  getAppointments,
  getLabs,
  createLab,
  updateLab,
  deleteLab,
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getPayments,
  getOrders,
  updateOrderStatus,
  getNotifications,
  createNotification,
  getSettings,
  updateSettings,
  getReviews,
  deleteReview,
  getSlots,
  getRevenueBreakdown,
  getSubscriptions,
};
