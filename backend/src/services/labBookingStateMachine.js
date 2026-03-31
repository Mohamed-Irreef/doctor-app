const ApiError = require("../utils/ApiError");

const STATUS_ALIASES = {
  booked: "booked",
  sample_collected: "sample-collected",
  "sample-collected": "sample-collected",
  report_ready: "report-ready",
  "report-ready": "report-ready",
  completed: "completed",
  cancelled: "cancelled",
};

const LAB_BOOKING_TRANSITIONS = {
  booked: ["sample-collected", "cancelled"],
  "sample-collected": ["report-ready", "cancelled"],
  "report-ready": ["completed"],
  completed: [],
  cancelled: [],
};

function normalizeLabBookingStatus(status, fallback = "booked") {
  if (!status) return fallback;
  return STATUS_ALIASES[String(status).trim().toLowerCase()] || fallback;
}

function getAllowedLabBookingTransitions(status) {
  const normalized = normalizeLabBookingStatus(status);
  return LAB_BOOKING_TRANSITIONS[normalized] || [];
}

function assertValidLabBookingTransition(currentStatus, nextStatus) {
  const current = normalizeLabBookingStatus(currentStatus);
  const next = normalizeLabBookingStatus(nextStatus, current);

  if (current === next) {
    return { current, next, changed: false };
  }

  const allowed = getAllowedLabBookingTransitions(current);
  if (!allowed.includes(next)) {
    throw new ApiError(
      400,
      `Invalid status transition from ${current} to ${next}`,
    );
  }

  return { current, next, changed: true };
}

function transitionLabBooking({
  booking,
  nextStatus,
  reportUrl,
  note,
  actorLabel = "lab admin",
}) {
  if (!booking) {
    throw new ApiError(400, "Booking is required");
  }

  const { current, next, changed } = assertValidLabBookingTransition(
    booking.status,
    nextStatus,
  );

  if (next === "report-ready" && !reportUrl && !booking.reportUrl) {
    throw new ApiError(400, "Report URL is required when marking report-ready");
  }

  booking.status = next;
  if (reportUrl) {
    booking.reportUrl = reportUrl;
    booking.reportUploadedAt = new Date();
  }

  if (changed || reportUrl || note) {
    booking.statusTimeline = [
      ...(booking.statusTimeline || []),
      {
        status: next,
        note: note || `Updated by ${actorLabel} to ${next}`,
        at: new Date(),
      },
    ];
  }

  return { current, next, changed };
}

module.exports = {
  LAB_BOOKING_TRANSITIONS,
  normalizeLabBookingStatus,
  getAllowedLabBookingTransitions,
  assertValidLabBookingTransition,
  transitionLabBooking,
};
