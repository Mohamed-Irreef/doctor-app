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

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
};
