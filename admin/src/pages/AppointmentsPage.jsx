import {
    CalendarCheck2,
    CheckCircle2,
    Eye,
    FileText,
    Loader2,
    MessageSquare,
    Users,
    Video,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import {
    getAdminAppointments,
    verifyAdminAppointmentRevenue,
} from "../services/api";

const QUICK_FILTERS = ["All", "Today", "Upcoming", "Completed"];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [processingId, setProcessingId] = useState("");

  useEffect(() => {
    const load = async () => {
      const response = await getAdminAppointments();
      if (response.data) setAppointments(response.data);
    };
    load();

    const intervalId = window.setInterval(load, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  const syncAppointment = (id, patch) => {
    setAppointments((prev) =>
      prev.map((item) =>
        String(item?._id) === String(id)
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  };

  const handleRevenueAction = async (row, approved) => {
    if (!row?._id || processingId) return;

    let payoutReference;
    if (approved) {
      payoutReference = window.prompt(
        "Optional payout reference (leave blank to keep as processing):",
      );
      if (payoutReference === null) return;
    }

    setProcessingId(String(row._id));
    const response = await verifyAdminAppointmentRevenue(String(row._id), {
      approved,
      payoutReference: payoutReference?.trim() || undefined,
    });
    setProcessingId("");

    if (response.status !== "success") {
      window.alert(response.error || "Unable to update revenue status.");
      return;
    }

    syncAppointment(String(row._id), {
      adminReviewStatus: approved ? "verified" : "rejected",
      revenueSplit: response.data?.revenueSplit || row.revenueSplit,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Upcoming":
      case "upcoming":
        return "primary";
      case "Completed":
      case "completed":
        return "success";
      case "Cancelled":
      case "cancelled":
        return "danger";
      case "Pending":
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Video":
      case "video":
        return <Video size={16} className="text-blue-500" />;
      case "Chat":
      case "chat":
        return <MessageSquare size={16} className="text-teal-500" />;
      case "In-person":
      case "in-person":
        return <Users size={16} className="text-purple-500" />;
      default:
        return null;
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Today") {
      const today = new Date().toISOString().slice(0, 10);
      return String(appointment.date).slice(0, 10) === today;
    }
    return (
      String(appointment.status).toLowerCase() === activeFilter.toLowerCase()
    );
  });

  const columns = [
    {
      header: "Appt ID",
      accessor: "id",
      render: (row) => (
        <span className="text-sm font-mono text-slate-500">
          #{row._id?.slice(-6)}
        </span>
      ),
    },
    {
      header: "Consultation",
      accessor: "patient",
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-800">
            {row.patient?.name}
          </div>
          <div className="text-xs text-slate-500">with {row.doctor?.name}</div>
        </div>
      ),
    },
    {
      header: "Schedule",
      accessor: "date",
      render: (row) => (
        <div>
          <div className="font-medium text-slate-700">
            {new Date(row.date).toLocaleDateString()}
          </div>
          <div className="text-xs text-slate-500">{row.time}</div>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      render: (row) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(row.type)}
          <span className="text-sm text-slate-700">
            {String(row.type).replace("in-person", "In-person")}
          </span>
        </div>
      ),
    },
    {
      header: "Fee",
      accessor: "fee",
      render: (row) => <span className="font-medium">₹{row.fee || 0}</span>,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge variant={getStatusBadge(row.status)}>
          {String(row.status).charAt(0).toUpperCase() +
            String(row.status).slice(1)}
        </Badge>
      ),
    },
    {
      header: "Revenue Review",
      accessor: "adminReviewStatus",
      render: (row) => {
        const reviewStatus = String(
          row.adminReviewStatus || "pending",
        ).toLowerCase();
        const isBusy = processingId === String(row._id);
        const isPaid = String(row.paymentStatus || "").toLowerCase() === "paid";

        if (!isPaid) {
          return (
            <span className="text-xs font-medium text-slate-400">
              Awaiting payment
            </span>
          );
        }

        if (reviewStatus === "verified") {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={12} />
              Verified
            </span>
          );
        }

        if (reviewStatus === "rejected") {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
              <XCircle size={12} />
              Rejected
            </span>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleRevenueAction(row, true)}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
              Verify
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleRevenueAction(row, false)}
              className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle size={12} />
              Reject
            </button>
          </div>
        );
      },
    },
    {
      header: "Notes",
      accessor: "notes",
      render: () => (
        <button
          type="button"
          title="View consultation notes"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          <FileText size={16} />
        </button>
      ),
    },
    {
      header: "Details",
      accessor: "id",
      render: () => (
        <button
          type="button"
          title="View appointment details"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Monitor all platform consultations and schedules globally."
      />

      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeFilter === filter
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <DataTable
        title="Consultation Queue"
        description="Track live and completed appointments with quick action visibility."
        columns={columns}
        data={filteredAppointments}
        searchable={true}
        itemsPerPage={10}
        activeFilters={
          activeFilter === "All" ? [] : [`Filter: ${activeFilter}`]
        }
        onClearFilters={() => setActiveFilter("All")}
        toolbar={
          <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            <CalendarCheck2 size={14} />
            Synced every 60 sec
          </div>
        }
      />
    </div>
  );
}
