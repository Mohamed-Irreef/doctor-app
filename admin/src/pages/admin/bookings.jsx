import { useEffect, useMemo, useState } from "react";
import BookingCard from "../../components/bookings/BookingCard";
import BookingDetailsDrawer from "../../components/bookings/BookingDetailsDrawer";
import BookingTabs from "../../components/bookings/BookingTabs";
import {
    approveLabBookingV1,
    getLabBookingsV1,
    rejectLabBookingV1,
} from "../../services/api";

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const tone =
    toast.type === "success"
      ? "bg-emerald-600"
      : toast.type === "error"
        ? "bg-rose-600"
        : "bg-slate-700";

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div
        className={`rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${tone}`}
      >
        {toast.message}
        <button type="button" onClick={onClose} className="ml-3 text-white/80">
          x
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="h-60 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
  );
}

export default function AdminBookingsPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [counts, setCounts] = useState({ home: 0, lab: 0 });
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState("");

  const [drawer, setDrawer] = useState({
    open: false,
    title: "",
    sections: [],
  });

  const bookingType = activeTab === "home" ? "home_collection" : "lab_visit";

  const load = async (page = 1) => {
    setLoading(true);
    const [listRes, homeRes, labRes] = await Promise.all([
      getLabBookingsV1({ type: bookingType, page, limit: 10 }),
      getLabBookingsV1({ type: "home_collection", page: 1, limit: 1 }),
      getLabBookingsV1({ type: "lab_visit", page: 1, limit: 1 }),
    ]);
    setLoading(false);

    if (listRes.status === "success") {
      setBookings(listRes.data?.items || []);
      setPagination(
        listRes.data?.pagination || { page: 1, pages: 1, total: 0 },
      );
    }

    setCounts({
      home: homeRes.data?.pagination?.total || 0,
      lab: labRes.data?.pagination?.total || 0,
    });
  };

  useEffect(() => {
    load(1);
  }, [activeTab]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2400);
  };

  const openTestDrawer = (booking) => {
    const test = booking.tests?.[0] || booking.labTest || {};
    setDrawer({
      open: true,
      title: "Test Details",
      sections: [
        {
          heading: "Test Information",
          rows: [
            { label: "Test Name", value: test.name || "-" },
            {
              label: "Description",
              value: test.shortDescription || test.fullDescription || "-",
            },
            {
              label: "Price",
              value: test.price !== undefined ? `INR ${test.price}` : "-",
            },
            {
              label: "Preparation",
              value: test.preparationInstructions || "-",
            },
          ],
        },
      ],
    });
  };

  const openOrderDrawer = (booking) => {
    const rows = [
      { label: "Patient", value: booking.patient?.name || "-" },
      { label: "Booking ID", value: String(booking._id || "").slice(-8) },
      {
        label: "Selected Date",
        value: booking.date ? new Date(booking.date).toLocaleDateString() : "-",
      },
      { label: "Time Slot", value: booking.timeSlot || "-" },
      {
        label: "Contact Number",
        value: booking.contactNumber || booking.patient?.phone || "-",
      },
      { label: "Payment", value: booking.paymentStatus || "-" },
    ];

    if (booking.bookingType === "home_collection") {
      rows.push(
        { label: "Flat/House", value: booking.address?.flat || "-" },
        { label: "Street", value: booking.address?.street || "-" },
        { label: "Landmark", value: booking.address?.landmark || "-" },
        { label: "City", value: booking.address?.city || "-" },
        { label: "Pincode", value: booking.address?.pincode || "-" },
      );
    } else {
      rows.push({
        label: "Lab Location",
        value: booking.labLocation || "Lab Visit",
      });
    }

    setDrawer({
      open: true,
      title: "Order Details",
      sections: [{ heading: "Booking Information", rows }],
    });
  };

  const approve = async (booking) => {
    setBusyId(booking._id);
    const res = await approveLabBookingV1(booking._id);
    setBusyId("");
    if (res.status === "success") {
      showToast("Booking approved", "success");
      load(pagination.page || 1);
    } else {
      showToast(res.error || "Unable to approve booking", "error");
    }
  };

  const reject = async (booking) => {
    const yes = window.confirm("Reject this booking?");
    if (!yes) return;

    setBusyId(booking._id);
    const res = await rejectLabBookingV1(booking._id);
    setBusyId("");
    if (res.status === "success") {
      showToast("Booking rejected", "success");
      load(pagination.page || 1);
    } else {
      showToast(res.error || "Unable to reject booking", "error");
    }
  };

  const cards = useMemo(
    () =>
      bookings.map((booking) => (
        <BookingCard
          key={booking._id}
          booking={booking}
          onViewTest={() => openTestDrawer(booking)}
          onViewOrder={() => openOrderDrawer(booking)}
          onApprove={() => approve(booking)}
          onReject={() => reject(booking)}
          busy={busyId === booking._id}
        />
      )),
    [bookings, busyId],
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Bookings</h2>
            <p className="text-sm text-slate-600">
              Manage home collection and lab visit bookings with approval
              workflow.
            </p>
          </div>
          <BookingTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            counts={counts}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : bookings.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No bookings found
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => load(Math.max(1, pagination.page - 1))}
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
          onClick={() => load(Math.min(pagination.pages, pagination.page + 1))}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <BookingDetailsDrawer
        open={drawer.open}
        title={drawer.title}
        sections={drawer.sections}
        onClose={() => setDrawer((prev) => ({ ...prev, open: false }))}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
