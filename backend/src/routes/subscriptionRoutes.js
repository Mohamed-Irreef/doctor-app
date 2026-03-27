const express = require("express");
const { protectRoute, authorizeRoles } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getDoctorSubscription,
  cancelSubscription,
} = require("../controllers/subscriptionController");
const {
  createPlanPaymentOrderSchema,
} = require("../validators/businessValidators");

const router = express.Router();

router.post(
  "/create-order",
  protectRoute,
  authorizeRoles("doctor"),
  validate(createPlanPaymentOrderSchema),
  createSubscriptionOrder,
);
router.post(
  "/verify-payment",
  protectRoute,
  authorizeRoles("doctor"),
  verifySubscriptionPayment,
);
router.get(
  "/doctor/:id",
  protectRoute,
  authorizeRoles("doctor", "admin"),
  getDoctorSubscription,
);
router.post(
  "/cancel",
  protectRoute,
  authorizeRoles("doctor"),
  cancelSubscription,
);

module.exports = router;
