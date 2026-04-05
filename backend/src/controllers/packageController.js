const mongoose = require("mongoose");
const Package = require("../models/Package");
const PackageReview = require("../models/PackageReview");
const PackageBooking = require("../models/PackageBooking");
const LabPartnerProfile = require("../models/LabPartnerProfile");
const cloudinary = require("../config/cloudinary");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

function buildLabAddress(labProfile) {
  if (!labProfile) return "";
  const parts = [
    labProfile.address,
    labProfile.city,
    labProfile.state,
    labProfile.pincode,
  ]
    .map((p) => (p || "").toString().trim())
    .filter(Boolean);
  return parts.join(", ");
}

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

  // If it's already publicly deliverable, return the original URL so browsers can view inline.
  if ((parsed.deliveryType || "upload") === "upload") return url;

  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour

  // Signed delivery URL (viewer-friendly). Avoid private_download_url since it tends to force downloads.
  return cloudinary.url(parsed.publicId, {
    secure: true,
    sign_url: true,
    resource_type: parsed.resourceType || "raw",
    type: parsed.deliveryType || "authenticated",
    format: parsed.format,
    expires_at: expiresAt,
  });
}

function validateUploadedFile(file, { kind }) {
  if (!file) return;
  const mime = (file.mimetype || "").toLowerCase();

  if (kind === "image") {
    if (!mime.startsWith("image/"))
      throw new ApiError(400, "Invalid image file type");
    return;
  }
  if (kind === "pdf") {
    if (mime !== "application/pdf")
      throw new ApiError(400, "Brochure must be a PDF");
    return;
  }
}

function normalizeStringList(items) {
  const list = Array.isArray(items) ? items : [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const value = (raw ?? "").toString().trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function normalizeTests(groups) {
  const list = Array.isArray(groups) ? groups : [];
  return list
    .map((g) => {
      const category = (g?.category ?? "").toString().trim();
      const tests = normalizeStringList(g?.tests || []);
      return { category, tests };
    })
    .filter((g) => g.category && g.tests.length > 0);
}

// ─── Lab Admin ─────────────────────────────────────────────────────────────────

const createPackage = catchAsync(async (req, res) => {
  if (req.user.role !== "lab_admin") throw new ApiError(403, "Not authorized");

  const labProfile = await LabPartnerProfile.findOne({ user: req.user._id });
  if (!labProfile) throw new ApiError(404, "Lab profile not found");

  let body;
  try {
    body = JSON.parse(req.body.data || "{}");
  } catch {
    throw new ApiError(400, "Invalid package payload");
  }

  // Never trust client-provided media URLs; only accept Cloudinary results
  delete body.image;
  delete body.brochure;
  delete body.thumbnailImage;
  delete body.brochureUrl;

  // Server-managed fields / relationships
  delete body._id;
  delete body.id;
  delete body.labId;
  delete body.labName;
  delete body.active;
  delete body.approvedBy;
  delete body.approvedAt;
  delete body.approvalNote;
  delete body.rating;
  delete body.reviewsCount;
  delete body.createdAt;
  delete body.updatedAt;

  // Validate incoming files (mimetype); size is already limited by multer
  validateUploadedFile(req.files?.packageImageFile?.[0], { kind: "image" });
  validateUploadedFile(req.files?.thumbnailFile?.[0], { kind: "image" });
  validateUploadedFile(req.files?.brochureFile?.[0], { kind: "pdf" });

  if (!req.files?.packageImageFile?.[0]?.buffer) {
    throw new ApiError(400, "Package image is required");
  }

  // Handle file uploads
  if (req.files?.packageImageFile?.[0]?.buffer) {
    const result = await uploadBufferToCloudinary(
      req.files.packageImageFile[0].buffer,
      "nividoc/packages/images",
    );
    body.image = result?.secure_url;
  }
  if (req.files?.brochureFile?.[0]?.buffer) {
    const result = await uploadBufferToCloudinary(
      req.files.brochureFile[0].buffer,
      "nividoc/packages/brochures",
      { resource_type: "raw", access_mode: "public" },
    );
    body.brochure = result?.secure_url;
  }
  if (req.files?.thumbnailFile?.[0]?.buffer) {
    const result = await uploadBufferToCloudinary(
      req.files.thumbnailFile[0].buffer,
      "nividoc/packages/thumbnails",
    );
    body.thumbnailImage = result?.secure_url;
  }

  body.tags = normalizeStringList(body.tags);
  body.suitableFor = normalizeStringList(body.suitableFor);
  body.tests = normalizeTests(body.tests);
  if (body.details) {
    body.details.highlyRecommendedFor = normalizeStringList(
      body.details.highlyRecommendedFor,
    );
    const howItWorks = Array.isArray(body.details.howItWorks)
      ? body.details.howItWorks
      : [];
    body.details.howItWorks = howItWorks
      .map((s) => ({ step: (s?.step ?? "").toString().trim() }))
      .filter((s) => s.step);
  }

  // Calculate discount and final price
  const original = Number(body.price?.original || 0);
  const offer = Number(body.price?.offer || original);
  const gst = Number(body.price?.gst || 0);
  if (!(original > 0))
    throw new ApiError(400, "Original price must be greater than 0");
  if (!(offer > 0))
    throw new ApiError(400, "Offer price must be greater than 0");
  if (offer > original)
    throw new ApiError(400, "Offer price cannot exceed original price");
  if (gst < 0 || gst > 100)
    throw new ApiError(400, "GST must be between 0 and 100");
  const discount =
    original > 0 ? Math.round(((original - offer) / original) * 100) : 0;
  const final = Math.round(offer * (1 + gst / 100));

  // Count total tests
  const testCount = (body.tests || []).reduce(
    (sum, group) => sum + (group.tests?.length || 0),
    0,
  );
  if (testCount <= 0) throw new ApiError(400, "Add at least one test");

  const pkg = await Package.create({
    ...body,
    labId: labProfile._id,
    labName: labProfile.labName || labProfile.name || "Lab",
    // Lab submissions always go through approval, unless explicitly saved as draft
    status: body.status === "DRAFT" ? "DRAFT" : "PENDING_APPROVAL",
    active: false,
    price: { original, offer, discount, gst, final },
    testCount,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Package submitted for approval", pkg));
});

const getLabPackages = catchAsync(async (req, res) => {
  if (req.user.role !== "lab_admin") throw new ApiError(403, "Not authorized");
  const labProfile = await LabPartnerProfile.findOne({ user: req.user._id });
  if (!labProfile) throw new ApiError(404, "Lab profile not found");

  const items = await Package.find({ labId: labProfile._id }).sort({
    createdAt: -1,
  });

  const packages = items.map((p) => {
    const obj = p.toObject();
    return {
      ...obj,
      brochureUrl: obj.brochure
        ? buildSignedViewerUrl(obj.brochure)
        : obj.brochure,
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Packages fetched", packages));
});

const updatePackage = catchAsync(async (req, res) => {
  if (req.user.role !== "lab_admin") throw new ApiError(403, "Not authorized");
  const labProfile = await LabPartnerProfile.findOne({ user: req.user._id });
  if (!labProfile) throw new ApiError(404, "Lab profile not found");

  const pkg = await Package.findOne({
    _id: req.params.id,
    labId: labProfile._id,
  });
  if (!pkg) throw new ApiError(404, "Package not found");

  let body;
  try {
    body = JSON.parse(req.body.data || "{}");
  } catch {
    throw new ApiError(400, "Invalid package payload");
  }

  // Never trust client-provided media URLs; only accept Cloudinary results
  delete body.image;
  delete body.brochure;
  delete body.thumbnailImage;
  delete body.brochureUrl;
  // Do not allow lab admins to self-approve/reject
  delete body.approvedBy;
  delete body.approvedAt;
  delete body.approvalNote;
  if (body.status && body.status !== "DRAFT") delete body.status;

  // Server-managed fields / relationships
  delete body._id;
  delete body.id;
  delete body.labId;
  delete body.labName;
  delete body.active;
  delete body.rating;
  delete body.reviewsCount;
  delete body.createdAt;
  delete body.updatedAt;

  validateUploadedFile(req.files?.packageImageFile?.[0], { kind: "image" });
  validateUploadedFile(req.files?.thumbnailFile?.[0], { kind: "image" });
  validateUploadedFile(req.files?.brochureFile?.[0], { kind: "pdf" });

  if (req.files?.packageImageFile?.[0]?.buffer) {
    const result = await uploadBufferToCloudinary(
      req.files.packageImageFile[0].buffer,
      "nividoc/packages/images",
    );
    body.image = result?.secure_url;
  }
  if (req.files?.brochureFile?.[0]?.buffer) {
    const result = await uploadBufferToCloudinary(
      req.files.brochureFile[0].buffer,
      "nividoc/packages/brochures",
      { resource_type: "raw", access_mode: "public" },
    );
    body.brochure = result?.secure_url;
  }

  if (req.files?.thumbnailFile?.[0]?.buffer) {
    const result = await uploadBufferToCloudinary(
      req.files.thumbnailFile[0].buffer,
      "nividoc/packages/thumbnails",
    );
    body.thumbnailImage = result?.secure_url;
  }

  if (body.tags) body.tags = normalizeStringList(body.tags);
  if (body.suitableFor)
    body.suitableFor = normalizeStringList(body.suitableFor);
  if (body.tests) body.tests = normalizeTests(body.tests);
  if (body.details) {
    if (body.details.highlyRecommendedFor) {
      body.details.highlyRecommendedFor = normalizeStringList(
        body.details.highlyRecommendedFor,
      );
    }
    if (body.details.howItWorks) {
      const howItWorks = Array.isArray(body.details.howItWorks)
        ? body.details.howItWorks
        : [];
      body.details.howItWorks = howItWorks
        .map((s) => ({ step: (s?.step ?? "").toString().trim() }))
        .filter((s) => s.step);
    }
  }

  const original = Number(body.price?.original ?? pkg.price.original);
  const offer = Number(body.price?.offer ?? pkg.price.offer);
  const gst = Number(body.price?.gst ?? pkg.price.gst);
  if (!(original > 0))
    throw new ApiError(400, "Original price must be greater than 0");
  if (!(offer > 0))
    throw new ApiError(400, "Offer price must be greater than 0");
  if (offer > original)
    throw new ApiError(400, "Offer price cannot exceed original price");
  if (gst < 0 || gst > 100)
    throw new ApiError(400, "GST must be between 0 and 100");
  const discount =
    original > 0 ? Math.round(((original - offer) / original) * 100) : 0;
  const final = Math.round(offer * (1 + gst / 100));
  const testCount = (body.tests || pkg.tests).reduce(
    (sum, g) => sum + (g.tests?.length || 0),
    0,
  );
  if (testCount <= 0) throw new ApiError(400, "Add at least one test");

  // Any non-draft update should return to approval workflow
  const nextStatus = body.status === "DRAFT" ? "DRAFT" : "PENDING_APPROVAL";
  Object.assign(pkg, body, {
    status: nextStatus,
    active: nextStatus === "APPROVED" ? true : false,
    price: { original, offer, discount, gst, final },
    testCount,
  });
  await pkg.save();

  return res.status(200).json(new ApiResponse(200, "Package updated", pkg));
});

const deletePackage = catchAsync(async (req, res) => {
  if (req.user.role !== "lab_admin") throw new ApiError(403, "Not authorized");
  const labProfile = await LabPartnerProfile.findOne({ user: req.user._id });
  if (!labProfile) throw new ApiError(404, "Lab profile not found");

  await Package.findOneAndDelete({ _id: req.params.id, labId: labProfile._id });
  return res.status(200).json(new ApiResponse(200, "Package deleted", null));
});

// ─── Admin ──────────────────────────────────────────────────────────────────────

const getPendingPackages = catchAsync(async (req, res) => {
  const { status = "PENDING_APPROVAL" } = req.query;
  const items = await Package.find({ status }).sort({ createdAt: -1 });

  const packages = items.map((p) => {
    const obj = p.toObject();
    return {
      ...obj,
      brochureUrl: obj.brochure
        ? buildSignedViewerUrl(obj.brochure)
        : obj.brochure,
    };
  });
  return res
    .status(200)
    .json(new ApiResponse(200, "Packages fetched", packages));
});

const approvePackage = catchAsync(async (req, res) => {
  const pkg = await Package.findByIdAndUpdate(
    req.params.id,
    {
      status: "APPROVED",
      active: true,
      approvedBy: req.user._id,
      approvedAt: new Date(),
    },
    { new: true },
  );
  if (!pkg) throw new ApiError(404, "Package not found");
  return res.status(200).json(new ApiResponse(200, "Package approved", pkg));
});

const rejectPackage = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const pkg = await Package.findByIdAndUpdate(
    req.params.id,
    { status: "REJECTED", approvalNote: reason || "" },
    { new: true },
  );
  if (!pkg) throw new ApiError(404, "Package not found");
  return res.status(200).json(new ApiResponse(200, "Package rejected", pkg));
});

// ─── Patient ────────────────────────────────────────────────────────────────────

const getApprovedPackages = catchAsync(async (req, res) => {
  const { category, limit = 20, page = 1 } = req.query;
  const filter = { status: "APPROVED", active: true };
  if (category && category !== "All") filter.category = category;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Package.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("labId", "labName address city state pincode profilePhoto"),
    Package.countDocuments(filter),
  ]);

  const packages = items.map((p) => {
    const obj = p.toObject();
    const labProfile = obj.labId;
    return {
      ...obj,
      lab: labProfile
        ? {
            _id: labProfile._id,
            name: labProfile.labName,
            logo: labProfile.profilePhoto,
            address: buildLabAddress(labProfile),
          }
        : undefined,
    };
  });

  return res.status(200).json(
    new ApiResponse(200, "Packages fetched", {
      packages,
      total,
      page: Number(page),
    }),
  );
});

const getPackageById = catchAsync(async (req, res) => {
  const pkg = await Package.findOne({
    _id: req.params.id,
    status: "APPROVED",
    active: true,
  }).populate("labId", "labName address city state pincode profilePhoto");
  if (!pkg) throw new ApiError(404, "Package not found");

  const brochureUrl = pkg.brochure
    ? buildSignedViewerUrl(pkg.brochure)
    : pkg.brochure;

  const obj = pkg.toObject();
  const labProfile = obj.labId;
  const lab = labProfile
    ? {
        _id: labProfile._id,
        name: labProfile.labName,
        logo: labProfile.profilePhoto,
        address: buildLabAddress(labProfile),
      }
    : undefined;

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Package fetched", { ...obj, lab, brochureUrl }),
    );
});

// ─── Bookings ─────────────────────────────────────────────────────────────────

const createPackageBooking = catchAsync(async (req, res) => {
  const pkg = await Package.findOne({
    _id: req.params.id,
    status: "APPROVED",
    active: true,
  }).select("price labId");

  if (!pkg) throw new ApiError(404, "Package not found");

  const amount = Number(
    pkg.price?.final || pkg.price?.offer || pkg.price?.original || 0,
  );
  if (!(amount > 0)) throw new ApiError(400, "Invalid package amount");

  const booking = await PackageBooking.create({
    patient: req.user._id,
    package: pkg._id,
    labId: pkg.labId,
    amount,
    currency: "INR",
    status: "booked",
    paymentStatus: "pending",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Package booking created", booking));
});

// ─── Reviews ────────────────────────────────────────────────────────────────────

const addPackageReview = catchAsync(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5)
    throw new ApiError(400, "Rating must be 1-5");

  const existing = await PackageReview.findOne({
    packageId: req.params.id,
    user: req.user._id,
  });
  if (existing)
    throw new ApiError(400, "You have already reviewed this package");

  const review = await PackageReview.create({
    packageId: req.params.id,
    user: req.user._id,
    rating,
    comment,
    name: req.user.name,
  });

  // Update package rating
  const reviews = await PackageReview.find({ packageId: req.params.id });
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await Package.findByIdAndUpdate(req.params.id, {
    rating: Math.round(avgRating * 10) / 10,
    reviewsCount: reviews.length,
  });

  return res.status(201).json(new ApiResponse(201, "Review added", review));
});

const getPackageReviews = catchAsync(async (req, res) => {
  const reviews = await PackageReview.find({ packageId: req.params.id })
    .sort({ createdAt: -1 })
    .limit(50);
  return res.status(200).json(new ApiResponse(200, "Reviews fetched", reviews));
});

module.exports = {
  createPackage,
  getLabPackages,
  updatePackage,
  deletePackage,
  getPendingPackages,
  approvePackage,
  rejectPackage,
  getApprovedPackages,
  getPackageById,
  createPackageBooking,
  addPackageReview,
  getPackageReviews,
};
