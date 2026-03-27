const Razorpay = require("razorpay");
const env = require("./env");

let razorpay = null;

function getRazorpay() {
  if (razorpay) return razorpay;
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }

  razorpay = new Razorpay({
    key_id: env.razorpay.keyId,
    key_secret: env.razorpay.keySecret,
  });

  return razorpay;
}

module.exports = { getRazorpay };
