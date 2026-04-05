const mongoose = require("mongoose");
const Package = require("../models/Package");
const PackageReview = require("../models/PackageReview");
const LabPartnerProfile = require("../models/LabPartnerProfile");
const cloudinary = require("../config/cloudinary");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

// ─── Lab Admin ─────────────────────────────────────────────────────────────────

const createPackage = catchAsync(async (req, res) => {
  if (req.user.role !== "lab_admin") throw new ApiError(403, "Not authorized");

  const labProfile = await LabPartnerProfile.findOne({ user: req.user._id });
  if (!labProfile) throw new ApiError(404, "Lab profile not found");

  const body = JSON.parse(req.body.data || "{}");

  // Handle file uploads
  if (req.files?.packageImageFile?.[0]?.buffer) {
    const result = await uploadBufferToCloudinary(req.files.packageImageFile[0].buffer, "nividoc/packages/images");
    body.image = result?.secure_url;
  }
  if (req.files?.brochureFile?.[0]?.buffer) {
    const result = await uploadBufferToCloudinary(req.files.brochureFile[0].buffer, "nividoc/packages/brochures");
    body.brochure = result?.secure_url;
  }
  if (req.files?.thumbnailFile?.[0]?.buffer) {
    const result = await uploadBufferToCloudinary(req.files.thumbnailFile[0].buffer, "nividoc/packages/thumbnails");
    body.thumbnailImage = result?.secure_url;
  }

  // Calculate discount and final price
  const original = Number(body.price?.original || 0);
  const offer = Number(body.price?.offer || original);
  const gst = Number(body.price?.gst || 0);
  const discount = original > 0 ? Math.round(((original - offer) / original) * 100) : 0;
  const final = Math.round(offer * (1 + gst / 100));

  // Count total tests
  const testCount = (body.tests || []).reduce((sum, group) => sum + (group.tests?.length || 0), 0);

  const pkg = await Package.create({
    ...body,
    labId: labProfile._id,
    labName: labProfile.labName || labProfile.name || "Lab",
    status: body.status === "DRAFT" ? "DRAFT" : "PENDING_APPROVAL",
    price: { original, offer, discount, gst, final },
    testCount,
  });

  return res.status(201).json(new ApiResponse(201, "Package submitted for approval", pkg));
});

const getLabPackages = catchAsync(async (req, res) => {
  if (req.user.role !== "lab_admin") throw new ApiError(403, "Not authorized");
  const labProfile = await LabPartnerProfile.findOne({ user: req.user._id });
  if (!labProfile) throw new ApiError(404, "Lab profile not found");

  const packages = await Package.find({ labId: labProfile._id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, "Packages fetched", packages));
});

const updatePackage = catchAsync(async (req, res) => {
  if (req.user.role !== "lab_admin") throw new ApiError(403, "Not authorized");
  const labProfile = await LabPartnerProfile.findOne({ user: req.user._id });
  if (!labProfile) throw new ApiError(404, "Lab profile not found");

  const pkg = await Package.findOne({ _id: req.params.id, labId: labProfile._id });
  if (!pkg) throw new ApiError(404, "Package not found");

  const body = JSON.parse(req.body.data || "{}");

  if (req.files?.packageImageFile?.[0]?.buffer) {
    const result = await uploadBufferToCloudinary(req.files.packageImageFile[0].buffer, "nividoc/packages/images");
    body.image = result?.secure_url;
  }
  if (req.files?.brochureFile?.[0]?.buffer) {
    const result = await uploadBufferToCloudinary(req.files.brochureFile[0].buffer, "nividoc/packages/brochures");
    body.brochure = result?.secure_url;
  }

  const original = Number(body.price?.original || pkg.price.original);
  const offer = Number(body.price?.offer || pkg.price.offer);
  const gst = Number(body.price?.gst || pkg.price.gst);
  const discount = original > 0 ? Math.round(((original - offer) / original) * 100) : 0;
  const final = Math.round(offer * (1 + gst / 100));
  const testCount = (body.tests || pkg.tests).reduce((sum, g) => sum + (g.tests?.length || 0), 0);

  Object.assign(pkg, body, { price: { original, offer, discount, gst, final }, testCount });
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
  return res.status(200).json(new ApiResponse(200, "Packages fetched", packages));
});

const approvePackage = catchAsync(async (req, res) => {
  const pkg = await Package.findByIdAndUpdate(
    req.params.id,
    { status: "APPROVED", active: true, approvedBy: req.user._id, approvedAt: new Date() },
    { new: true }
  );
  if (!pkg) throw new ApiError(404, "Package not found");
  return res.status(200).json(new ApiResponse(200, "Package approved", pkg));
});

const rejectPackage = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const pkg = await Package.findByIdAndUpdate(
    req.params.id,
    { status: "REJECTED", approvalNote: reason || "" },
    { new: true }
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
  const [packages, total] = await Promise.all([
    Package.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Package.countDocuments(filter),
  ]);

  return res.status(200).json(new ApiResponse(200, "Packages fetched", { packages, total, page: Number(page) }));
});

const getPackageById = catchAsync(async (req, res) => {
  const pkg = await Package.findOne({ _id: req.params.id, status: "APPROVED", active: true });
  if (!pkg) throw new ApiError(404, "Package not found");

  // Build signed brochure URL if Cloudinary
  let brochureUrl = pkg.brochure;
  if (brochureUrl && brochureUrl.includes("res.cloudinary.com")) {
    try {
      const parts = brochureUrl.match(/res\.cloudinary\.com\/[^/]+\/(raw|image|video|auto)\/(upload|authenticated|private)\/(?:v\d+\/)?(.+)$/);
      if (parts) {
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;
        brochureUrl = cloudinary.utils.private_download_url(parts[3], "pdf", {
          resource_type: parts[1] === "auto" ? "raw" : parts[1],
          type: parts[2],
          expires_at: expiresAt,
          attachment: false,
        }) || brochureUrl;
      }
    } catch (_) {}
  }

  return res.status(200).json(new ApiResponse(200, "Package fetched", { ...pkg.toObject(), brochureUrl }));
});

// ─── Reviews ────────────────────────────────────────────────────────────────────

const addPackageReview = catchAsync(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new ApiError(400, "Rating must be 1-5");

  const existing = await PackageReview.findOne({ packageId: req.params.id, user: req.user._id });
  if (existing) throw new ApiError(400, "You have already reviewed this package");

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
  await Package.findByIdAndUpdate(req.params.id, { rating: Math.round(avgRating * 10) / 10, reviewsCount: reviews.length });

  return res.status(201).json(new ApiResponse(201, "Review added", review));
});

const getPackageReviews = catchAsync(async (req, res) => {
  const reviews = await PackageReview.find({ packageId: req.params.id }).sort({ createdAt: -1 }).limit(50);
  return res.status(200).json(new ApiResponse(200, "Reviews fetched", reviews));
});

module.exports = {
  createPackage, getLabPackages, updatePackage, deletePackage,
  getPendingPackages, approvePackage, rejectPackage,
  getApprovedPackages, getPackageById,
  addPackageReview, getPackageReviews,
};
