import {
    CalendarCheck2,
    Eye,
    FileText,
    MessageSquare,
    Users,
    Video,
} from "lucide-react";
import { useState } from "react";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import { APPOINTMENTS } from "../data/mockData";

const QUICK_FILTERS = ["All", "Today", "Upcoming", "Completed"];

export default function AppointmentsPage() {
  const [appointments] = useState(APPOINTMENTS);
  const [activeFilter, setActiveFilter] = useState("All");

  const getStatusBadge = (status) => {
    switch (status) {
      case "Upcoming":
        return "primary";
      case "Completed":
        return "success";
      case "Cancelled":
        return "danger";
      case "Pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Video":
        return <Video size={16} className="text-blue-500" />;
      case "Chat":
        return <MessageSquare size={16} className="text-teal-500" />;
      case "In-person":
        return <Users size={16} className="text-purple-500" />;
      default:
        return null;
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Today") return appointment.date === "Oct 27, 2026";
    return appointment.status === activeFilter;
  });

  const columns = [
    {
      header: "Appt ID",
      accessor: "id",
      render: (row) => (
        <span className="text-sm font-mono text-slate-500">#{row.id}</span>
      ),
    },
    {
      header: "Consultation",
      accessor: "patient",
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-800">{row.patient}</div>
          <div className="text-xs text-slate-500">with {row.doctor}</div>
        </div>
      ),
    },
    {
      header: "Schedule",
      accessor: "date",
      render: (row) => (
        <div>
          <div className="font-medium text-slate-700">{row.date}</div>
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
          <span className="text-sm text-slate-700">{row.type}</span>
        </div>
      ),
    },
    {
      header: "Fee",
      accessor: "amount",
      render: (row) => <span className="font-medium">₹{row.amount}</span>,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge variant={getStatusBadge(row.status)}>{row.status}</Badge>
      ),
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
