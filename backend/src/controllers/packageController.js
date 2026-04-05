const mongoose = require("mongoose");
const Package = require("../models/Package");
const PackageReview = require("../models/PackageReview");
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

  const packages = await Package.find({ labId: labProfile._id }).sort({
    createdAt: -1,
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
  const packages = await Package.find({ status }).sort({ createdAt: -1 });
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

  return res
    .status(200)
    .json(
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

  // Build signed brochure URL if Cloudinary
  let brochureUrl = pkg.brochure;
  if (brochureUrl && brochureUrl.includes("res.cloudinary.com")) {
    try {
      const parts = brochureUrl.match(
        /res\.cloudinary\.com\/[^/]+\/(raw|image|video|auto)\/(upload|authenticated|private)\/(?:v\d+\/)?(.+)$/,
      );
      if (parts) {
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;
        brochureUrl =
          cloudinary.utils.private_download_url(parts[3], "pdf", {
            resource_type: parts[1] === "auto" ? "raw" : parts[1],
            type: parts[2],
            expires_at: expiresAt,
            attachment: false,
          }) || brochureUrl;
      }
    } catch (_) {}
  }

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
  addPackageReview,
  getPackageReviews,
};
