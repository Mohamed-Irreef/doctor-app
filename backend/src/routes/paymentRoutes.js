const express = require("express");
const { protectRoute } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  createPaymentOrder,
  verifyPayment,
} = require("../controllers/paymentController");
const {
  createPaymentOrderSchema,
  verifyPaymentSchema,
} = require("../validators/businessValidators");

const router = express.Router();

router.post(
  "/create-order",
  protectRoute,
  validate(createPaymentOrderSchema),
  createPaymentOrder,
);
router.post(
  "/verify",
  protectRoute,
  validate(verifyPaymentSchema),
  verifyPayment,
);

module.exports = router;
