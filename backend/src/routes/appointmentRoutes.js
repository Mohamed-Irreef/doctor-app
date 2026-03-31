const express = require("express");
const validate = require("../middlewares/validate");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  releasePendingAppointment,
  getConsultationAccess,
  submitPrescription,
  verifyAppointmentRevenue,
} = require("../controllers/appointmentController");
const {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
  releasePendingAppointmentSchema,
  submitPrescriptionSchema,
  verifyAppointmentRevenueSchema,
} = require("../validators/businessValidators");

const router = express.Router();

router.post(
  "/",
  protectRoute,
  authorizeRoles("patient"),
  validate(createAppointmentSchema),
  createAppointment,
);
router.get(
  "/patient",
  protectRoute,
  authorizeRoles("patient"),
  getPatientAppointments,
);
router.get(
  "/doctor",
  protectRoute,
  authorizeRoles("doctor"),
  getDoctorAppointments,
);
router.put(
  "/:id/status",
  protectRoute,
  validate(updateAppointmentStatusSchema),
  updateAppointmentStatus,
);
router.put(
  "/:id/reschedule",
  protectRoute,
  validate(rescheduleAppointmentSchema),
  rescheduleAppointment,
);
router.post(
  "/:id/release",
  protectRoute,
  authorizeRoles("patient", "admin"),
  validate(releasePendingAppointmentSchema),
  releasePendingAppointment,
);
router.get("/:id/video-access", protectRoute, getConsultationAccess);
router.post(
  "/:id/prescription",
  protectRoute,
  authorizeRoles("doctor", "admin"),
  validate(submitPrescriptionSchema),
  submitPrescription,
);
router.post(
  "/:id/revenue-verify",
  protectRoute,
  authorizeRoles("admin"),
  validate(verifyAppointmentRevenueSchema),
  verifyAppointmentRevenue,
);

module.exports = router;
