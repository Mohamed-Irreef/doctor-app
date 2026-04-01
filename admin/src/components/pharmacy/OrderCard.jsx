import { CalendarClock, Eye } from "lucide-react";
import { memo } from "react";
import StatusBadge from "./StatusBadge";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function OrderCard({ order, onView, onApprove, onReject, loading }) {
  const isPending = String(order.status).toLowerCase() === "pending";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Order ID
          </p>
          <p className="mt-1 text-base font-black text-slate-900">
            #{String(order.orderId || order._id || "").slice(-8)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Customer
          </p>
          <p className="mt-1 font-semibold text-slate-800">
            {order.customer?.name || "Patient"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">
            Amount
          </p>
          <p className="mt-1 font-semibold text-[#14B8A6]">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>
      </div>

      <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
        <CalendarClock size={14} /> Ordered: {formatDate(order.createdAt)}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <button
          type="button"
          onClick={() => onView(order)}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <Eye size={14} className="mr-2" /> View
        </button>
        <button
          type="button"
          onClick={() => onApprove(order)}
          disabled={loading || !isPending}
          className="h-10 rounded-xl bg-[#2563EB] px-4 text-sm font-bold text-white transition hover:bg-[#1D4ED8] disabled:opacity-60"
        >
          {loading ? "Approving..." : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => onReject(order)}
          disabled={loading || !isPending}
          className="h-10 rounded-xl bg-[#EF4444] px-4 text-sm font-bold text-white transition hover:bg-[#DC2626] disabled:opacity-60"
        >
          {loading ? "Rejecting..." : "Reject"}
        </button>
      </div>
    </article>
  );
}

export default memo(OrderCard);
