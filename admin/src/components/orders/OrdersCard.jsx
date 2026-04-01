import StatusBadge from "../bookings/StatusBadge";
import StatusDropdown from "./StatusDropdown";

function typeBadge(type) {
  return type === "home_collection"
    ? "bg-teal-100 text-teal-700"
    : "bg-blue-100 text-blue-700";
}

export default function OrdersCard({
  order,
  statusOptions,
  onStatusChange,
  updating,
}) {
  const tests = (order.tests || [])
    .map((item) => item?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">
          #{String(order._id || "").slice(-8)}
        </p>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Patient:</span>{" "}
          {order.patient?.name || "Patient"}
        </p>
        <p>
          <span className="font-semibold">Tests:</span>{" "}
          {tests || order.labTest?.name || "Lab Test"}
        </p>
        <p>
          <span className="font-semibold">Time:</span> {order.timeSlot || "-"}
        </p>
        <p>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${typeBadge(order.bookingType)}`}
          >
            {order.bookingType === "home_collection"
              ? "Home Collection"
              : "Lab Visit"}
          </span>
        </p>
        {order.bookingType === "home_collection" ? (
          <p className="text-xs text-slate-500">
            {order.address?.flat || ""} {order.address?.street || ""}{" "}
            {order.address?.city || ""} {order.address?.pincode || ""}
          </p>
        ) : (
          <p className="text-xs text-slate-500">Lab Visit</p>
        )}
      </div>

      <div className="mt-3">
        <StatusDropdown
          value={order.status}
          options={statusOptions}
          onChange={(next) => onStatusChange(order, next)}
          disabled={updating}
        />
      </div>
    </article>
  );
}
