const express = require("express");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  doctorSignupRequest,
  getDoctors,
  getDoctorById,
  getDoctorReviews,
  toggleDoctorLike,
  getMyDoctorLikes,
  updateDoctorProfile,
  getDoctorAppointments,
  getDoctorSubscription,
} = require("../controllers/doctorController");
const {
  doctorSignupRequestSchema,
  updateDoctorProfileSchema,
} = require("../validators/doctorValidators");

const router = express.Router();

router.get("/", getDoctors);
router.get("/likes/my", protectRoute, getMyDoctorLikes);
router.get("/:id", getDoctorById);
router.get("/:id/reviews", getDoctorReviews);
router.post("/:id/like", protectRoute, toggleDoctorLike);
router.post(
  "/signup-request",
  validate(doctorSignupRequestSchema),
  doctorSignupRequest,
);
router.put(
  "/profile",
  protectRoute,
  authorizeRoles("doctor"),
  validate(updateDoctorProfileSchema),
  updateDoctorProfile,
);
router.get(
  "/appointments",
  protectRoute,
  authorizeRoles("doctor"),
  getDoctorAppointments,
);
router.get(
  "/appointments/me",
  protectRoute,
  authorizeRoles("doctor"),
  getDoctorAppointments,
);
router.get(
  "/subscription/:id",
  protectRoute,
  authorizeRoles("doctor", "admin"),
  getDoctorSubscription,
);

module.exports = router;
