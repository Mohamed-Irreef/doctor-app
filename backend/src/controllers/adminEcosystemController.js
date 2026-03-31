const User = require("../models/User");
const Payment = require("../models/Payment");
const LabTest = require("../models/LabTest");
const Medicine = require("../models/Medicine");
const LabBooking = require("../models/LabBooking");
const Order = require("../models/Order");
const LabPartnerProfile = require("../models/LabPartnerProfile");
const PharmacyPartnerProfile = require("../models/PharmacyPartnerProfile");
const cloudinary = require("../config/cloudinary");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { sendPartnerApprovalEmail } = require("../services/emailService");
const { logAuditEvent } = require("../services/auditLogService");
const { logError } = require("../utils/logger");
const { emitToUser } = require("../realtime/socket");

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

  const resourceType = parsed.resourceType || "image";
  const deliveryType = parsed.deliveryType || "upload";
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 30;

  try {
    const privateUrl = cloudinary.utils.private_download_url(
      parsed.publicId,
      parsed.format,
      {
        resource_type: resourceType,
        type: deliveryType,
        expires_at: expiresAt,
        attachment: false,
      },
    );

    if (privateUrl) return privateUrl;
  } catch {
    // Fall back to signed delivery URL below.
  }

  return cloudinary.url(parsed.publicId, {
    secure: true,
    sign_url: true,
    resource_type: resourceType,
    type: deliveryType,
    format: parsed.format,
  });
}

function withViewerUrl(document) {
  if (!document?.url) return document;
  return {
    ...document,
    viewerUrl: buildSignedViewerUrl(document.url),
  };
}

function withSignedPartnerDocuments(item) {
  return {
    ...item,
    governmentLicense: withViewerUrl(item.governmentLicense),
    labCertification: withViewerUrl(item.labCertification),
    ownerIdProof: withViewerUrl(item.ownerIdProof),
    addressProof: withViewerUrl(item.addressProof),
    drugLicense: withViewerUrl(item.drugLicense),
    gstCertificate: withViewerUrl(item.gstCertificate),
  };
}

function withSignedLabTestMedia(item) {
  if (!item) return item;
  const testImageUrl = item.testImage || item.imageUrl;

  return {
    ...item,
    testImageViewerUrl: testImageUrl ? buildSignedViewerUrl(testImageUrl) : "",
    imageViewerUrl: item.imageUrl ? buildSignedViewerUrl(item.imageUrl) : "",
    reportSampleViewerUrl: item.reportSampleUrl
      ? buildSignedViewerUrl(item.reportSampleUrl)
      : "",
    testVideoViewerUrl: item.testVideoUrl
      ? buildSignedViewerUrl(item.testVideoUrl)
      : "",
  };
}

async function resolvePartnerProfileById(id) {
  const lab = await LabPartnerProfile.findById(id);
  if (lab) return { profile: lab, type: "lab" };

  const pharmacy = await PharmacyPartnerProfile.findById(id);
  if (pharmacy) return { profile: pharmacy, type: "pharmacy" };

  throw new ApiError(404, "Partner request not found");
}

async function applyPartnerDecision({
  profile,
  type,
  approved,
  reason,
  adminId,
}) {
  profile.approvalStatus = approved ? "approved" : "rejected";
  profile.status = approved ? "APPROVED" : "REJECTED";
  profile.isApproved = approved;
  profile.rejectionReason = approved ? "" : reason || "Rejected by admin";
  profile.approvedBy = adminId;
  profile.approvedAt = new Date();
  await profile.save();

  await logAuditEvent({
    entityType: type === "lab" ? "lab_partner" : "pharmacy_partner",
    entityId: profile._id,
    action: approved ? "partner_approved" : "partner_rejected",
    performedBy: adminId,
    performedByRole: "admin",
    metadata: {
      partnerUserId: profile.user,
      reason: approved ? null : reason || "Rejected by admin",
    },
  });

  if (type === "lab") {
    await User.findByIdAndUpdate(profile.user, {
      labApprovalStatus: approved ? "approved" : "rejected",
      status: approved ? "active" : "inactive",
    });
  } else {
    await User.findByIdAndUpdate(profile.user, {
      pharmacyApprovalStatus: approved ? "approved" : "rejected",
      status: approved ? "active" : "inactive",
    });
  }

  try {
    await sendPartnerApprovalEmail({
      to: profile.email,
      partnerName: profile.fullName,
      partnerType: type,
      approved,
      reason,
    });
  } catch (error) {
    logError("partner_approval_email_failed", error, {
      profileId: profile._id,
      type,
      approved,
    });
  }

  return profile;
}

async function getPartnerCountMap(type, userIds) {
  if (!userIds.length) return new Map();

  const Model = type === "lab" ? LabTest : Medicine;
  const grouped = await Model.aggregate([
    { $match: { owner: { $in: userIds } } },
    { $group: { _id: "$owner", total: { $sum: 1 } } },
  ]);

  return new Map(
    grouped.map((row) => [String(row._id), Number(row.total || 0)]),
  );
}

function buildPartnerSummary(item, type, countMap) {
  const userId = String(item.user?._id || item.user || "");
  return {
    ...withSignedPartnerDocuments(item),
    partnerType: type,
    partnerStatus: item.user?.status || "inactive",
    publishedItems: countMap.get(userId) || 0,
  };
}

const getEcosystemMetrics = catchAsync(async (_req, res) => {
  const [
    labsTotal,
    pharmaciesTotal,
    pendingLabs,
    pendingPharmacies,
    approvedLabs,
    approvedPharmacies,
    rejectedLabs,
    rejectedPharmacies,
    totalLabBookings,
    totalPharmacyOrders,
    revenue,
  ] = await Promise.all([
    User.countDocuments({ role: "lab_admin", labApprovalStatus: "approved" }),
    User.countDocuments({
      role: "pharmacy_admin",
      pharmacyApprovalStatus: "approved",
    }),
    LabPartnerProfile.countDocuments({ approvalStatus: "pending" }),
    PharmacyPartnerProfile.countDocuments({ approvalStatus: "pending" }),
    LabPartnerProfile.countDocuments({ approvalStatus: "approved" }),
    PharmacyPartnerProfile.countDocuments({ approvalStatus: "approved" }),
    LabPartnerProfile.countDocuments({ approvalStatus: "rejected" }),
    PharmacyPartnerProfile.countDocuments({ approvalStatus: "rejected" }),
    LabBooking.countDocuments(),
    Order.countDocuments(),
    Payment.aggregate([
      { $match: { status: "paid", type: { $in: ["lab", "pharmacy"] } } },
      {
        $group: {
          _id: "$type",
          gross: { $sum: "$amount" },
          platform: { $sum: "$commissionAmount" },
        },
      },
    ]),
  ]);

  const totalRevenue = revenue.reduce(
    (sum, item) => sum + Number(item.gross || 0),
    0,
  );
  const totalPlatformRevenue = revenue.reduce(
    (sum, item) => sum + Number(item.platform || 0),
    0,
  );

  return res.status(200).json(
    new ApiResponse(200, "Ecosystem metrics fetched", {
      totals: {
        totalRevenue,
        totalPlatformRevenue,
        labsTotal,
        pharmaciesTotal,
        totalBookings: totalLabBookings,
        totalOrders: totalPharmacyOrders,
        pendingApprovals: pendingLabs + pendingPharmacies,
      },
      approvals: {
        lab: {
          approved: approvedLabs,
          pending: pendingLabs,
          rejected: rejectedLabs,
        },
        pharmacy: {
          approved: approvedPharmacies,
          pending: pendingPharmacies,
          rejected: rejectedPharmacies,
        },
      },
      revenue,
    }),
  );
});

const getLabApprovalRequests = catchAsync(async (_req, res) => {
  const requests = await LabPartnerProfile.find({})
    .populate("user", "status labApprovalStatus")
    .sort({ createdAt: -1 })
    .lean();
  const safeRequests = requests.map(withSignedPartnerDocuments);
  return res
    .status(200)
    .json(new ApiResponse(200, "Lab requests fetched", safeRequests));
});

const decideLabApproval = catchAsync(async (req, res) => {
  const profile = await LabPartnerProfile.findById(req.params.id);
  if (!profile) throw new ApiError(404, "Lab request not found");

  const approved = req.body.approved;
  const updated = await applyPartnerDecision({
    profile,
    type: "lab",
    approved,
    reason: req.body.reason,
    adminId: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Lab request updated", updated));
});

const getPharmacyApprovalRequests = catchAsync(async (_req, res) => {
  const requests = await PharmacyPartnerProfile.find({})
    .populate("user", "status pharmacyApprovalStatus")
    .sort({ createdAt: -1 })
    .lean();
  const safeRequests = requests.map(withSignedPartnerDocuments);
  return res
    .status(200)
    .json(new ApiResponse(200, "Pharmacy requests fetched", safeRequests));
});

const decidePharmacyApproval = catchAsync(async (req, res) => {
  const profile = await PharmacyPartnerProfile.findById(req.params.id);
  if (!profile) throw new ApiError(404, "Pharmacy request not found");

  const approved = req.body.approved;
  const updated = await applyPartnerDecision({
    profile,
    type: "pharmacy",
    approved,
    reason: req.body.reason,
    adminId: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Pharmacy request updated", updated));
});

const getPendingPartners = catchAsync(async (_req, res) => {
  const [labs, pharmacies] = await Promise.all([
    LabPartnerProfile.find({ approvalStatus: "pending" })
      .populate("user", "name email phone status labApprovalStatus")
      .sort({ createdAt: -1 })
      .lean(),
    PharmacyPartnerProfile.find({ approvalStatus: "pending" })
      .populate("user", "name email phone status pharmacyApprovalStatus")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const partners = [
    ...labs.map((item) => ({
      ...withSignedPartnerDocuments(item),
      partnerType: "lab",
    })),
    ...pharmacies.map((item) => ({
      ...withSignedPartnerDocuments(item),
      partnerType: "pharmacy",
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res
    .status(200)
    .json(new ApiResponse(200, "Pending partners fetched", partners));
});

const approvePartner = catchAsync(async (req, res) => {
  const { profile, type } = await resolvePartnerProfileById(req.params.id);
  const updated = await applyPartnerDecision({
    profile,
    type,
    approved: true,
    reason: req.body?.reason,
    adminId: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Partner approved", updated));
});

const rejectPartner = catchAsync(async (req, res) => {
  if (!req.body?.reason || !String(req.body.reason).trim()) {
    throw new ApiError(400, "Rejection reason is required");
  }

  const { profile, type } = await resolvePartnerProfileById(req.params.id);
  const updated = await applyPartnerDecision({
    profile,
    type,
    approved: false,
    reason: req.body.reason,
    adminId: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Partner rejected", updated));
});

const getApprovedPartners = catchAsync(async (req, res) => {
  const requestedType = String(req.query.type || "all").toLowerCase();
  const search = String(req.query.search || "")
    .trim()
    .toLowerCase();
  const statusFilter = String(req.query.status || "all").toLowerCase();

  const includeLabs = requestedType === "all" || requestedType === "lab";
  const includePharmacies =
    requestedType === "all" || requestedType === "pharmacy";

  const labBaseFilter = { approvalStatus: "approved" };
  const pharmacyBaseFilter = { approvalStatus: "approved" };

  const [labsRaw, pharmaciesRaw] = await Promise.all([
    includeLabs
      ? LabPartnerProfile.find(labBaseFilter)
          .populate("user", "name email phone status labApprovalStatus")
          .sort({ createdAt: -1 })
          .lean()
      : Promise.resolve([]),
    includePharmacies
      ? PharmacyPartnerProfile.find(pharmacyBaseFilter)
          .populate("user", "name email phone status pharmacyApprovalStatus")
          .sort({ createdAt: -1 })
          .lean()
      : Promise.resolve([]),
  ]);

  const labUserIds = labsRaw
    .map((item) => item.user?._id)
    .filter(Boolean)
    .map((id) => id);
  const pharmacyUserIds = pharmaciesRaw
    .map((item) => item.user?._id)
    .filter(Boolean)
    .map((id) => id);

  const [labCountMap, pharmacyCountMap] = await Promise.all([
    getPartnerCountMap("lab", labUserIds),
    getPartnerCountMap("pharmacy", pharmacyUserIds),
  ]);

  let partners = [
    ...labsRaw.map((item) => buildPartnerSummary(item, "lab", labCountMap)),
    ...pharmaciesRaw.map((item) =>
      buildPartnerSummary(item, "pharmacy", pharmacyCountMap),
    ),
  ];

  if (statusFilter === "active" || statusFilter === "inactive") {
    partners = partners.filter((item) => item.partnerStatus === statusFilter);
  }

  if (search) {
    partners = partners.filter((item) => {
      const label =
        item.partnerType === "lab" ? item.labName : item.pharmacyName;
      return [
        item.fullName,
        label,
        item.email,
        item.phone,
        item.city,
        item.state,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }

  partners.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).json(
    new ApiResponse(200, "Approved partners fetched", {
      items: partners,
      summary: {
        total: partners.length,
        labs: partners.filter((item) => item.partnerType === "lab").length,
        pharmacies: partners.filter((item) => item.partnerType === "pharmacy")
          .length,
      },
    }),
  );
});

const getPartnerDetails = catchAsync(async (req, res) => {
  const { profile, type } = await resolvePartnerProfileById(req.params.id);
  const profileObj = profile.toObject();

  const content =
    type === "lab"
      ? await LabTest.find({ owner: profile.user })
          .sort({ createdAt: -1 })
          .select("name category price approvalStatus active createdAt")
          .lean()
      : await Medicine.find({ owner: profile.user })
          .sort({ createdAt: -1 })
          .select("name category price stock approvalStatus active createdAt")
          .lean();

  const user = await User.findById(profile.user)
    .select("name email phone status labApprovalStatus pharmacyApprovalStatus")
    .lean();

  return res.status(200).json(
    new ApiResponse(200, "Partner details fetched", {
      ...withSignedPartnerDocuments(profileObj),
      partnerType: type,
      partnerStatus: user?.status || "inactive",
      user,
      content,
    }),
  );
});

const togglePartnerBan = catchAsync(async (req, res) => {
  const { profile, type } = await resolvePartnerProfileById(req.params.id);
  const shouldBan = Boolean(req.body?.banned);

  await User.findByIdAndUpdate(profile.user, {
    status: shouldBan ? "inactive" : "active",
  });

  await logAuditEvent({
    entityType: type === "lab" ? "lab_partner" : "pharmacy_partner",
    entityId: profile._id,
    action: shouldBan ? "partner_banned" : "partner_unbanned",
    performedBy: req.user?._id,
    performedByRole: req.user?.role,
    metadata: {
      partnerUserId: profile.user,
    },
  });

  const user = await User.findById(profile.user).select("status").lean();

  return res.status(200).json(
    new ApiResponse(200, shouldBan ? "Partner banned" : "Partner unbanned", {
      partnerId: profile._id,
      partnerType: type,
      status: user?.status || "inactive",
    }),
  );
});

const deletePartner = catchAsync(async (req, res) => {
  const { profile, type } = await resolvePartnerProfileById(req.params.id);
  const userId = profile.user;

  if (type === "lab") {
    await LabTest.deleteMany({ owner: userId });
    await LabPartnerProfile.findByIdAndDelete(profile._id);
  } else {
    await Medicine.deleteMany({ owner: userId });
    await PharmacyPartnerProfile.findByIdAndDelete(profile._id);
  }

  await User.findByIdAndDelete(userId);

  await logAuditEvent({
    entityType: type === "lab" ? "lab_partner" : "pharmacy_partner",
    entityId: profile._id,
    action: "partner_deleted",
    performedBy: req.user?._id,
    performedByRole: req.user?.role,
    metadata: {
      partnerUserId: userId,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Partner deleted", { id: req.params.id, type }));
});

const getPendingContentApprovals = catchAsync(async (_req, res) => {
  const [labTests, medicines] = await Promise.all([
    LabTest.find({ approvalStatus: "pending" })
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .lean(),
    Medicine.find({ approvalStatus: "pending" })
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const signedLabTests = labTests.map(withSignedLabTestMedia);

  return res.status(200).json(
    new ApiResponse(200, "Pending content fetched", {
      labTests: signedLabTests,
      medicines,
    }),
  );
});

const decideLabTestContent = catchAsync(async (req, res) => {
  const item = await LabTest.findById(req.params.id);
  if (!item) throw new ApiError(404, "Lab test not found");

  const approved = req.body.approved;
  item.approvalStatus = approved ? "approved" : "rejected";
  item.isApproved = approved;
  item.active = approved;
  item.approvalNote = approved ? "" : req.body.reason || "Rejected by admin";
  item.approvedBy = req.user._id;
  item.approvedAt = new Date();
  await item.save();

  emitToUser(item.owner, "lab:test-approval", {
    id: String(item._id),
    name: item.name,
    approvalStatus: item.approvalStatus,
    reason: item.approvalNote || "",
    at: new Date().toISOString(),
  });

  await logAuditEvent({
    entityType: "lab_test",
    entityId: item._id,
    action: approved ? "lab_test_approved" : "lab_test_rejected",
    performedBy: req.user?._id,
    performedByRole: req.user?.role,
    metadata: {
      owner: item.owner,
      reason: approved ? null : req.body.reason || "Rejected by admin",
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Lab test decision updated", item));
});

const decideMedicineContent = catchAsync(async (req, res) => {
  const item = await Medicine.findById(req.params.id);
  if (!item) throw new ApiError(404, "Medicine not found");

  const approved = req.body.approved;
  item.approvalStatus = approved ? "approved" : "rejected";
  item.isApproved = approved;
  item.active = approved;
  item.approvalNote = approved ? "" : req.body.reason || "Rejected by admin";
  item.approvedBy = req.user._id;
  item.approvedAt = new Date();
  await item.save();

  emitToUser(item.owner, "pharmacy:medicine-approval", {
    id: String(item._id),
    name: item.name,
    approvalStatus: item.approvalStatus,
    reason: item.approvalNote || "",
    at: new Date().toISOString(),
  });

  await logAuditEvent({
    entityType: "medicine",
    entityId: item._id,
    action: approved ? "medicine_approved" : "medicine_rejected",
    performedBy: req.user?._id,
    performedByRole: req.user?.role,
    metadata: {
      owner: item.owner,
      reason: approved ? null : req.body.reason || "Rejected by admin",
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Medicine decision updated", item));
});

module.exports = {
  getEcosystemMetrics,
  getPendingPartners,
  getApprovedPartners,
  getPartnerDetails,
  togglePartnerBan,
  deletePartner,
  approvePartner,
  rejectPartner,
  getLabApprovalRequests,
  decideLabApproval,
  getPharmacyApprovalRequests,
  decidePharmacyApproval,
  getPendingContentApprovals,
  decideLabTestContent,
  decideMedicineContent,
};
