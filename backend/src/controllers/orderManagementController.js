const Order = require("../models/Order");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { logAuditEvent } = require("../services/auditLogService");
const {
  transitionPharmacyOrder,
  normalizePharmacyOrderStatus,
} = require("../services/pharmacyOrderStateMachine");

const CLIENT_TO_INTERNAL = {
  pending: "placed",
  approved: "confirmed",
  rejected: "cancelled",
  packing: "packed",
  shipping: "shipped",
  delivered: "delivered",
  placed: "placed",
  confirmed: "confirmed",
  packed: "packed",
  shipped: "shipped",
  cancelled: "cancelled",
};

function toInternalStatus(status) {
  const normalized = normalizePharmacyOrderStatus(status);
  return CLIENT_TO_INTERNAL[normalized] || normalized;
}

function toClientStatus(status) {
  const normalized = normalizePharmacyOrderStatus(status);
  if (normalized === "placed") return "pending";
  if (normalized === "confirmed") return "approved";
  if (normalized === "cancelled") return "rejected";
  if (normalized === "packed") return "packing";
  if (normalized === "shipped") return "shipping";
  return normalized;
}

function mapOrder(order) {
  const items = Array.isArray(order.items)
    ? order.items.map((item) => ({
        name: item.name,
        quantity: Number(item.quantity || 0),
        price: Number(item.unitPrice || 0),
        total: Number(item.quantity || 0) * Number(item.unitPrice || 0),
      }))
    : [];

  return {
    _id: order._id,
    orderId: order._id,
    customer: {
      name: order.user?.name || "Patient",
      email: order.user?.email || "",
      phone: order.user?.phone || order.deliveryContactPhone || "",
    },
    items,
    productsSummary: items
      .slice(0, 2)
      .map((item) => item.name)
      .join(", "),
    address: {
      flat: "",
      street: order.deliveryAddress || "",
      landmark: "",
      city: "",
      pincode: "",
    },
    totalAmount: Number(order.amount || 0),
    paymentStatus: order.paymentStatus || "pending",
    status: toClientStatus(order.status),
    createdAt: order.createdAt,
    trackingId: order.trackingId || "",
  };
}

function paginate(items, page, limit) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    pagination: {
      page: safePage,
      limit,
      totalItems,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    },
  };
}

function scopeOrdersToUser(orders, user) {
  if (user?.role === "admin") return orders;

  if (user?.role !== "pharmacy_admin") {
    throw new ApiError(403, "Not allowed");
  }

  return orders.filter((order) =>
    order.items.some(
      (item) => String(item.medicine?.owner || "") === String(user._id),
    ),
  );
}

const listOrders = catchAsync(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const requestedStatus = req.query.status
    ? toInternalStatus(req.query.status)
    : null;
  const trackingOnly = String(req.query.trackingOnly || "false") === "true";

  const orders = await Order.find({})
    .populate("items.medicine", "owner")
    .populate("user", "name email phone")
    .sort({ createdAt: -1 })
    .lean();

  const scoped = scopeOrdersToUser(orders, req.user);

  const filtered = scoped.filter((order) => {
    const current = toInternalStatus(order.status);

    if (requestedStatus && current !== requestedStatus) {
      return false;
    }

    if (
      trackingOnly &&
      !["confirmed", "packed", "shipped", "delivered"].includes(current)
    ) {
      return false;
    }

    return true;
  });

  const mapped = filtered.map(mapOrder);
  const result = paginate(mapped, page, limit);

  return res.status(200).json(new ApiResponse(200, "Orders fetched", result));
});

const applyOrderTransition = async ({ req, res, nextStatus, note }) => {
  const order = await Order.findById(req.params.id)
    .populate("items.medicine", "owner")
    .populate("user", "name email phone");

  if (!order) throw new ApiError(404, "Order not found");

  scopeOrdersToUser([order], req.user);

  const previousStatus = order.status;

  const { next } = transitionPharmacyOrder({
    order,
    nextStatus,
    note,
    actorLabel: req.user?.role || "pharmacy_admin",
  });

  if (next === "shipped") order.shippedAt = new Date();
  if (next === "delivered") order.deliveredAt = new Date();
  if (next === "cancelled") order.cancelledAt = new Date();

  await order.save();

  await logAuditEvent({
    entityType: "order",
    entityId: order._id,
    action: "v1_order_status_changed",
    performedBy: req.user?._id,
    performedByRole: req.user?.role,
    metadata: {
      previousStatus,
      nextStatus: next,
      note: note || null,
    },
  });

  await Notification.create({
    title: `Order ${toClientStatus(next)}`,
    message: `Your medicine order status is now ${toClientStatus(next)}.`,
    type: `pharmacy-${next}`,
    audienceType: "single",
    recipient: order.user?._id,
    targetEntityType: "Order",
    targetEntityId: order._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Order updated", mapOrder(order)));
};

const approveOrder = catchAsync(async (req, res) => {
  return applyOrderTransition({
    req,
    res,
    nextStatus: "confirmed",
    note: "Order approved",
  });
});

const rejectOrder = catchAsync(async (req, res) => {
  return applyOrderTransition({
    req,
    res,
    nextStatus: "cancelled",
    note: "Order rejected",
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const nextStatus = toInternalStatus(req.body.status);
  return applyOrderTransition({
    req,
    res,
    nextStatus,
    note: req.body.note || `Order moved to ${req.body.status}`,
  });
});

module.exports = {
  listOrders,
  approveOrder,
  rejectOrder,
  updateOrderStatus,
};
