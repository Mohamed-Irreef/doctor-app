const express = require("express");
const validate = require("../middlewares/validate");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
} = require("../controllers/appointmentController");
const {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
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

module.exports = router;
