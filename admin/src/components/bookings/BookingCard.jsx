import { ClipboardList, FlaskConical, User } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function BookingCard({
  booking,
  onViewTest,
  onViewOrder,
  onApprove,
  onReject,
  busy,
}) {
  const tests = Array.isArray(booking.tests) ? booking.tests : [];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Booking ID
          </p>
          <p className="text-sm font-bold text-slate-900">
            #{String(booking._id || "").slice(-8)}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-3 space-y-2 text-sm text-slate-700">
        <p className="flex items-center gap-2">
          <User size={14} /> {booking.patient?.name || "Patient"}
        </p>
        <p className="flex items-center gap-2">
          <FlaskConical size={14} />{" "}
          {tests
            .map((t) => t?.name)
            .filter(Boolean)
            .join(", ") ||
            booking.labTest?.name ||
            "Lab Test"}
        </p>
        <p className="flex items-center gap-2">
          <ClipboardList size={14} />{" "}
          {booking.date ? new Date(booking.date).toLocaleDateString() : "-"}{" "}
          {booking.timeSlot ? `· ${booking.timeSlot}` : ""}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onViewTest}
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
        >
          View Test
        </button>
        <button
          type="button"
          onClick={onViewOrder}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          View Order
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="rounded-lg bg-[#22C55E] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={busy}
          className="rounded-lg bg-[#EF4444] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          Reject
        </button>
      </div>
    </article>
  );
}
