const dayjs = require("dayjs");
const mongoose = require("mongoose");
const LabTest = require("../models/LabTest");
const LabTestReview = require("../models/LabTestReview");
const LabBooking = require("../models/LabBooking");
const LabPartnerProfile = require("../models/LabPartnerProfile");
const LabSlotHold = require("../models/LabSlotHold");
const PatientProfile = require("../models/PatientProfile");
const Notification = require("../models/Notification");
const cloudinary = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { requirePatientProfileComplete } = require("../utils/profileCompletion");
const { sendLabBookingConfirmationEmail } = require("../services/emailService");
const {
  normalizeLabBookingStatus,
} = require("../services/labBookingStateMachine");
const { logError } = require("../utils/logger");

const SLOT_START_HOUR = 9;
const SLOT_END_HOUR = 23;
const SLOT_INTERVAL_MIN = 30;
const HOLD_WINDOW_MINUTES = 5;

// ── Cloudinary signed URL helpers (same logic as adminEcosystemController) ───
function parseCloudinaryAsset(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(
    /res\.cloudinary\.com\/([^/]+)\/(image|video|raw)\/([^/]+)\/(?:v\d+\/)?(.+)$/,
  );
  if (!match) return null;
  const [, , resourceType, deliveryType, rest] = match;
  const lastDot = rest.lastIndexOf(".");
  const publicId = lastDot > 0 ? rest.substring(0, lastDot) : rest;
  const format = lastDot > 0 ? rest.substring(lastDot + 1) : "";
  return { resourceType, deliveryType, publicId, format };
}

function buildSignedViewerUrl(url) {
  const parsed = parseCloudinaryAsset(url);
  if (!parsed?.publicId) return url;
  const resourceType = parsed.resourceType || "image";
  const deliveryType = parsed.deliveryType || "upload";
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60; // 1-hour expiry
  try {
    const privateUrl = cloudinary.utils.private_download_url(
      parsed.publicId,
      parsed.format,
      { resource_type: resourceType, type: deliveryType, expires_at: expiresAt, attachment: false },
    );
    if (privateUrl) return privateUrl;
  } catch {
    // fall through to signed URL
  }
  return cloudinary.url(parsed.publicId, {
    secure: true,
    sign_url: true,
    resource_type: resourceType,
    type: deliveryType,
    format: parsed.format,
  });
}
// ─────────────────────────────────────────────────────────────────────────────

function normalizeLabTest(test, profileMap) {
  const profile =
    profileMap.get(String(test.labId || "")) ||
    profileMap.get(String(test.owner || "")) ||
    null;

  return {
    ...test,
    fullDescription: test.fullDescription || test.description || "",
    shortDescription: test.shortDescription || test.description || "",
    discountPercentage:
      test.discountPercentage ||
      (test.originalPrice
        ? Number(
            Math.max(
              0,
              ((test.originalPrice - test.price) / test.originalPrice) * 100,
            ).toFixed(2),
          )
        : 0),
    reportTime: test.reportTime || test.turnaround || "",
    reportSampleUrl: test.reportSampleUrl
      ? buildSignedViewerUrl(test.reportSampleUrl)
      : "",
    lab: profile
      ? {
          id: profile._id,
          name: profile.labName,
          address: profile.address,
          city: profile.city,
          supportPhone: profile.supportPhone,
          supportEmail: profile.supportEmail,
          location: profile.location,
          deliveryPricing: profile.deliveryPricing || null,
        }
      : test.labName
        ? {
            id: null,
            name: test.labName,
          }
        : null,
  };
}

function formatSlotTime(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  if (hours === 0) hours = 12;
  if (hours > 12) hours -= 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
}

function generateTimeSlots() {
  const slots = [];
  const start = new Date();
  start.setHours(SLOT_START_HOUR, 0, 0, 0);
  const end = new Date();
  end.setHours(SLOT_END_HOUR, 0, 0, 0);

  const cursor = new Date(start);
  while (cursor <= end) {
    slots.push(formatSlotTime(cursor));
    cursor.setMinutes(cursor.getMinutes() + SLOT_INTERVAL_MIN);
  }
  return slots;
}

function toStartOfDay(value) {
  return dayjs(value).startOf("day").toDate();
}

function toEndOfDay(value) {
  return dayjs(value).endOf("day").toDate();
}

function haversineKm(origin, destination) {
  const toRad = (val) => (Number(val) * Math.PI) / 180;
  const lat1 = toRad(origin.latitude);
  const lon1 = toRad(origin.longitude);
  const lat2 = toRad(destination.latitude);
  const lon2 = toRad(destination.longitude);
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

async function clearExpiredHoldsForTest(testId) {
  await LabSlotHold.updateMany(
    {
      labTest: testId,
      status: "held",
      expiresAt: { $lte: new Date() },
    },
    { $set: { status: "expired" } },
  );
}

async function computeLabVisitQuote(test, patientId) {
  const profile = await LabPartnerProfile.findOne({
    $or: [{ _id: test.labId }, { user: test.owner }],
  }).lean();
  if (!profile?.location?.latitude || !profile?.location?.longitude) {
    throw new ApiError(400, "Lab location is not available");
  }

  const patientProfile = await PatientProfile.findOne({
    user: patientId,
  }).lean();
  if (
    !patientProfile?.location?.latitude ||
    !patientProfile?.location?.longitude
  ) {
    throw new ApiError(400, "Patient location is required for visit pricing");
  }

  const distanceKm = Number(
    haversineKm(patientProfile.location, profile.location).toFixed(2),
  );
  const pricing = profile.deliveryPricing || {};
  const costPerKm = Number(pricing.costPerKm || 0);
  const minCharge = Number(pricing.minCharge || 0);
  const maxServiceRadiusKm = Number(pricing.maxServiceRadiusKm || 0);

  if (maxServiceRadiusKm > 0 && distanceKm > maxServiceRadiusKm) {
    throw new ApiError(400, "Lab visit is outside the service radius");
  }

  const baseCost = distanceKm * costPerKm;
  const deliveryCost = Number(Math.max(baseCost, minCharge).toFixed(2));

  return {
    distanceKm,
    deliveryCost,
    costPerKm,
    minCharge,
    maxServiceRadiusKm,
    lab: profile,
  };
}

const getLabs = catchAsync(async (req, res) => {
  const query = req.sanitizedQuery || req.query;
  const filter = {
    active: true,
    approvalStatus: "approved",
    isApproved: true,
  };
  if (query.category) filter.category = query.category;
  if (query.q) {
    filter.$text = { $search: query.q };
  }

  const labs = await LabTest.find(filter)
    .sort({ popular: -1, createdAt: -1 })
    .lean();

  const profileIds = [
    ...new Set(
      labs
        .map((item) => String(item.labId || item.owner || ""))
        .filter(Boolean),
    ),
  ];
  const profiles = await LabPartnerProfile.find({
    $or: [{ _id: { $in: profileIds } }, { user: { $in: profileIds } }],
  })
    .select(
      "labName address city supportPhone supportEmail approvalStatus user",
    )
    .lean();
  const profileMap = new Map();
  profiles.forEach((profile) => {
    profileMap.set(String(profile._id), profile);
    profileMap.set(String(profile.user), profile);
  });

  const normalized = labs.map((item) => normalizeLabTest(item, profileMap));
  return res
    .status(200)
    .json(new ApiResponse(200, "Lab tests fetched", normalized));
});

const getLabById = catchAsync(async (req, res) => {
  const lab = await LabTest.findOne({
    _id: req.params.id,
    active: true,
    approvalStatus: "approved",
    isApproved: true,
  }).lean();
  if (!lab) throw new ApiError(404, "Lab test not found");

  const profile = await LabPartnerProfile.findOne({
    $or: [{ _id: lab.labId }, { user: lab.owner }],
  })
    .select(
      "labName address city supportPhone supportEmail approvalStatus user",
    )
    .lean();
  const profileMap = new Map();
  if (profile) {
    profileMap.set(String(profile._id), profile);
    if (profile.user) profileMap.set(String(profile.user), profile);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Lab test fetched",
        normalizeLabTest(lab, profileMap),
      ),
    );
});

const getLabSlotAvailability = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  if (!date) throw new ApiError(400, "Date is required");

  const lab = await LabTest.findOne({
    _id: id,
    active: true,
    approvalStatus: "approved",
    isApproved: true,
  }).lean();
  if (!lab) throw new ApiError(404, "Lab test not found");

  await clearExpiredHoldsForTest(id);

  const start = toStartOfDay(date);
  const end = toEndOfDay(date);

  const bookedSlots = await LabBooking.find({
    labTest: id,
    collectionType: "home",
    scheduledDate: { $gte: start, $lte: end },
    status: { $ne: "cancelled" },
  })
    .select("collectionTimeSlot")
    .lean();

  const activeHolds = await LabSlotHold.find({
    labTest: id,
    scheduledDate: start,
    status: "held",
    expiresAt: { $gt: new Date() },
  })
    .select("timeSlot patient")
    .lean();

  const booked = new Set(
    bookedSlots.map((item) => String(item.collectionTimeSlot || "")),
  );
  const heldMap = new Map(
    activeHolds.map((item) => [String(item.timeSlot), String(item.patient)]),
  );

  const slots = generateTimeSlots().map((slot) => {
    if (booked.has(slot)) {
      return { time: slot, status: "booked" };
    }
    if (heldMap.has(slot)) {
      const holder = heldMap.get(slot);
      return {
        time: slot,
        status:
          holder && req.user && String(req.user._id) === holder
            ? "held-by-you"
            : "held",
      };
    }
    return { time: slot, status: "available" };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Lab slots fetched", { date, slots }));
});

const holdLabSlot = catchAsync(async (req, res) => {
  await requirePatientProfileComplete(req.user._id);

  const lab = await LabTest.findOne({
    _id: req.params.id,
    active: true,
    approvalStatus: "approved",
    isApproved: true,
  }).lean();
  if (!lab) throw new ApiError(404, "Lab test not found");

  const scheduledDate = toStartOfDay(req.body.date);
  const timeSlot = req.body.timeSlot;

  await clearExpiredHoldsForTest(lab._id);

  const existingHold = await LabSlotHold.findOne({
    labTest: lab._id,
    scheduledDate,
    timeSlot,
    status: "held",
    expiresAt: { $gt: new Date() },
  });

  if (existingHold) {
    if (String(existingHold.patient) !== String(req.user._id)) {
      throw new ApiError(400, "Slot is temporarily unavailable");
    }
    existingHold.expiresAt = dayjs()
      .add(HOLD_WINDOW_MINUTES, "minute")
      .toDate();
    await existingHold.save();
    return res
      .status(200)
      .json(new ApiResponse(200, "Slot hold extended", existingHold));
  }

  const bookingExists = await LabBooking.findOne({
    labTest: lab._id,
    collectionType: "home",
    scheduledDate: { $gte: scheduledDate, $lte: toEndOfDay(scheduledDate) },
    collectionTimeSlot: timeSlot,
    status: { $ne: "cancelled" },
  }).lean();
  if (bookingExists) throw new ApiError(400, "Slot already booked");

  const hold = await LabSlotHold.create({
    labTest: lab._id,
    patient: req.user._id,
    scheduledDate,
    timeSlot,
    expiresAt: dayjs().add(HOLD_WINDOW_MINUTES, "minute").toDate(),
  });

  return res.status(201).json(new ApiResponse(201, "Slot held", hold));
});

const releaseLabSlotHold = catchAsync(async (req, res) => {
  const hold = await LabSlotHold.findOne({
    _id: req.params.holdId,
    patient: req.user._id,
  });
  if (!hold) throw new ApiError(404, "Slot hold not found");

  hold.status = "released";
  await hold.save();

  return res.status(200).json(new ApiResponse(200, "Slot released", hold));
});

const getLabVisitQuote = catchAsync(async (req, res) => {
  await requirePatientProfileComplete(req.user._id);

  const lab = await LabTest.findOne({
    _id: req.params.id,
    active: true,
    approvalStatus: "approved",
    isApproved: true,
  }).lean();
  if (!lab) throw new ApiError(404, "Lab test not found");

  const quote = await computeLabVisitQuote(lab, req.user._id);
  return res.status(200).json(
    new ApiResponse(200, "Lab visit quote", {
      labId: String(lab._id),
      distanceKm: quote.distanceKm,
      deliveryCost: quote.deliveryCost,
      costPerKm: quote.costPerKm,
      minCharge: quote.minCharge,
      maxServiceRadiusKm: quote.maxServiceRadiusKm,
      lab: {
        name: quote.lab?.labName || "",
        address: quote.lab?.address || "",
        city: quote.lab?.city || "",
        location: quote.lab?.location || null,
      },
    }),
  );
});

const bookLab = catchAsync(async (req, res) => {
  await requirePatientProfileComplete(req.user._id);

  const lab = await LabTest.findOne({
    _id: req.body.labTestId,
    active: true,
    approvalStatus: "approved",
    isApproved: true,
  });
  if (!lab) throw new ApiError(404, "Lab test not found or not approved");

  const bookingDate = dayjs(req.body.bookingDate).toDate();
  const collectionType = req.body.collectionType === "lab" ? "lab" : "home";
  let scheduledDate = req.body.scheduledDate
    ? dayjs(req.body.scheduledDate).toDate()
    : bookingDate;
  let collectionTimeSlot = req.body.collectionTimeSlot;

  let holdDoc = null;
  if (collectionType === "home") {
    if (!req.body.holdId) {
      throw new ApiError(400, "Slot hold is required for home collection");
    }
    if (!req.body.collectionTimeSlot) {
      throw new ApiError(400, "Time slot is required for home collection");
    }
    if (!req.body.homeCollectionAddress) {
      throw new ApiError(400, "Home collection address is required");
    }

    holdDoc = await LabSlotHold.findOne({
      _id: req.body.holdId,
      labTest: lab._id,
      patient: req.user._id,
      status: "held",
      expiresAt: { $gt: new Date() },
    });
    if (!holdDoc) {
      throw new ApiError(400, "Slot hold expired. Please pick another slot");
    }
    scheduledDate = holdDoc.scheduledDate;
    collectionTimeSlot = holdDoc.timeSlot;
  }

  let deliveryCost = 0;
  let distanceKm = 0;
  if (collectionType === "lab") {
    const quote = await computeLabVisitQuote(lab, req.user._id);
    deliveryCost = quote.deliveryCost;
    distanceKm = quote.distanceKm;
  }

  const amount = Number((lab.price + deliveryCost).toFixed(2));
  const adminShare = Number((amount * 0.2).toFixed(2));
  const labShare = Number((amount - adminShare).toFixed(2));

  const booking = await LabBooking.create({
    bookingType: collectionType === "lab" ? "lab_visit" : "home_collection",
    patient: req.user._id,
    labTest: lab._id,
    tests: [lab._id],
    bookingDate,
    scheduledDate,
    collectionType,
    timeSlot: collectionTimeSlot,
    collectionTimeSlot,
    address: req.body.homeCollectionAddress
      ? {
          flat:
            req.body.homeCollectionAddress.flat ||
            req.body.homeCollectionAddress.flatHouse ||
            "",
          street:
            req.body.homeCollectionAddress.street ||
            req.body.homeCollectionAddress.area ||
            "",
          landmark: req.body.homeCollectionAddress.landmark || "",
          city: req.body.homeCollectionAddress.city || "",
          pincode: req.body.homeCollectionAddress.pincode || "",
        }
      : undefined,
    homeCollectionAddress: req.body.homeCollectionAddress,
    contactNumber:
      req.body.homeCollectionAddress?.contactNumber || req.user.phone || "",
    labLocation: collectionType === "lab" ? lab.labName || "Lab Visit" : "",
    deliveryCost,
    distanceKm,
    amount,
    adminShare,
    labShare,
    paymentStatus: "pending",
    status: "pending",
    statusTimeline: [
      {
        status: "pending",
        note: "Booking created and awaiting lab confirmation.",
        at: new Date(),
      },
    ],
  });

  await Notification.create({
    title: "Lab booking created",
    message: `Your booking for ${lab.name} is created. Complete payment to confirm.`,
    type: "lab-booking-created",
    audienceType: "single",
    recipient: req.user._id,
    targetEntityType: "LabBooking",
    targetEntityId: booking._id,
  });

  try {
    await sendLabBookingConfirmationEmail({
      to: req.user.email,
      patientName: req.user.name,
      testName: lab.name,
      bookingDate: dayjs(booking.scheduledDate || booking.bookingDate).format(
        "DD MMM YYYY",
      ),
    });
  } catch (error) {
    logError("lab_booking_email_failed", error, {
      bookingId: booking._id,
      patientId: req.user._id,
    });
  }

  if (holdDoc) {
    holdDoc.status = "booked";
    holdDoc.booking = booking._id;
    await holdDoc.save();
  }

  return res.status(201).json(new ApiResponse(201, "Lab booked", booking));
});

const getMyLabBookings = catchAsync(async (req, res) => {
  const query = { patient: req.user._id };
  if (req.query.status) {
    query.status = normalizeLabBookingStatus(req.query.status);
  }

  const bookings = await LabBooking.find(query)
    .populate({
      path: "labTest",
      select:
        "name shortDescription fullDescription category price originalPrice reportTime testImage owner labId labName",
    })
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, "Lab bookings fetched", bookings));
});

const getLabReviews = catchAsync(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(400, "Invalid lab test id");
  }

  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(30, Math.max(1, Number(req.query.limit || 10)));
  const skip = (page - 1) * limit;
  const sort =
    req.query.sortBy === "highest"
      ? { rating: -1, createdAt: -1 }
      : { createdAt: -1 };
  const labTestId = new mongoose.Types.ObjectId(String(req.params.id));

  const [items, total, summary] = await Promise.all([
    LabTestReview.find({ labTest: req.params.id })
      .populate("user", "name image")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    LabTestReview.countDocuments({ labTest: req.params.id }),
    LabTestReview.aggregate([
      { $match: { labTest: labTestId } },
      {
        $group: {
          _id: "$labTest",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Lab reviews fetched", {
      items,
      summary: {
        averageRating: summary[0]?.averageRating
          ? Number(summary[0].averageRating.toFixed(1))
          : 0,
        totalReviews: summary[0]?.totalReviews || 0,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    }),
  );
});

const addLabReview = catchAsync(async (req, res) => {
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || "").trim();
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }
  if (comment.length < 3 || comment.length > 800) {
    throw new ApiError(400, "Comment must be between 3 and 800 characters");
  }

  const lab = await LabTest.findOne({
    _id: req.params.id,
    active: true,
    approvalStatus: "approved",
    isApproved: true,
  })
    .select("_id")
    .lean();
  if (!lab) throw new ApiError(404, "Lab test not found");

  const existing = await LabTestReview.findOne({
    labTest: req.params.id,
    user: req.user._id,
  }).lean();
  if (existing) {
    throw new ApiError(409, "You have already reviewed this lab test");
  }

  const review = await LabTestReview.create({
    labTest: req.params.id,
    user: req.user._id,
    rating,
    comment,
  });

  const stats = await LabTestReview.aggregate([
    { $match: { labTest: lab._id } },
    {
      $group: {
        _id: "$labTest",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  await LabTest.updateOne(
    { _id: lab._id },
    {
      rating: stats[0]?.averageRating
        ? Number(stats[0].averageRating.toFixed(1))
        : 0,
      reviewsCount: stats[0]?.totalReviews || 0,
    },
  );

  return res.status(201).json(new ApiResponse(201, "Review added", review));
});

module.exports = {
  getLabs,
  getLabById,
  getLabSlotAvailability,
  holdLabSlot,
  releaseLabSlotHold,
  getLabVisitQuote,
  bookLab,
  getMyLabBookings,
  getLabReviews,
  addLabReview,
};
