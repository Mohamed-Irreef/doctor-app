const LabTest = require("../models/LabTest");
const Medicine = require("../models/Medicine");
const LabBooking = require("../models/LabBooking");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const LabPartnerProfile = require("../models/LabPartnerProfile");
const PharmacyPartnerProfile = require("../models/PharmacyPartnerProfile");
const LabMasterData = require("../models/LabMasterData");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const {
  sendLabReportUploadedEmail,
  sendLabBookingStatusEmail,
  sendPharmacyOrderStatusEmail,
} = require("../services/emailService");
const {
  transitionLabBooking,
  normalizeLabBookingStatus,
} = require("../services/labBookingStateMachine");
const {
  transitionPharmacyOrder,
} = require("../services/pharmacyOrderStateMachine");
const { logAuditEvent } = require("../services/auditLogService");
const { logError } = require("../utils/logger");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary");
const { emitToUser } = require("../realtime/socket");
const {
  MEDICINE_DB_CATEGORIES,
  normalizeMedicineCategory,
} = require("../constants/medicineCategories");

const MASTER_GROUPS = [
  "categories",
  "subcategories",
  "sampleTypes",
  "tags",
  "collectionOptions",
];

const DEFAULT_MASTER_DATA = {
  categories: ["Blood Tests", "Hormones", "Diabetes", "Wellness"],
  subcategories: ["General", "Advanced", "Screening"],
  sampleTypes: ["Blood", "Urine", "Saliva", "Other"],
  tags: ["Popular", "Fasting", "Home Collection"],
  collectionOptions: ["home", "lab", "both"],
};

function ensureRole(user, role) {
  if (user.role !== role) {
    throw new ApiError(403, "Forbidden");
  }
}

function normalizeBookingType(type, fallback = "home_collection") {
  const value = String(type || "")
    .trim()
    .toLowerCase();
  if (["home_collection", "home"].includes(value)) return "home_collection";
  if (["lab_visit", "lab"].includes(value)) return "lab_visit";
  return fallback;
}

function normalizeBookingForPortal(booking) {
  const bookingType = normalizeBookingType(
    booking.bookingType || booking.collectionType,
  );
  const tests =
    Array.isArray(booking.tests) && booking.tests.length
      ? booking.tests
      : booking.labTest
        ? [booking.labTest]
        : [];

  const address = booking.address || booking.homeCollectionAddress || {};
  const dateValue =
    booking.scheduledDate || booking.bookingDate || booking.createdAt;

  return {
    ...booking,
    bookingType,
    tests,
    timeSlot: booking.timeSlot || booking.collectionTimeSlot || "",
    address: {
      flat: address.flat || address.flatHouse || "",
      street: address.street || address.area || "",
      landmark: address.landmark || "",
      city: address.city || "",
      pincode: address.pincode || "",
    },
    contactNumber:
      booking.contactNumber ||
      booking.patient?.phone ||
      booking.homeCollectionAddress?.contactNumber ||
      "",
    date: dateValue,
  };
}

function buildLabBookingsQuery(rawQuery = {}) {
  const query = {};

  if (rawQuery.status) {
    query.status = normalizeLabBookingStatus(rawQuery.status, "pending");
  }

  if (rawQuery.type) {
    const normalizedType = normalizeBookingType(rawQuery.type, "");
    if (normalizedType) {
      query.$or = [
        { bookingType: normalizedType },
        {
          collectionType: normalizedType === "home_collection" ? "home" : "lab",
        },
      ];
    }
  }

  if (rawQuery.date) {
    const start = new Date(rawQuery.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(rawQuery.date);
    end.setHours(23, 59, 59, 999);
    query.scheduledDate = { $gte: start, $lte: end };
  } else if (rawQuery.dateFrom || rawQuery.dateTo) {
    query.bookingDate = {};
    if (rawQuery.dateFrom) query.bookingDate.$gte = new Date(rawQuery.dateFrom);
    if (rawQuery.dateTo) query.bookingDate.$lte = new Date(rawQuery.dateTo);
  }

  return query;
}

function createSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toMasterItems(values = []) {
  return values.map((label) => ({ label, active: true }));
}

async function ensureMasterData(userId) {
  const existing = await LabMasterData.findOne({ user: userId });
  if (existing) return existing;

  const created = await LabMasterData.create({
    user: userId,
    categories: toMasterItems(DEFAULT_MASTER_DATA.categories),
    subcategories: toMasterItems(DEFAULT_MASTER_DATA.subcategories),
    sampleTypes: toMasterItems(DEFAULT_MASTER_DATA.sampleTypes),
    tags: toMasterItems(DEFAULT_MASTER_DATA.tags),
    collectionOptions: toMasterItems(DEFAULT_MASTER_DATA.collectionOptions),
  });

  return created;
}

function normalizeStringArray(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
}

async function resolveMedicineMedia(req) {
  const uploaded = {};
  const imageFile = req.files?.medicineImageFile?.[0];
  const pdfFile = req.files?.medicinePdfFile?.[0];

  if (imageFile?.buffer) {
    const result = await uploadBufferToCloudinary(
      imageFile.buffer,
      "nividoc/pharmacy/medicines/images",
    );
    uploaded.image = result?.secure_url;
  }

  if (pdfFile?.buffer) {
    const result = await uploadBufferToCloudinary(
      pdfFile.buffer,
      "nividoc/pharmacy/medicines/docs",
    );
    uploaded.pdfUrl = result?.secure_url;
  }

  return uploaded;
}

async function resolveLabTestMedia(req) {
  const uploaded = {};
  const imageFile = req.files?.testImageFile?.[0];
  const sampleFile = req.files?.reportSampleFile?.[0];

  if (imageFile?.buffer) {
    const result = await uploadBufferToCloudinary(
      imageFile.buffer,
      "nividoc/labs/tests/images",
    );
    uploaded.testImage = result?.secure_url;
    uploaded.imageUrl = result?.secure_url;
  }

  if (sampleFile?.buffer) {
    const result = await uploadBufferToCloudinary(
      sampleFile.buffer,
      "nividoc/labs/tests/samples",
    );
    uploaded.reportSampleUrl = result?.secure_url;
  }

  return uploaded;
}

const getLabDashboard = catchAsync(async (req, res) => {
  ensureRole(req.user, "lab_admin");
  const [testsCount, ownedTests, profile] = await Promise.all([
    LabTest.countDocuments({
      owner: req.user._id,
      approvalStatus: "approved",
      active: true,
    }),
    LabTest.find({ owner: req.user._id }).select("_id").lean(),
    LabPartnerProfile.findOne({ user: req.user._id })
      .select("labName address supportPhone approvalStatus")
      .lean(),
  ]);

  const ownedTestIds = ownedTests.map((item) => item._id);
  const [
    bookingsCount,
    reportReadyCount,
    pendingTests,
    rejectedTests,
    bookings,
  ] = await Promise.all([
    LabBooking.countDocuments({ labTest: { $in: ownedTestIds } }),
    LabBooking.countDocuments({
      labTest: { $in: ownedTestIds },
      status: "report-ready",
    }),
    LabTest.countDocuments({ owner: req.user._id, approvalStatus: "pending" }),
    LabTest.countDocuments({ owner: req.user._id, approvalStatus: "rejected" }),
    LabBooking.find({ labTest: { $in: ownedTestIds } })
      .select("_id")
      .lean(),
  ]);

  const bookingIds = bookings.map((item) => item._id);
  const revenuePaid = await Payment.aggregate([
    {
      $match: {
        type: "lab",
        status: "paid",
        relatedModel: "LabBooking",
        relatedId: { $in: bookingIds },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const monthlyRevenue = await Payment.aggregate([
    {
      $match: {
        type: "lab",
        status: "paid",
        relatedModel: "LabBooking",
        relatedId: { $in: bookingIds },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const bookingTrend = await LabBooking.aggregate([
    { $match: { labTest: { $in: ownedTestIds } } },
    {
      $group: {
        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
        total: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Lab dashboard fetched", {
      testsCount,
      pendingTests,
      rejectedTests,
      bookingsCount,
      reportReadyCount,
      reportsPendingCount: reportReadyCount,
      revenue: revenuePaid[0]?.total || 0,
      adminShare: Number(((revenuePaid[0]?.total || 0) * 0.2).toFixed(2)),
      labShare: Number(((revenuePaid[0]?.total || 0) * 0.8).toFixed(2)),
      monthlyRevenue,
      bookingTrend,
      labApprovalStatus: req.user.labApprovalStatus || profile?.approvalStatus,
      labName: profile?.labName || req.user.name,
      address: profile?.address || "",
      supportPhone: profile?.supportPhone || req.user.phone || "",
    }),
  );
});

const createLabTest = catchAsync(async (req, res) => {
  ensureRole(req.user, "lab_admin");

  const profile = await LabPartnerProfile.findOne({
    user: req.user._id,
  }).lean();
  if (!profile) throw new ApiError(400, "Lab partner profile not found");

  const originalPrice = Number(req.body.originalPrice || 0);
  const discountPrice = Number(req.body.discountPrice || req.body.price || 0);
  const discountPercentage =
    originalPrice > 0
      ? Number(
          Math.max(
            0,
            ((originalPrice - discountPrice) / originalPrice) * 100,
          ).toFixed(2),
        )
      : 0;

  const uploadedMedia = await resolveLabTestMedia(req);

  const tags = normalizeStringArray(req.body.tags);
  const keywords = normalizeStringArray(req.body.keywords);
  const includes = normalizeStringArray(req.body.includes);
  const prepSteps = normalizeStringArray(req.body.prepSteps);
  const collectionTimeSlots = normalizeStringArray(
    req.body.collectionTimeSlots,
  );
  const collectionOption =
    req.body.collectionOption ||
    (req.body.bothAvailable
      ? "both"
      : req.body.labVisitRequired
        ? "lab"
        : req.body.homeCollectionAvailable
          ? "home"
          : "both");

  const status = req.body.status === "draft" ? "draft" : "submitted";
  const approvalStatus = status === "draft" ? "pending" : "pending";

  const test = await LabTest.create({
    ...req.body,
    ...uploadedMedia,
    name: req.body.testName || req.body.name,
    testCode: req.body.testCode,
    slug: req.body.slug || createSlug(req.body.testName || req.body.name),
    shortDescription: req.body.shortDescription || req.body.description,
    fullDescription: req.body.fullDescription || req.body.description,
    description:
      req.body.description ||
      req.body.shortDescription ||
      req.body.fullDescription,
    originalPrice,
    price: discountPrice,
    discountPercentage,
    discount: discountPercentage,
    currency: req.body.currency || "INR",
    parameters: req.body.parameters || [],
    sampleType: req.body.sampleType || "Blood",
    fastingRequired: Boolean(req.body.fastingRequired),
    fastingHours: Number(req.body.fastingHours || 0),
    homeCollectionAvailable: req.body.homeCollectionAvailable !== false,
    reportTime: req.body.reportTime || req.body.turnaround || "24 hours",
    processingTime: req.body.processingTime,
    collectionTimeSlots:
      collectionTimeSlots || req.body.collectionTimeSlots || [],
    tags: tags || req.body.tags || [],
    keywords: keywords || req.body.keywords || [],
    includes: includes || req.body.includes || [],
    prepSteps: prepSteps || req.body.prepSteps || [],
    testImage:
      uploadedMedia.testImage || req.body.testImage || req.body.imageUrl,
    imageUrl: uploadedMedia.imageUrl || req.body.imageUrl || req.body.testImage,
    reportSampleUrl: uploadedMedia.reportSampleUrl || req.body.reportSampleUrl,
    testVideoUrl: req.body.testVideoUrl,
    subcategory: req.body.subcategory,
    preparationInstructions: req.body.preparationInstructions,
    sampleVolume: req.body.sampleVolume,
    containerType: req.body.containerType,
    collectionOption,
    method: req.body.method,
    department: req.body.department,
    normalRange: req.body.normalRange,
    metaTitle: req.body.metaTitle,
    metaDescription: req.body.metaDescription,
    popular: Boolean(req.body.popular ?? req.body.popularTest),
    recommendedTest: Boolean(req.body.recommendedTest),
    labId: profile._id,
    labName: profile.labName,
    owner: req.user._id,
    approvalStatus,
    isApproved: false,
    active: false,
    status,
  });

  emitToUser(req.user._id, "lab:test-submitted", {
    id: String(test._id),
    name: test.name,
    approvalStatus: test.approvalStatus,
    status: test.status,
    createdAt: test.createdAt,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Lab test submitted for approval", test));
});

const getLabTests = catchAsync(async (req, res) => {
  ensureRole(req.user, "lab_admin");
  const tests = await LabTest.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, "Lab tests fetched", tests));
});

const updateLabTest = catchAsync(async (req, res) => {
  ensureRole(req.user, "lab_admin");
  const test = await LabTest.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!test) throw new ApiError(404, "Lab test not found");

  const uploadedMedia = await resolveLabTestMedia(req);

  const tags = normalizeStringArray(req.body.tags);
  const keywords = normalizeStringArray(req.body.keywords);
  const includes = normalizeStringArray(req.body.includes);
  const prepSteps = normalizeStringArray(req.body.prepSteps);
  const collectionTimeSlots = normalizeStringArray(
    req.body.collectionTimeSlots,
  );

  Object.assign(test, req.body);
  test.name = req.body.testName || req.body.name || test.name;
  test.slug = req.body.slug || createSlug(test.name);
  test.shortDescription =
    req.body.shortDescription || req.body.description || test.shortDescription;
  test.fullDescription =
    req.body.fullDescription || req.body.description || test.fullDescription;
  test.description =
    req.body.description || test.shortDescription || test.fullDescription;
  test.originalPrice = Number(req.body.originalPrice || test.originalPrice);
  test.price = Number(req.body.discountPrice || req.body.price || test.price);
  if (test.originalPrice > 0) {
    const pct = ((test.originalPrice - test.price) / test.originalPrice) * 100;
    test.discountPercentage = Number(Math.max(0, pct).toFixed(2));
    test.discount = test.discountPercentage;
  }
  test.currency = req.body.currency || test.currency || "INR";
  test.parameters = req.body.parameters || test.parameters || [];
  test.sampleType = req.body.sampleType || test.sampleType || "Blood";
  test.fastingRequired =
    req.body.fastingRequired !== undefined
      ? Boolean(req.body.fastingRequired)
      : test.fastingRequired;
  test.fastingHours = Number(req.body.fastingHours || test.fastingHours || 0);
  test.homeCollectionAvailable =
    req.body.homeCollectionAvailable !== undefined
      ? Boolean(req.body.homeCollectionAvailable)
      : test.homeCollectionAvailable;
  test.reportTime =
    req.body.reportTime || req.body.turnaround || test.reportTime;
  test.processingTime = req.body.processingTime || test.processingTime;
  test.collectionTimeSlots =
    collectionTimeSlots ||
    req.body.collectionTimeSlots ||
    test.collectionTimeSlots ||
    [];
  test.tags = tags || req.body.tags || test.tags || [];
  test.keywords = keywords || req.body.keywords || test.keywords || [];
  test.includes = includes || req.body.includes || test.includes || [];
  test.prepSteps = prepSteps || req.body.prepSteps || test.prepSteps || [];
  test.testImage =
    uploadedMedia.testImage ||
    req.body.testImage ||
    req.body.imageUrl ||
    test.testImage;
  test.imageUrl =
    uploadedMedia.imageUrl ||
    req.body.imageUrl ||
    req.body.testImage ||
    test.imageUrl;
  test.reportSampleUrl =
    uploadedMedia.reportSampleUrl ||
    req.body.reportSampleUrl ||
    test.reportSampleUrl;
  test.testVideoUrl = req.body.testVideoUrl || test.testVideoUrl;
  test.testCode = req.body.testCode || test.testCode;
  test.subcategory = req.body.subcategory || test.subcategory;
  test.preparationInstructions =
    req.body.preparationInstructions || test.preparationInstructions;
  test.sampleVolume = req.body.sampleVolume || test.sampleVolume;
  test.containerType = req.body.containerType || test.containerType;
  test.collectionOption =
    req.body.collectionOption ||
    (req.body.bothAvailable
      ? "both"
      : req.body.labVisitRequired
        ? "lab"
        : req.body.homeCollectionAvailable
          ? "home"
          : test.collectionOption);
  test.method = req.body.method || test.method;
  test.department = req.body.department || test.department;
  if (req.body.collectionInstructions !== undefined) {
    test.collectionInstructions = req.body.collectionInstructions;
  }
  if (req.body.beforeTestInstructions !== undefined) {
    test.beforeTestInstructions = req.body.beforeTestInstructions;
  }
  if (req.body.afterTestInstructions !== undefined) {
    test.afterTestInstructions = req.body.afterTestInstructions;
  }
  if (req.body.labVisitRequired !== undefined) {
    test.labVisitRequired = Boolean(req.body.labVisitRequired);
  }
  if (req.body.bothAvailable !== undefined) {
    test.bothAvailable = Boolean(req.body.bothAvailable);
  }
  if (req.body.technicianRequired !== undefined) {
    test.technicianRequired = Boolean(req.body.technicianRequired);
  }
  if (req.body.gstPercent !== undefined) {
    test.gstPercent = Number(req.body.gstPercent || 0);
  }
  if (req.body.finalPrice !== undefined) {
    test.finalPrice = Number(req.body.finalPrice || 0);
  }
  if (req.body.popular !== undefined || req.body.popularTest !== undefined) {
    test.popular = Boolean(req.body.popular ?? req.body.popularTest);
  }
  if (req.body.recommendedTest !== undefined) {
    test.recommendedTest = Boolean(req.body.recommendedTest);
  }
  test.normalRange = req.body.normalRange || test.normalRange;
  test.metaTitle = req.body.metaTitle || test.metaTitle;
  test.metaDescription = req.body.metaDescription || test.metaDescription;
  test.status = req.body.status === "draft" ? "draft" : "submitted";
  test.approvalStatus = "pending";
  test.isApproved = false;
  test.active = false;
  test.approvalNote = undefined;
  test.approvedBy = undefined;
  test.approvedAt = undefined;
  await test.save();

  emitToUser(req.user._id, "lab:test-updated", {
    id: String(test._id),
    name: test.name,
    approvalStatus: test.approvalStatus,
    status: test.status,
    updatedAt: test.updatedAt,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Lab test re-submitted for approval", test));
});

const getLabBookings = catchAsync(async (req, res) => {
  ensureRole(req.user, "lab_admin");

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(20, Math.max(1, Number(req.query.limit || 10)));
  const skip = (page - 1) * limit;
  const query = buildLabBookingsQuery(req.query);

  const ownedTests = await LabTest.find({ owner: req.user._id })
    .select("_id")
    .lean();
  const ownedTestIds = ownedTests.map((item) => item._id);
  query.labTest = { $in: ownedTestIds };

  const [bookings, total] = await Promise.all([
    LabBooking.find(query)
      .populate("patient", "name email phone")
      .populate(
        "labTest",
        "name owner category reportTime price shortDescription fullDescription",
      )
      .populate(
        "tests",
        "name owner category reportTime price shortDescription fullDescription",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LabBooking.countDocuments(query),
  ]);

  const owned = bookings.map(normalizeBookingForPortal);

  return res.status(200).json(
    new ApiResponse(200, "Lab bookings fetched", {
      items: owned,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    }),
  );
});

async function processLabBookingStatusUpdate(req, nextStatusInput) {
  ensureRole(req.user, "lab_admin");
  const booking = await LabBooking.findById(req.params.id).populate(
    "labTest",
    "owner name",
  );
  if (!booking) throw new ApiError(404, "Booking not found");
  if (String(booking.labTest?.owner || "") !== String(req.user._id)) {
    throw new ApiError(403, "Not allowed to update this booking");
  }

  const previousStatus = booking.status;
  const targetStatus = normalizeLabBookingStatus(
    nextStatusInput,
    booking.status,
  );

  const { next: nextStatus } = transitionLabBooking({
    booking,
    nextStatus: targetStatus,
    reportUrl: req.body.reportUrl,
    note: req.body.note,
    actorLabel: "lab admin",
  });

  if (!booking.bookingType) {
    booking.bookingType = normalizeBookingType(booking.collectionType);
  }

  await booking.save();

  emitToUser(req.user._id, "lab:booking-updated", {
    bookingId: String(booking._id),
    status: nextStatus,
    previousStatus,
    reportUrl: req.body.reportUrl || "",
    at: new Date().toISOString(),
  });

  await logAuditEvent({
    entityType: "lab_booking",
    entityId: booking._id,
    action: "lab_booking_status_changed",
    performedBy: req.user?._id,
    performedByRole: req.user?.role,
    metadata: {
      previousStatus,
      nextStatus,
      hasReportUrl: Boolean(req.body.reportUrl),
      note: req.body.note || null,
    },
  });

  if (req.body.reportUrl) {
    await logAuditEvent({
      entityType: "lab_booking",
      entityId: booking._id,
      action: "lab_report_uploaded",
      performedBy: req.user?._id,
      performedByRole: req.user?.role,
      metadata: {
        reportUrl: req.body.reportUrl,
      },
    });
  }

  await Notification.create({
    title:
      nextStatus === "sample-collected"
        ? "Sample collected"
        : nextStatus === "report-ready"
          ? "Report ready"
          : "Lab booking updated",
    message:
      nextStatus === "sample-collected"
        ? "Your sample has been collected by lab partner"
        : nextStatus === "report-ready"
          ? "Your lab report is ready for download"
          : `Lab booking status updated to ${nextStatus}`,
    type: `lab-${nextStatus}`,
    audienceType: "single",
    recipient: booking.patient,
    targetEntityType: "LabBooking",
    targetEntityId: booking._id,
  });

  if (req.body.reportUrl) {
    try {
      const hydrated = await LabBooking.findById(booking._id)
        .populate("patient", "name email")
        .populate("labTest", "name");
      if (hydrated?.patient?.email) {
        await sendLabReportUploadedEmail({
          to: hydrated.patient.email,
          patientName: hydrated.patient.name,
          testName: hydrated.labTest?.name || "Lab Test",
          reportUrl: req.body.reportUrl,
        });
      }
    } catch (error) {
      logError("lab_report_upload_email_failed", error, {
        bookingId: booking._id,
      });
    }
  }

  try {
    const hydrated = await LabBooking.findById(booking._id)
      .populate("patient", "name email")
      .populate("labTest", "name");
    if (hydrated?.patient?.email) {
      await sendLabBookingStatusEmail({
        to: hydrated.patient.email,
        patientName: hydrated.patient.name || "Patient",
        testName: hydrated.labTest?.name || "Lab Test",
        status: nextStatus,
        dateTime: new Date().toLocaleString(),
        labName: req.user?.name || "NiviDoc Lab",
      });
    }
  } catch (error) {
    logError("lab_booking_status_email_failed", error, {
      bookingId: booking._id,
      status: nextStatus,
    });
  }

  return { booking, nextStatus };
}

const updateLabBookingStatus = catchAsync(async (req, res) => {
  const { booking } = await processLabBookingStatusUpdate(req, req.body.status);

  return res
    .status(200)
    .json(new ApiResponse(200, "Lab booking updated", booking));
});

const approveLabBooking = catchAsync(async (req, res) => {
  const { booking } = await processLabBookingStatusUpdate(req, "approved");
  return res
    .status(200)
    .json(new ApiResponse(200, "Lab booking approved", booking));
});

const rejectLabBooking = catchAsync(async (req, res) => {
  const { booking } = await processLabBookingStatusUpdate(req, "rejected");
  return res
    .status(200)
    .json(new ApiResponse(200, "Lab booking rejected", booking));
});

const deleteLabTest = catchAsync(async (req, res) => {
  ensureRole(req.user, "lab_admin");
  const test = await LabTest.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!test) throw new ApiError(404, "Lab test not found");

  await test.deleteOne();

  emitToUser(req.user._id, "lab:test-deleted", {
    id: req.params.id,
    at: new Date().toISOString(),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Lab test deleted", { id: req.params.id }));
});

const getLabMasterData = catchAsync(async (req, res) => {
  ensureRole(req.user, "lab_admin");
  const doc = await ensureMasterData(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, "Lab master data fetched", {
      categories: doc.categories || [],
      subcategories: doc.subcategories || [],
      sampleTypes: doc.sampleTypes || [],
      tags: doc.tags || [],
      collectionOptions: doc.collectionOptions || [],
    }),
  );
});

const addLabMasterDataItem = catchAsync(async (req, res) => {
  ensureRole(req.user, "lab_admin");
  const group = String(req.params.group || "");
  if (!MASTER_GROUPS.includes(group)) {
    throw new ApiError(400, "Invalid master data group");
  }

  const label = String(req.body?.label || "").trim();
  if (!label) throw new ApiError(400, "Label is required");

  const doc = await ensureMasterData(req.user._id);
  const exists = (doc[group] || []).some(
    (item) => String(item.label).toLowerCase() === label.toLowerCase(),
  );
  if (exists) throw new ApiError(409, "Item already exists");

  doc[group].push({ label, active: true });
  await doc.save();

  return res
    .status(201)
    .json(new ApiResponse(201, "Master item added", doc[group]));
});

const getLabSettings = catchAsync(async (req, res) => {
  ensureRole(req.user, "lab_admin");
  const profile = await LabPartnerProfile.findOne({
    user: req.user._id,
  }).lean();
  if (!profile) throw new ApiError(404, "Lab partner profile not found");

  return res.status(200).json(
    new ApiResponse(200, "Lab settings fetched", {
      labName: profile.labName,
      address: profile.address,
      supportPhone: profile.supportPhone,
      logo: profile.profilePhoto || "",
      deliveryPricing: profile.deliveryPricing || {
        costPerKm: 0,
        minCharge: 0,
        maxServiceRadiusKm: 0,
      },
    }),
  );
});

const updateLabSettings = catchAsync(async (req, res) => {
  ensureRole(req.user, "lab_admin");
  const profile = await LabPartnerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, "Lab partner profile not found");

  if (req.body.labName !== undefined) profile.labName = req.body.labName;
  if (req.body.address !== undefined) profile.address = req.body.address;
  if (req.body.supportPhone !== undefined) {
    profile.supportPhone = req.body.supportPhone;
  }
  if (req.body.logo !== undefined) {
    profile.profilePhoto = req.body.logo;
  }
  if (req.body.deliveryPricing) {
    const pricing = req.body.deliveryPricing;
    profile.deliveryPricing = {
      costPerKm: Number(pricing.costPerKm || 0),
      minCharge: Number(pricing.minCharge || 0),
      maxServiceRadiusKm: Number(pricing.maxServiceRadiusKm || 0),
    };
  }

  await profile.save();
  return res
    .status(200)
    .json(new ApiResponse(200, "Lab settings updated", profile));
});

const updateLabMasterDataItem = catchAsync(async (req, res) => {
  ensureRole(req.user, "lab_admin");
  const group = String(req.params.group || "");
  if (!MASTER_GROUPS.includes(group)) {
    throw new ApiError(400, "Invalid master data group");
  }

  const doc = await ensureMasterData(req.user._id);
  const item = (doc[group] || []).id(req.params.itemId);
  if (!item) throw new ApiError(404, "Master item not found");

  if (req.body?.label !== undefined) {
    const label = String(req.body.label || "").trim();
    if (!label) throw new ApiError(400, "Label cannot be empty");
    item.label = label;
  }

  if (req.body?.active !== undefined) {
    item.active = Boolean(req.body.active);
  }

  await doc.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Master item updated", doc[group]));
});

const deleteLabMasterDataItem = catchAsync(async (req, res) => {
  ensureRole(req.user, "lab_admin");
  const group = String(req.params.group || "");
  if (!MASTER_GROUPS.includes(group)) {
    throw new ApiError(400, "Invalid master data group");
  }

  const doc = await ensureMasterData(req.user._id);
  const item = (doc[group] || []).id(req.params.itemId);
  if (!item) throw new ApiError(404, "Master item not found");

  item.deleteOne();
  await doc.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Master item deleted", doc[group]));
});

const getPharmacyDashboard = catchAsync(async (req, res) => {
  ensureRole(req.user, "pharmacy_admin");
  const [medicinesCount, inventoryCount, medicines] = await Promise.all([
    Medicine.countDocuments({
      owner: req.user._id,
      approvalStatus: "approved",
      active: true,
    }),
    Medicine.aggregate([
      { $match: { owner: req.user._id } },
      { $group: { _id: null, stock: { $sum: "$stock" } } },
    ]),
    Medicine.find({ owner: req.user._id }).select("_id").lean(),
  ]);

  const medicineIds = medicines.map((item) => item._id);
  const orders = await Order.find({ "items.medicine": { $in: medicineIds } })
    .select("_id")
    .lean();
  const orderIds = orders.map((item) => item._id);

  const [
    ordersCount,
    placedCount,
    inTransitCount,
    deliveredCount,
    revenuePaid,
  ] = await Promise.all([
    Order.countDocuments({ _id: { $in: orderIds } }),
    Order.countDocuments({
      _id: { $in: orderIds },
      status: { $in: ["placed", "confirmed", "packed"] },
    }),
    Order.countDocuments({ _id: { $in: orderIds }, status: "shipped" }),
    Order.countDocuments({ _id: { $in: orderIds }, status: "delivered" }),
    Payment.aggregate([
      {
        $match: {
          type: "pharmacy",
          status: "paid",
          relatedModel: "Order",
          relatedId: { $in: orderIds },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Pharmacy dashboard fetched", {
      medicinesCount,
      ordersCount,
      placedCount,
      inTransitCount,
      deliveredCount,
      inventoryCount: inventoryCount[0]?.stock || 0,
      revenue: revenuePaid[0]?.total || 0,
      adminShare: Number(((revenuePaid[0]?.total || 0) * 0.2).toFixed(2)),
      pharmacyShare: Number(((revenuePaid[0]?.total || 0) * 0.8).toFixed(2)),
    }),
  );
});

const getPharmacySettings = catchAsync(async (req, res) => {
  ensureRole(req.user, "pharmacy_admin");
  const profile = await PharmacyPartnerProfile.findOne({
    user: req.user._id,
  }).lean();
  if (!profile) throw new ApiError(404, "Pharmacy partner profile not found");

  return res.status(200).json(
    new ApiResponse(200, "Pharmacy settings fetched", {
      pharmacyName: profile.pharmacyName || req.user.name,
      registrationId: profile.licenseNumber || "",
      supportEmail:
        profile.supportEmail || profile.email || req.user.email || "",
      supportPhone:
        profile.supportPhone || profile.phone || req.user.phone || "",
      address: profile.address || "",
      city: profile.city || "",
      state: profile.state || "",
      pincode: profile.pincode || "",
      operationalHours: profile.operationalHours || "",
      logo: profile.companyLogo || profile.profilePhoto || "",
    }),
  );
});

const updatePharmacySettings = catchAsync(async (req, res) => {
  ensureRole(req.user, "pharmacy_admin");
  const profile = await PharmacyPartnerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, "Pharmacy partner profile not found");

  if (req.body.pharmacyName !== undefined) {
    profile.pharmacyName = req.body.pharmacyName;
  }
  if (req.body.supportEmail !== undefined) {
    profile.supportEmail = req.body.supportEmail;
  }
  if (req.body.supportPhone !== undefined) {
    profile.supportPhone = req.body.supportPhone;
  }
  if (req.body.address !== undefined) {
    profile.address = req.body.address;
  }
  if (req.body.city !== undefined) {
    profile.city = req.body.city;
  }
  if (req.body.state !== undefined) {
    profile.state = req.body.state;
  }
  if (req.body.pincode !== undefined) {
    profile.pincode = req.body.pincode;
  }
  if (req.body.operationalHours !== undefined) {
    profile.operationalHours = req.body.operationalHours;
  }
  if (req.body.logo !== undefined) {
    profile.companyLogo = req.body.logo;
    // Keep legacy field in sync for older consumers/deployments.
    profile.profilePhoto = req.body.logo;
  }

  await profile.save();

  return res.status(200).json(
    new ApiResponse(200, "Pharmacy settings updated", {
      pharmacyName: profile.pharmacyName,
      registrationId: profile.licenseNumber,
      supportEmail: profile.supportEmail,
      supportPhone: profile.supportPhone,
      address: profile.address,
      city: profile.city || "",
      state: profile.state || "",
      pincode: profile.pincode || "",
      operationalHours: profile.operationalHours || "",
      logo: profile.companyLogo || profile.profilePhoto || "",
    }),
  );
});

const getPartnerMedicineCategories = catchAsync(async (req, res) => {
  ensureRole(req.user, "pharmacy_admin");
  return res.status(200).json(
    new ApiResponse(200, "Medicine categories fetched", {
      categories: MEDICINE_DB_CATEGORIES,
    }),
  );
});

const createMedicineByPartner = catchAsync(async (req, res) => {
  ensureRole(req.user, "pharmacy_admin");

  const price = Number(req.body.price);
  const mrp = Number(req.body.mrp || price);
  const stock = Number(req.body.stock || 0);
  const category = normalizeMedicineCategory(req.body.category);
  if (!category) {
    throw new ApiError(400, "Invalid medicine category");
  }
  const uploadedMedia = await resolveMedicineMedia(req);

  const med = await Medicine.create({
    ...req.body,
    ...uploadedMedia,
    category,
    price,
    mrp,
    stock,
    gstPercent: Number(req.body.gstPercent || 0),
    finalPrice: Number(req.body.finalPrice || 0),
    lowStockThreshold: Number(req.body.lowStockThreshold || 10),
    discountPercent: Number(req.body.discountPercent || 0),
    minOrderQuantity: Number(req.body.minOrderQuantity || 1),
    maxOrderQuantity: Number(req.body.maxOrderQuantity || 20),
    deliveryEtaHours: Number(req.body.deliveryEtaHours || 24),
    expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
    manufactureDate: req.body.manufactureDate
      ? new Date(req.body.manufactureDate)
      : undefined,
    owner: req.user._id,
    approvalStatus: "pending",
    isApproved: false,
    active: false,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, "Medicine submitted for approval", med));
});

const getPartnerMedicines = catchAsync(async (req, res) => {
  ensureRole(req.user, "pharmacy_admin");
  const meds = await Medicine.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, "Medicines fetched", meds));
});

const updatePartnerMedicine = catchAsync(async (req, res) => {
  ensureRole(req.user, "pharmacy_admin");
  const med = await Medicine.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!med) throw new ApiError(404, "Medicine not found");

  const uploadedMedia = await resolveMedicineMedia(req);
  Object.assign(med, req.body, uploadedMedia);

  if (req.body.category !== undefined) {
    const category = normalizeMedicineCategory(req.body.category);
    if (!category) {
      throw new ApiError(400, "Invalid medicine category");
    }
    med.category = category;
  }

  if (req.body.price !== undefined) med.price = Number(req.body.price);
  if (req.body.mrp !== undefined) med.mrp = Number(req.body.mrp);
  if (req.body.stock !== undefined) med.stock = Number(req.body.stock);
  if (req.body.discountPercent !== undefined) {
    med.discountPercent = Number(req.body.discountPercent);
  }
  if (req.body.lowStockThreshold !== undefined) {
    med.lowStockThreshold = Number(req.body.lowStockThreshold);
  }
  if (req.body.minOrderQuantity !== undefined) {
    med.minOrderQuantity = Number(req.body.minOrderQuantity);
  }
  if (req.body.maxOrderQuantity !== undefined) {
    med.maxOrderQuantity = Number(req.body.maxOrderQuantity);
  }
  if (req.body.deliveryEtaHours !== undefined) {
    med.deliveryEtaHours = Number(req.body.deliveryEtaHours);
  }
  if (req.body.gstPercent !== undefined) {
    med.gstPercent = Number(req.body.gstPercent);
  }
  if (req.body.finalPrice !== undefined) {
    med.finalPrice = Number(req.body.finalPrice);
  }
  if (req.body.expiryDate !== undefined) {
    med.expiryDate = req.body.expiryDate
      ? new Date(req.body.expiryDate)
      : undefined;
  }
  if (req.body.manufactureDate !== undefined) {
    med.manufactureDate = req.body.manufactureDate
      ? new Date(req.body.manufactureDate)
      : undefined;
  }

  med.approvalStatus = "pending";
  med.isApproved = false;
  med.active = false;
  med.approvalNote = undefined;
  med.approvedBy = undefined;
  med.approvedAt = undefined;
  await med.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Medicine re-submitted for approval", med));
});

const deletePartnerMedicine = catchAsync(async (req, res) => {
  ensureRole(req.user, "pharmacy_admin");

  const med = await Medicine.findOneAndDelete({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!med) throw new ApiError(404, "Medicine not found");

  return res.status(200).json(
    new ApiResponse(200, "Medicine deleted", {
      id: req.params.id,
    }),
  );
});

const getPartnerOrders = catchAsync(async (req, res) => {
  ensureRole(req.user, "pharmacy_admin");

  const status = req.query.status
    ? String(req.query.status).toLowerCase()
    : null;

  const orders = await Order.find({})
    .populate("items.medicine", "owner")
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .lean();

  const scoped = orders
    .filter((order) =>
      order.items.some(
        (item) => String(item.medicine?.owner || "") === String(req.user._id),
      ),
    )
    .filter((order) =>
      status ? String(order.status).toLowerCase() === status : true,
    );

  return res.status(200).json(new ApiResponse(200, "Orders fetched", scoped));
});

const updatePartnerOrderStatus = catchAsync(async (req, res) => {
  ensureRole(req.user, "pharmacy_admin");
  const order = await Order.findById(req.params.id).populate(
    "items.medicine",
    "owner",
  );
  if (!order) throw new ApiError(404, "Order not found");

  const ownsAnyItem = order.items.some(
    (item) => String(item.medicine?.owner || "") === String(req.user._id),
  );
  if (!ownsAnyItem) throw new ApiError(403, "Not allowed to update this order");
  const previousStatus = order.status;

  const { next: nextStatus } = transitionPharmacyOrder({
    order,
    nextStatus: req.body.status,
    note: req.body.note,
    actorLabel: "pharmacy admin",
  });

  if (req.body.trackingId) {
    order.trackingId = req.body.trackingId;
  }

  if (nextStatus === "shipped") {
    order.shippedAt = new Date();
  }

  if (nextStatus === "delivered") {
    order.deliveredAt = new Date();
  }

  if (nextStatus === "cancelled") {
    order.cancelledAt = new Date();
  }

  await order.save();

  await logAuditEvent({
    entityType: "order",
    entityId: order._id,
    action: "partner_order_status_changed",
    performedBy: req.user?._id,
    performedByRole: req.user?.role,
    metadata: {
      previousStatus,
      nextStatus,
      trackingId: req.body.trackingId || order.trackingId || null,
      note: req.body.note || null,
    },
  });

  await Notification.create({
    title:
      nextStatus === "packed"
        ? "Order packed"
        : nextStatus === "shipped"
          ? "Order shipped"
          : nextStatus === "delivered"
            ? "Order delivered"
            : nextStatus === "cancelled"
              ? "Order cancelled"
              : "Order updated",
    message: `Your medicine order is now ${nextStatus}.`,
    type: `pharmacy-${nextStatus}`,
    audienceType: "single",
    recipient: order.user,
    targetEntityType: "Order",
    targetEntityId: order._id,
  });

  if (["shipped", "delivered"].includes(String(nextStatus).toLowerCase())) {
    try {
      const hydrated = await Order.findById(order._id).populate(
        "user",
        "name email",
      );
      if (hydrated?.user?.email) {
        await sendPharmacyOrderStatusEmail({
          to: hydrated.user.email,
          patientName: hydrated.user.name,
          orderId: hydrated._id,
          status: nextStatus,
        });
      }
    } catch (error) {
      logError("pharmacy_order_status_email_failed", error, {
        orderId: order._id,
        status: nextStatus,
      });
    }
  }

  return res.status(200).json(new ApiResponse(200, "Order updated", order));
});

module.exports = {
  getLabDashboard,
  createLabTest,
  getLabTests,
  updateLabTest,
  deleteLabTest,
  getLabBookings,
  updateLabBookingStatus,
  approveLabBooking,
  rejectLabBooking,
  getLabMasterData,
  addLabMasterDataItem,
  updateLabMasterDataItem,
  deleteLabMasterDataItem,
  getLabSettings,
  updateLabSettings,
  getPharmacyDashboard,
  getPharmacySettings,
  updatePharmacySettings,
  getPartnerMedicineCategories,
  createMedicineByPartner,
  getPartnerMedicines,
  updatePartnerMedicine,
  deletePartnerMedicine,
  getPartnerOrders,
  updatePartnerOrderStatus,
};
