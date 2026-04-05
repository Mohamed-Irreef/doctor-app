const express = require("express");
const multer = require("multer");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const {
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
} = require("../controllers/packageController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
const packageUpload = upload.fields([
  { name: "packageImageFile", maxCount: 1 },
  { name: "brochureFile", maxCount: 1 },
  { name: "thumbnailFile", maxCount: 1 },
]);

// Lab admin
router.get(
  "/partner/lab/packages",
  protectRoute,
  authorizeRoles("lab_admin"),
  getLabPackages,
);
router.post(
  "/partner/lab/packages",
  protectRoute,
  authorizeRoles("lab_admin"),
  packageUpload,
  createPackage,
);
router.put(
  "/partner/lab/packages/:id",
  protectRoute,
  authorizeRoles("lab_admin"),
  packageUpload,
  updatePackage,
);
router.delete(
  "/partner/lab/packages/:id",
  protectRoute,
  authorizeRoles("lab_admin"),
  deletePackage,
);

// Admin approval
router.get(
  "/admin/packages",
  protectRoute,
  authorizeRoles("admin"),
  getPendingPackages,
);
router.patch(
  "/admin/packages/:id/approve",
  protectRoute,
  authorizeRoles("admin"),
  approvePackage,
);
router.patch(
  "/admin/packages/:id/reject",
  protectRoute,
  authorizeRoles("admin"),
  rejectPackage,
);

// Patient
router.get("/packages", getApprovedPackages);
router.get("/packages/:id", getPackageById);
router.post(
  "/packages/:id/bookings",
  protectRoute,
  authorizeRoles("patient"),
  createPackageBooking,
);
router.post(
  "/packages/:id/reviews",
  protectRoute,
  authorizeRoles("patient"),
  addPackageReview,
);
router.get("/packages/:id/reviews", getPackageReviews);

module.exports = router;
