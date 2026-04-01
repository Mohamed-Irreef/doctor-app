const express = require("express");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  getLabBookings,
  updateLabBookingStatus,
  approveLabBooking,
  rejectLabBooking,
} = require("../controllers/partnerController");
const {
  updateLabBookingStatusSchema,
} = require("../validators/ecosystemValidators");

const router = express.Router();

router.get("/", protectRoute, authorizeRoles("lab_admin"), getLabBookings);
router.put(
  "/:id/status",
  protectRoute,
  authorizeRoles("lab_admin"),
  validate(updateLabBookingStatusSchema),
  updateLabBookingStatus,
);
router.put(
  "/:id/approve",
  protectRoute,
  authorizeRoles("lab_admin"),
  approveLabBooking,
);
router.put(
  "/:id/reject",
  protectRoute,
  authorizeRoles("lab_admin"),
  rejectLabBooking,
);

module.exports = router;
