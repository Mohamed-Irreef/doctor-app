import { useCallback, useEffect, useMemo, useState } from "react";
import OrderCard from "../../../components/pharmacy/OrderCard";
import OrderDetailsModal from "../../../components/pharmacy/OrderDetailsModal";
import StatusBadge from "../../../components/pharmacy/StatusBadge";
import Toast from "../../../components/Toast";
import {
    approvePharmacyOrderV1,
    getPharmacyOrdersV1,
    rejectPharmacyOrderV1,
} from "../../../services/api";
import { EmptyState, ErrorState } from "./UiKit";

export default function PharmacyOrdersRoutePage() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [updatingId, setUpdatingId] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info" });

  const loadOrders = useCallback(
    async (nextPage = page) => {
      setLoading(true);
      setError("");

      const response = await getPharmacyOrdersV1({ page: nextPage, limit: 10 });

      if (response.status === "error") {
        setError(response.error || "Unable to load orders");
        setOrders([]);
        setLoading(false);
        return;
      }

      setOrders(response.data?.items || []);
      setPagination(
        response.data?.pagination || {
          page: 1,
          limit: 10,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false,
        },
      );
      setLoading(false);
    },
    [page],
  );

  useEffect(() => {
    loadOrders(page);
  }, [loadOrders, page]);

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = window.setTimeout(
      () => setToast({ message: "", type: "info" }),
      2200,
    );
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleView = useCallback((order) => {
    setSelected(order);
    setIsModalOpen(true);
  }, []);

  const handleApprove = useCallback(
    async (order) => {
      setUpdatingId(order._id);
      const response = await approvePharmacyOrderV1(order._id);
      if (response.status === "error") {
        setToast({
          message: response.error || "Approval failed",
          type: "error",
        });
        setUpdatingId("");
        return;
      }

      setToast({ message: "Order Approved", type: "success" });
      await loadOrders(page);
      setUpdatingId("");
    },
    [loadOrders, page],
  );

  const handleReject = useCallback(
    async (order) => {
      const confirmed = window.confirm("Are you sure?");
      if (!confirmed) return;

      setUpdatingId(order._id);
      const response = await rejectPharmacyOrderV1(order._id);
      if (response.status === "error") {
        setToast({
          message: response.error || "Rejection failed",
          type: "error",
        });
        setUpdatingId("");
        return;
      }

      setToast({ message: "Order Rejected", type: "success" });
      await loadOrders(page);
      setUpdatingId("");
    },
    [loadOrders, page],
  );

  const cards = useMemo(
    () =>
      orders.map((order) => (
        <OrderCard
          key={order._id}
          order={order}
          onView={handleView}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={updatingId === order._id}
        />
      )),
    [orders, handleView, handleApprove, handleReject, updatingId],
  );

  const selectedPreview = selected || orders[0] || null;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Orders</h2>
            <span className="rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-bold text-[#1D4ED8]">
              {pagination.totalItems} active
            </span>
          </div>

          {error ? (
            <div className="mt-4">
              <ErrorState
                title="Connection Issue"
                message={error}
                onRetry={() => loadOrders(page)}
              />
            </div>
          ) : null}

          {loading ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : orders.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">{cards}</div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No orders available"
                description="New medicine orders will appear here."
              />
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPrev || loading}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-slate-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!pagination.hasNext || loading}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="text-base font-extrabold text-slate-900">
            Order Details
          </h3>
          {selectedPreview ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Order ID
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  #
                  {String(
                    selectedPreview.orderId || selectedPreview._id || "",
                  ).slice(-8)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Customer
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {selectedPreview.customer?.name || "Patient"}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedPreview.customer?.phone || "No contact"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Status
                </p>
                <div className="mt-2">
                  <StatusBadge status={selectedPreview.status} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleView(selectedPreview)}
                className="w-full rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white hover:bg-[#1D4ED8]"
              >
                View Full Details
              </button>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500">
              Select an order to view details.
            </p>
          )}
        </aside>
      </div>

      <OrderDetailsModal
        order={selected}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </>
  );
}
