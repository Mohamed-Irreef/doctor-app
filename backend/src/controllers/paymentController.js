const Payment = require("../models/Payment");
const Appointment = require("../models/Appointment");
const Slot = require("../models/Slot");
const LabBooking = require("../models/LabBooking");
const Order = require("../models/Order");
const Subscription = require("../models/Subscription");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
  validateRazorpayPayment,
} = require("../services/paymentService");
const { calculateCommission } = require("../services/commissionService");
const {
  sendPaymentReceiptEmail,
  sendAppointmentEmail,
} = require("../services/emailService");
const {
  normalizePharmacyOrderStatus,
} = require("../services/pharmacyOrderStateMachine");
const { logError, logPayment } = require("../utils/logger");

function isTransactionUnsupportedError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("transaction numbers are only allowed") ||
    message.includes("replica set member") ||
    message.includes("mongos")
  );
}

async function resolvePaymentTarget(type, relatedId, user) {
  if (type === "appointment") {
    const appointment = await Appointment.findById(relatedId);
    if (!appointment) throw new ApiError(404, "Appointment not found");
    if (
      String(appointment.patient) !== String(user._id) &&
      user.role !== "admin"
    )
      throw new ApiError(403, "Not allowed");
    if (appointment.status === "cancelled") {
      throw new ApiError(400, "Cannot pay for a cancelled appointment");
    }
    if (appointment.paymentStatus === "paid") {
      throw new ApiError(400, "Appointment already paid");
    }
    return { amount: appointment.fee, model: "Appointment", doc: appointment };
  }

  if (type === "lab") {
    const booking = await LabBooking.findById(relatedId);
    if (!booking) throw new ApiError(404, "Lab booking not found");
    if (String(booking.patient) !== String(user._id) && user.role !== "admin")
      throw new ApiError(403, "Not allowed");

    if (booking.status === "cancelled" || booking.status === "rejected") {
      throw new ApiError(
        400,
        "Cannot pay for a cancelled/rejected lab booking",
      );
    }

    if (booking.paymentStatus === "paid") {
      throw new ApiError(400, "Lab booking already paid");
    }

    return { amount: booking.amount, model: "LabBooking", doc: booking };
  }

  if (type === "pharmacy") {
    const order = await Order.findById(relatedId);
    if (!order) throw new ApiError(404, "Order not found");
    if (String(order.user) !== String(user._id) && user.role !== "admin")
      throw new ApiError(403, "Not allowed");

    if (order.status === "cancelled") {
      throw new ApiError(400, "Cannot pay for a cancelled order");
    }

    if (order.paymentStatus === "paid") {
      throw new ApiError(400, "Order already paid");
    }

    return { amount: order.amount, model: "Order", doc: order };
  }

  if (type === "subscription") {
    const sub = await Subscription.findById(relatedId);
    if (!sub) throw new ApiError(404, "Subscription not found");
    if (String(sub.doctor) !== String(user._id) && user.role !== "admin")
      throw new ApiError(403, "Not allowed");

    if (sub.status === "active") {
      throw new ApiError(400, "Subscription is already active");
    }

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
    revenueSplit: {
      total: Number(target.amount.toFixed(2)),
      adminShare: Number(commission.commissionAmount.toFixed(2)),
      partnerShare: Number(
        (target.amount - commission.commissionAmount).toFixed(2),
      ),
      partnerSharePercent: Number((100 - commission.percent).toFixed(2)),
      adminSharePercent: Number(commission.percent.toFixed(2)),
    },
    status: "created",
    razorpayOrderId: razorOrder.id,
    relatedModel: target.model,
    relatedId: target.doc._id,
  });

  logPayment("payment_order_created", {
    paymentId: payment._id,
    relatedModel: payment.relatedModel,
    relatedId: payment.relatedId,
    type: payment.type,
    amount: payment.amount,
    userId: req.user._id,
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
  if (
    String(payment.user) !== String(req.user._id) &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Not allowed");
  }
  if (payment.status === "paid") {
    return res
      .status(200)
      .json(new ApiResponse(200, "Payment already verified", payment));
  }

  if (payment.razorpayOrderId !== req.body.razorpayOrderId) {
    throw new ApiError(400, "Order mismatch");
  }

  const ok = verifyRazorpaySignature({
    orderId: req.body.razorpayOrderId,
    paymentId: req.body.razorpayPaymentId,
    signature: req.body.razorpaySignature,
  });

  if (!ok) throw new ApiError(400, "Invalid payment signature");

  let razorpayValidated;
  try {
    razorpayValidated = await validateRazorpayPayment({
      orderId: req.body.razorpayOrderId,
      paymentId: req.body.razorpayPaymentId,
      expectedAmount: payment.amount,
    });
  } catch (_err) {
    throw new ApiError(400, "Unable to validate payment with Razorpay");
  }

  if (!razorpayValidated?.isValid) {
    throw new ApiError(400, "Razorpay payment validation failed");
  }

  const runVerification = async (session = null) => {
    const writeOptions = session ? { session } : {};
    let appointmentForNotify = null;

    const paymentQuery = Payment.findById(req.body.paymentId);
    if (session) paymentQuery.session(session);
    const paymentDoc = await paymentQuery;

    if (!paymentDoc) throw new ApiError(404, "Payment record not found");
    if (
      String(paymentDoc.user) !== String(req.user._id) &&
      req.user.role !== "admin"
    ) {
      throw new ApiError(403, "Not allowed");
    }
    if (paymentDoc.status === "paid") {
      logPayment("payment_verify_idempotent", {
        paymentId: paymentDoc._id,
        userId: req.user._id,
      });
      return { paymentDoc, appointmentForNotify, alreadyPaid: true };
    }

    paymentDoc.status = "paid";
    paymentDoc.razorpayPaymentId = req.body.razorpayPaymentId;
    paymentDoc.razorpaySignature = req.body.razorpaySignature;
    paymentDoc.paidAt = new Date();
    await paymentDoc.save(writeOptions);

    logPayment("payment_verified", {
      paymentId: paymentDoc._id,
      razorpayOrderId: paymentDoc.razorpayOrderId,
      razorpayPaymentId: paymentDoc.razorpayPaymentId,
      amount: paymentDoc.amount,
      type: paymentDoc.type,
      userId: req.user._id,
    });

    if (paymentDoc.relatedModel === "Appointment") {
      const appointment = await Appointment.findByIdAndUpdate(
        paymentDoc.relatedId,
        {
          status: "upcoming",
          paymentStatus: "paid",
          payment: paymentDoc._id,
        },
        { ...writeOptions, new: true },
      );

      if (!appointment) throw new ApiError(404, "Appointment not found");

      const slot = await Slot.findOneAndUpdate(
        {
          _id: appointment.slot,
          appointment: appointment._id,
          $or: [{ status: "blocked" }, { status: "available" }],
        },
        {
          $set: { status: "booked", appointment: appointment._id },
          $unset: { heldBy: 1, holdExpiresAt: 1 },
        },
        { ...writeOptions, new: true },
      );

      if (!slot) {
        throw new ApiError(409, "Slot could not be confirmed after payment");
      }

      appointmentForNotify = appointment;
    } else if (paymentDoc.relatedModel === "LabBooking") {
      const labBooking = await LabBooking.findByIdAndUpdate(
        paymentDoc.relatedId,
        {
          payment: paymentDoc._id,
          paymentStatus: "paid",
          $push: {
            statusTimeline: {
              status: "booked",
              note: "Payment completed and booking confirmed",
              at: new Date(),
            },
          },
        },
        { ...writeOptions, new: true },
      );

      if (labBooking) {
        await Notification.create({
          title: "Lab booking confirmed",
          message: "Payment received. Your lab booking is now confirmed.",
          type: "lab-payment-success",
          audienceType: "single",
          recipient: labBooking.patient,
          targetEntityType: "LabBooking",
          targetEntityId: labBooking._id,
        });
      }
    } else if (paymentDoc.relatedModel === "Order") {
      const order = await Order.findById(paymentDoc.relatedId);
      if (order) {
        const currentStatus = normalizePharmacyOrderStatus(order.status);
        order.payment = paymentDoc._id;
        order.paymentStatus = "paid";
        if (currentStatus === "placed") {
          order.status = "confirmed";
          order.statusTimeline = order.statusTimeline || [];
          order.statusTimeline.push({
            status: "confirmed",
            note: "Payment verified and order confirmed",
            at: new Date(),
          });
        }
        await order.save(writeOptions);

        await Notification.create({
          title: "Medicine order confirmed",
          message: "Payment successful. Your pharmacy order is now confirmed.",
          type: "pharmacy-confirmed",
          audienceType: "single",
          recipient: order.user,
          targetEntityType: "Order",
          targetEntityId: order._id,
        });
      }
    } else if (paymentDoc.relatedModel === "Subscription") {
      await Subscription.findByIdAndUpdate(
        paymentDoc.relatedId,
        {
          status: "active",
          razorpayPaymentId: paymentDoc.razorpayPaymentId,
          razorpayOrderId: paymentDoc.razorpayOrderId,
        },
        writeOptions,
      );
    }

    return { paymentDoc, appointmentForNotify, alreadyPaid: false };
  };

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await runVerification(session);
    await session.commitTransaction();

    if (result.alreadyPaid) {
      return res
        .status(200)
        .json(
          new ApiResponse(200, "Payment already verified", result.paymentDoc),
        );
    }

    if (result.appointmentForNotify) {
      await sendAppointmentEmail(req.user.email, req.user.name, {
        date: new Date(result.appointmentForNotify.date).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        ),
        time: result.appointmentForNotify.time,
      });

      await Notification.create({
        title: "Appointment booked",
        message: "A new paid appointment is confirmed",
        type: "appointment-booked",
        audienceType: "single",
        recipient: result.appointmentForNotify.doctor,
        targetEntityType: "Appointment",
        targetEntityId: result.appointmentForNotify._id,
      });
    }

    await sendPaymentReceiptEmail(
      req.user.email,
      req.user.name,
      result.paymentDoc,
    );
    return res
      .status(200)
      .json(new ApiResponse(200, "Payment verified", result.paymentDoc));
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (_ignored) {
        // Session may already be ended/invalid in fallback scenarios.
      }
    }

    if (isTransactionUnsupportedError(error)) {
      const result = await runVerification();

      if (result.alreadyPaid) {
        return res
          .status(200)
          .json(
            new ApiResponse(200, "Payment already verified", result.paymentDoc),
          );
      }

      if (result.appointmentForNotify) {
        await sendAppointmentEmail(req.user.email, req.user.name, {
          date: new Date(result.appointmentForNotify.date).toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
            },
          ),
          time: result.appointmentForNotify.time,
        });

        await Notification.create({
          title: "Appointment booked",
          message: "A new paid appointment is confirmed",
          type: "appointment-booked",
          audienceType: "single",
          recipient: result.appointmentForNotify.doctor,
          targetEntityType: "Appointment",
          targetEntityId: result.appointmentForNotify._id,
        });
      }

      await sendPaymentReceiptEmail(
        req.user.email,
        req.user.name,
        result.paymentDoc,
      );
      return res
        .status(200)
        .json(new ApiResponse(200, "Payment verified", result.paymentDoc));
    }

    logError("payment_verify_failed", error, {
      paymentId: req.body?.paymentId,
      userId: req.user?._id,
      orderId: req.body?.razorpayOrderId,
    });

    throw error;
  } finally {
    if (session) session.endSession();
  }
});

module.exports = {
  createPaymentOrder,
  verifyPayment,
};
