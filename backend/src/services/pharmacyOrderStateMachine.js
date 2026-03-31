const ApiError = require("../utils/ApiError");

const STATUS_ALIASES = {
  ordered: "placed",
  place: "placed",
  confirm: "confirmed",
  packedup: "packed",
  ship: "shipped",
  complete: "delivered",
};

const FINAL_STATES = new Set(["delivered", "cancelled"]);

const ALLOWED_TRANSITIONS = {
  placed: new Set(["confirmed", "cancelled"]),
  confirmed: new Set(["packed", "cancelled"]),
  packed: new Set(["shipped", "cancelled"]),
  shipped: new Set(["delivered"]),
  delivered: new Set([]),
  cancelled: new Set([]),
};

function normalizePharmacyOrderStatus(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");

  if (STATUS_ALIASES[normalized]) return STATUS_ALIASES[normalized];
  return normalized;
}

function transitionPharmacyOrder({
  order,
  nextStatus,
  note,
  actorLabel = "system",
}) {
  const current = normalizePharmacyOrderStatus(order.status || "placed");
  const target = normalizePharmacyOrderStatus(nextStatus);

  if (!ALLOWED_TRANSITIONS[current]) {
    throw new ApiError(400, `Invalid current order status: ${current}`);
  }

  if (target === current) {
    return { previous: current, next: current, unchanged: true };
  }

  if (!ALLOWED_TRANSITIONS[current].has(target)) {
    throw new ApiError(400, `Cannot move order from ${current} to ${target}`);
  }

  order.status = target;
  order.statusTimeline = order.statusTimeline || [];
  order.statusTimeline.push({
    status: target,
    note: note || `Order moved to ${target} by ${actorLabel}`,
    at: new Date(),
  });

  if (FINAL_STATES.has(target) && !order.closedAt) {
    order.closedAt = new Date();
  }

  return { previous: current, next: target, unchanged: false };
}

module.exports = {
  normalizePharmacyOrderStatus,
  transitionPharmacyOrder,
  ALLOWED_TRANSITIONS,
};
