import Modal from "../Modal";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailsModal({ order, isOpen, onClose }) {
  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Order Details"
      className="max-w-3xl"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Order Info
          </p>
          <p className="mt-2">
            <span className="font-semibold">Order ID:</span> #
            {String(order.orderId || order._id || "").slice(-8)}
          </p>
          <p>
            <span className="font-semibold">Customer:</span>{" "}
            {order.customer?.name || "Patient"}
          </p>
          <p>
            <span className="font-semibold">Contact:</span>{" "}
            {order.customer?.phone || "Not available"}
          </p>
          <p>
            <span className="font-semibold">Order Date:</span>{" "}
            {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Payment Info
          </p>
          <p className="mt-2">
            <span className="font-semibold">Total Amount:</span>{" "}
            {formatCurrency(order.totalAmount)}
          </p>
          <p>
            <span className="font-semibold">Payment Status:</span>{" "}
            {String(order.paymentStatus || "pending").toUpperCase()}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          Products List
        </p>
        <div className="mt-2 space-y-2">
          {(order.items || []).map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <p className="font-semibold text-slate-800">{item.name}</p>
              <p className="text-slate-500">
                Qty {item.quantity} x {formatCurrency(item.price)}
              </p>
              <p className="font-semibold text-slate-700">
                {formatCurrency(item.total)}
              </p>
            </div>
          ))}
          {!order.items?.length ? (
            <p className="text-sm text-slate-500">No products found.</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          Address Details
        </p>
        <p className="mt-2">
          <span className="font-semibold">Flat / House:</span>{" "}
          {order.address?.flat || "-"}
        </p>
        <p>
          <span className="font-semibold">Street:</span>{" "}
          {order.address?.street || "-"}
        </p>
        <p>
          <span className="font-semibold">Landmark:</span>{" "}
          {order.address?.landmark || "-"}
        </p>
        <p>
          <span className="font-semibold">City:</span>{" "}
          {order.address?.city || "-"}
        </p>
        <p>
          <span className="font-semibold">Pincode:</span>{" "}
          {order.address?.pincode || "-"}
        </p>
      </div>
    </Modal>
  );
}
