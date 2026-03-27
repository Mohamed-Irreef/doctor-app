const dayjs = require("dayjs");
const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
} = require("../services/paymentService");

const createSubscriptionOrder = catchAsync(async (req, res) => {
  const plan = await Plan.findOne({
    code: req.body.planCode.toUpperCase(),
    isActive: true,
  });
  if (!plan) throw new ApiError(404, "Plan not found");

  const startDate = dayjs().toDate();
  const endDate = dayjs(startDate)
    .add(plan.interval === "yearly" ? 12 : 1, "month")
    .toDate();

  const subscription = await Subscription.create({
    doctor: req.user._id,
    plan: plan._id,
    price: plan.price,
    startDate,
    endDate,
    status: "pending",
  });

  const razorOrder = await createRazorpayOrder({
    amount: plan.price,
    receipt: `sub_${subscription._id}`,
    notes: { type: "subscription", relatedId: String(subscription._id) },
  });

  subscription.razorpayOrderId = razorOrder.id;
  await subscription.save();

  return res.status(201).json(
    new ApiResponse(201, "Subscription order created", {
      subscriptionId: subscription._id,
      orderId: razorOrder.id,
      amount: plan.price,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
    }),
  );
});

const verifySubscriptionPayment = catchAsync(async (req, res) => {
  const subscription = await Subscription.findById(
    req.body.subscriptionId,
  ).populate("plan");
  if (!subscription) throw new ApiError(404, "Subscription not found");

  const ok = verifyRazorpaySignature({
    orderId: req.body.razorpayOrderId,
    paymentId: req.body.razorpayPaymentId,
    signature: req.body.razorpaySignature,
  });
  if (!ok) throw new ApiError(400, "Invalid payment signature");

  subscription.status = "active";
  subscription.razorpayPaymentId = req.body.razorpayPaymentId;
  await subscription.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Subscription activated", subscription));
});

const getDoctorSubscription = catchAsync(async (req, res) => {
  const subscription = await Subscription.findOne({ doctor: req.params.id })
    .populate("plan")
    .sort({ createdAt: -1 })
    .lean();
  if (!subscription) throw new ApiError(404, "No subscription found");
  return res
    .status(200)
    .json(new ApiResponse(200, "Subscription fetched", subscription));
});

const cancelSubscription = catchAsync(async (req, res) => {
  const subscription = await Subscription.findOne({
    doctor: req.user._id,
    status: "active",
  }).sort({ createdAt: -1 });
  if (!subscription) throw new ApiError(404, "Active subscription not found");

  subscription.status = "cancelled";
  await subscription.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Subscription cancelled", subscription));
});

module.exports = {
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getDoctorSubscription,
  cancelSubscription,
};
