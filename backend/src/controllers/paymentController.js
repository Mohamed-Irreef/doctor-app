const Payment = require("../models/Payment");
const Appointment = require("../models/Appointment");
const LabBooking = require("../models/LabBooking");
const Order = require("../models/Order");
const Subscription = require("../models/Subscription");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
} = require("../services/paymentService");
const { calculateCommission } = require("../services/commissionService");
const { sendPaymentReceiptEmail } = require("../services/emailService");

async function resolvePaymentTarget(type, relatedId, user) {
  if (type === "appointment") {
    const appointment = await Appointment.findById(relatedId);
    if (!appointment) throw new ApiError(404, "Appointment not found");
    if (
      String(appointment.patient) !== String(user._id) &&
      user.role !== "admin"
    )
      throw new ApiError(403, "Not allowed");
    return { amount: appointment.fee, model: "Appointment", doc: appointment };
  }

  if (type === "lab") {
    const booking = await LabBooking.findById(relatedId);
    if (!booking) throw new ApiError(404, "Lab booking not found");
    if (String(booking.patient) !== String(user._id) && user.role !== "admin")
      throw new ApiError(403, "Not allowed");
    return { amount: booking.amount, model: "LabBooking", doc: booking };
  }

  if (type === "pharmacy") {
    const order = await Order.findById(relatedId);
    if (!order) throw new ApiError(404, "Order not found");
    if (String(order.user) !== String(user._id) && user.role !== "admin")
      throw new ApiError(403, "Not allowed");
    return { amount: order.amount, model: "Order", doc: order };
  }

  if (type === "subscription") {
    const sub = await Subscription.findById(relatedId);
    if (!sub) throw new ApiError(404, "Subscription not found");
    if (String(sub.doctor) !== String(user._id) && user.role !== "admin")
      throw new ApiError(403, "Not allowed");
    return { amount: sub.price, model: "Subscription", doc: sub };
  }

  throw new ApiError(400, "Unsupported payment type");
}

const createPaymentOrder = catchAsync(async (req, res) => {
  const target = await resolvePaymentTarget(
    req.body.type,
    req.body.relatedId,
    req.user,
  );

  const commission =
    req.body.type === "subscription"
      ? { percent: 100, commissionAmount: target.amount }
      : await calculateCommission(req.body.type, target.amount);

  const razorOrder = await createRazorpayOrder({
    amount: target.amount,
    receipt: `${req.body.type}_${target.doc._id}`,
    notes: { type: req.body.type, relatedId: String(target.doc._id) },
  });

  const payment = await Payment.create({
    user: req.user._id,
    type: req.body.type,
    amount: target.amount,
    commissionAmount: commission.commissionAmount,
    platformFee: commission.commissionAmount,
    status: "created",
    razorpayOrderId: razorOrder.id,
    relatedModel: target.model,
    relatedId: target.doc._id,
  });

  return res.status(201).json(
    new ApiResponse(201, "Razorpay order created", {
      paymentId: payment._id,
      orderId: razorOrder.id,
      amount: target.amount,
      currency: razorOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    }),
  );
});

const verifyPayment = catchAsync(async (req, res) => {
  const payment = await Payment.findById(req.body.paymentId);
  if (!payment) throw new ApiError(404, "Payment record not found");

  if (payment.razorpayOrderId !== req.body.razorpayOrderId) {
    throw new ApiError(400, "Order mismatch");
  }

  const ok = verifyRazorpaySignature({
    orderId: req.body.razorpayOrderId,
    paymentId: req.body.razorpayPaymentId,
    signature: req.body.razorpaySignature,
  });

  if (!ok) throw new ApiError(400, "Invalid payment signature");

  payment.status = "paid";
  payment.razorpayPaymentId = req.body.razorpayPaymentId;
  payment.razorpaySignature = req.body.razorpaySignature;
  payment.paidAt = new Date();
  await payment.save();

  if (payment.relatedModel === "Appointment") {
    await Appointment.findByIdAndUpdate(payment.relatedId, {
      status: "upcoming",
      payment: payment._id,
    });
  } else if (payment.relatedModel === "LabBooking") {
    await LabBooking.findByIdAndUpdate(payment.relatedId, {
      payment: payment._id,
    });
  } else if (payment.relatedModel === "Order") {
    await Order.findByIdAndUpdate(payment.relatedId, { payment: payment._id });
  } else if (payment.relatedModel === "Subscription") {
    await Subscription.findByIdAndUpdate(payment.relatedId, {
      status: "active",
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpayOrderId: payment.razorpayOrderId,
    });
  }

  await sendPaymentReceiptEmail(req.user.email, req.user.name, payment);

  return res
    .status(200)
    .json(new ApiResponse(200, "Payment verified", payment));
});

module.exports = {
  createPaymentOrder,
  verifyPayment,
};
