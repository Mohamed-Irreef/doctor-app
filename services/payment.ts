import AsyncStorage from "@react-native-async-storage/async-storage";
import RazorpayCheckout from "react-native-razorpay";
import {
    createPaymentOrder,
    createSubscriptionOrder,
    releasePendingAppointment,
    verifyPayment,
    verifySubscriptionPayment,
} from "./api";

type PaymentType = "appointment" | "lab" | "pharmacy" | "package";

type PaymentResult = {
  status: "success" | "error";
  amount?: number;
  error?: string;
};

async function verifyPaymentWithRetry(payload: {
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  let lastError = "Payment verification failed";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await verifyPayment(payload);
    if (response.status === "success") return response;
    lastError = response.error || lastError;
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 600));
    }
  }

  return { status: "error" as const, data: null, error: lastError };
}

async function getPrefill() {
  try {
    const raw = await AsyncStorage.getItem("nividoc_user");
    if (!raw) return undefined;
    const user = JSON.parse(raw);
    return {
      name: user?.name,
      email: user?.email,
      contact: user?.phone,
    };
  } catch {
    return undefined;
  }
}

export async function processEntityPayment(
  type: PaymentType,
  relatedId: string,
): Promise<PaymentResult> {
  const orderResponse = await createPaymentOrder(type, relatedId);
  if (orderResponse.status !== "success" || !orderResponse.data) {
    return {
      status: "error",
      error: orderResponse.error || "Unable to create payment order",
    };
  }

  const order = orderResponse.data as {
    paymentId: string;
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };

  const prefill = await getPrefill();

  try {
    const razorpayResult = await RazorpayCheckout.open({
      key: order.keyId,
      amount: Math.round(order.amount * 100),
      currency: order.currency || "INR",
      name: "NiviDoc",
      description: `Payment for ${type}`,
      order_id: order.orderId,
      prefill,
      theme: { color: "#2563EB" },
    });

    const verifyResponse = await verifyPaymentWithRetry({
      paymentId: order.paymentId,
      razorpayOrderId: razorpayResult.razorpay_order_id,
      razorpayPaymentId: razorpayResult.razorpay_payment_id,
      razorpaySignature: razorpayResult.razorpay_signature,
    });

    if (verifyResponse.status !== "success") {
      return {
        status: "error",
        error: verifyResponse.error || "Payment verification failed",
      };
    }

    return { status: "success", amount: order.amount };
  } catch (error: any) {
    if (type === "appointment") {
      await releasePendingAppointment(relatedId, "payment_failed");
    }
    return {
      status: "error",
      error: error?.description || error?.message || "Payment cancelled",
    };
  }
}

export async function processSubscriptionPayment(
  planCode: string,
): Promise<PaymentResult> {
  const orderResponse = await createSubscriptionOrder(planCode);
  if (orderResponse.status !== "success" || !orderResponse.data) {
    return {
      status: "error",
      error: orderResponse.error || "Unable to create subscription order",
    };
  }

  const order = orderResponse.data as {
    subscriptionId: string;
    orderId: string;
    amount: number;
    keyId: string;
  };

  const prefill = await getPrefill();

  try {
    const razorpayResult = await RazorpayCheckout.open({
      key: order.keyId,
      amount: Math.round(order.amount * 100),
      currency: "INR",
      name: "NiviDoc",
      description: `Subscription ${planCode}`,
      order_id: order.orderId,
      prefill,
      theme: { color: "#2563EB" },
    });

    const verifyResponse = await verifySubscriptionPayment({
      subscriptionId: order.subscriptionId,
      razorpayOrderId: razorpayResult.razorpay_order_id,
      razorpayPaymentId: razorpayResult.razorpay_payment_id,
      razorpaySignature: razorpayResult.razorpay_signature,
    });

    if (verifyResponse.status !== "success") {
      return {
        status: "error",
        error: verifyResponse.error || "Subscription verification failed",
      };
    }

    return { status: "success", amount: order.amount };
  } catch (error: any) {
    return {
      status: "error",
      error: error?.description || error?.message || "Payment cancelled",
    };
  }
}
