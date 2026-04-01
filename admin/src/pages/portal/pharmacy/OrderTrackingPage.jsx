import { useCallback, useEffect, useMemo, useState } from "react";
import Toast from "../../../components/Toast";
import StatusBadge from "../../../components/pharmacy/StatusBadge";
import StatusDropdown from "../../../components/pharmacy/StatusDropdown";
import {
    getPharmacyOrdersV1,
    updatePharmacyOrderV1Status,
} from "../../../services/api";
import { EmptyState, ErrorState } from "./UiKit";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PharmacyOrderTrackingRoutePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info" });

  const loadTrackingOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    const response = await getPharmacyOrdersV1({
      page: 1,
      limit: 20,
      trackingOnly: true,
    });

    if (response.status === "error") {
      setError(response.error || "Unable to load tracking orders");
      setOrders([]);
      setLoading(false);
      return;
    }

    setOrders(response.data?.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTrackingOrders();
  }, [loadTrackingOrders]);

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = window.setTimeout(
      () => setToast({ message: "", type: "info" }),
      2200,
    );
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateStatus = useCallback(
    async (order, status) => {
      setUpdatingId(order._id);
      const response = await updatePharmacyOrderV1Status(order._id, {
        status,
        note: `Status changed to ${status}`,
      });

      if (response.status === "error") {
        setToast({
          message: response.error || "Status update failed",
          type: "error",
        });
        setUpdatingId("");
        return;
      }

      setToast({ message: "Status Updated", type: "success" });
      await loadTrackingOrders();
      setUpdatingId("");
    },
    [loadTrackingOrders],
  );

  const cards = useMemo(
    () =>
      orders.map((order) => (
        <article
          key={order._id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
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

          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Customer:</span>{" "}
              {order.customer?.name || "Patient"}
            </p>
            <p>
              <span className="font-semibold">Products:</span>{" "}
              {order.productsSummary || "Medicine order"}
            </p>
            <p>
              <span className="font-semibold">Ordered Date:</span>{" "}
              {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Update Status
            </p>
            <StatusDropdown
              value={order.status === "approved" ? "pending" : order.status}
              disabled={updatingId === order._id || order.status === "rejected"}
              onChange={(value) => updateStatus(order, value)}
            />
          </div>
        </article>
      )),
    [orders, updateStatus, updatingId],
  );

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            Order Tracking
          </h2>
          <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#15803D]">
            {orders.length} in-progress
          </span>
        </div>

        {error ? (
          <div className="mt-4">
            <ErrorState
              title="Connection Issue"
              message={error}
              onRetry={loadTrackingOrders}
            />
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : orders.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">{cards}</div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="No orders available"
              description="Approved orders will appear here for tracking updates."
            />
          </div>
        )}
      </section>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </>
  );
}
