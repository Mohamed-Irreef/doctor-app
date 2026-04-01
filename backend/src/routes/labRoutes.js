const express = require("express");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  getLabs,
  getLabById,
  getLabSlotAvailability,
  holdLabSlot,
  releaseLabSlotHold,
  getLabVisitQuote,
  bookLab,
  getMyLabBookings,
  getLabReviews,
  addLabReview,
} = require("../controllers/labController");
const {
  bookLabSchema,
  holdLabSlotSchema,
} = require("../validators/businessValidators");

const router = express.Router();

router.get("/", getLabs);
router.get(
  "/bookings/me",
  protectRoute,
  authorizeRoles("patient"),
  getMyLabBookings,
);
router.get(
  "/:id/slots",
  protectRoute,
  authorizeRoles("patient"),
  getLabSlotAvailability,
);
router.post(
  "/:id/slots/hold",
  protectRoute,
  authorizeRoles("patient"),
  validate(holdLabSlotSchema),
  holdLabSlot,
);
router.post(
  "/slots/hold/:holdId/release",
  protectRoute,
  authorizeRoles("patient"),
  releaseLabSlotHold,
);
router.get(
  "/:id/visit-quote",
  protectRoute,
  authorizeRoles("patient"),
  getLabVisitQuote,
);
router.get("/:id", getLabById);
router.get("/:id/reviews", getLabReviews);
router.post(
  "/:id/reviews",
  protectRoute,
  authorizeRoles("patient"),
  addLabReview,
);
router.post(
  "/book",
  protectRoute,
  authorizeRoles("patient"),
  validate(bookLabSchema),
  bookLab,
);

module.exports = router;
