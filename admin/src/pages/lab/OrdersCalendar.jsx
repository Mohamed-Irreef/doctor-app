import { useEffect, useMemo, useRef, useState } from "react";
import EmptyState from "../../components/orders/EmptyState";
import OrdersCalendarHeader from "../../components/orders/OrdersCalendarHeader";
import OrdersCard from "../../components/orders/OrdersCard";
import { getLabBookingsV1, updateLabBookingStatusV1 } from "../../services/api";

const HOME_STATUSES = [
  "pending",
  "on-the-way",
  "reached",
  "sample-collected",
  "report-submitted",
  "closed",
];

const LAB_STATUSES = [
  "pending",
  "arrived",
  "sample-collected",
  "report-submitted",
  "closed",
];

function toInputDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export default function OrdersCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [toast, setToast] = useState("");
  const debounceRef = useRef(null);
  const todayCacheRef = useRef({
    date: toInputDate(new Date()),
    payload: null,
  });

  const loadOrders = async (date, page = 1) => {
    const today = toInputDate(new Date());
    if (
      date === today &&
      page === 1 &&
      todayCacheRef.current?.date === today &&
      todayCacheRef.current?.payload
    ) {
      setOrders(todayCacheRef.current.payload.items || []);
      setPagination(
        todayCacheRef.current.payload.pagination || {
          page: 1,
          pages: 1,
          total: 0,
        },
      );
      return;
    }

    setLoading(true);
    const res = await getLabBookingsV1({ date, page, limit: 20 });
    setLoading(false);

    if (res.status === "success") {
      const payload = {
        items: res.data?.items || [],
        pagination: res.data?.pagination || { page: 1, pages: 1, total: 0 },
      };
      setOrders(payload.items);
      setPagination(payload.pagination);

      if (date === today && page === 1) {
        todayCacheRef.current = { date: today, payload };
      }
    }
  };

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      loadOrders(selectedDate, 1);
    }, 280);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [selectedDate]);

  const setToastMessage = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const handleStatusChange = async (order, nextStatus) => {
    if (nextStatus === "closed") {
      const yes = window.confirm("Mark this order as closed?");
      if (!yes) return;
    }

    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((item) =>
        item._id === order._id ? { ...item, status: nextStatus } : item,
      ),
    );

    setUpdatingId(order._id);
    const res = await updateLabBookingStatusV1(order._id, {
      status: nextStatus,
    });
    setUpdatingId("");

    if (res.status !== "success") {
      setOrders(previousOrders);
      setToastMessage(res.error || "Unable to update status");
      return;
    }

    setToastMessage("Status updated successfully");
  };

  const cards = useMemo(
    () =>
      orders.map((order) => (
        <OrdersCard
          key={order._id}
          order={order}
          statusOptions={
            order.bookingType === "home_collection"
              ? HOME_STATUSES
              : LAB_STATUSES
          }
          onStatusChange={handleStatusChange}
          updating={updatingId === order._id}
        />
      )),
    [orders, updatingId],
  );

  return (
    <div className="space-y-4">
      <OrdersCalendarHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onToday={() => setSelectedDate(toInputDate(new Date()))}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : orders.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards}
        </div>
      ) : (
        <EmptyState message="No orders for selected date" />
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() =>
            loadOrders(selectedDate, Math.max(1, pagination.page - 1))
          }
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-xs font-semibold text-slate-500">
          Page {pagination.page || 1} of {pagination.pages || 1}
        </span>
        <button
          type="button"
          disabled={pagination.page >= pagination.pages}
          onClick={() =>
            loadOrders(
              selectedDate,
              Math.min(pagination.pages, pagination.page + 1),
            )
          }
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
