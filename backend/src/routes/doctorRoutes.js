const express = require("express");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  doctorSignupRequest,
  getDoctors,
  getDoctorById,
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
router.get("/:id", getDoctorById);
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
