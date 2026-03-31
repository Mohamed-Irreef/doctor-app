const crypto = require("crypto");
const { getRazorpay } = require("../config/razorpay");
const env = require("../config/env");

async function createRazorpayOrder({ amount, receipt, notes = {} }) {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt,
    notes,
  });
  return order;
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const generated = crypto
    .createHmac("sha256", env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return generated === signature;
}

async function validateRazorpayPayment({ orderId, paymentId, expectedAmount }) {
  const razorpay = getRazorpay();
  const payment = await razorpay.payments.fetch(paymentId);
  const expectedPaise = Math.round(expectedAmount * 100);

  const isValid =
    Boolean(payment) &&
    payment.order_id === orderId &&
    ["captured", "authorized"].includes(payment.status) &&
    Number(payment.amount) === expectedPaise;

  return { isValid, payment };
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  validateRazorpayPayment,
};
