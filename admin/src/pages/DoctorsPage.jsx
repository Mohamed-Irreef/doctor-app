import { Edit, Eye, Star, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import { DOCTORS } from "../data/mockData";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState(DOCTORS);

  const toggleStatus = (id) => {
    setDoctors(
      doctors.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            status: d.status === "Active" ? "Inactive" : "Active",
          };
        }
        return d;
      }),
    );
  };

  const columns = [
    {
      header: "Doctor",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.image}
            alt={row.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="font-semibold text-slate-800">{row.name}</div>
            <div className="text-xs text-slate-500">{row.specialization}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Hospital",
      accessor: "hospital",
      render: (row) => (
        <div className="max-w-[200px] truncate" title={row.hospital}>
          {row.hospital}
        </div>
      ),
    },
    { header: "Experience", accessor: "experience" },
    {
      header: "Rating",
      accessor: "rating",
      render: (row) => (
        <div className="flex items-center gap-1 font-medium text-amber-600">
          <Star size={14} className="fill-current" /> {row.rating}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge variant={row.status === "Active" ? "primary" : "danger"}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessor: "id",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5"
            title="View Profile"
          >
            <Eye size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5"
            title="Edit Profile"
          >
            <Edit size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleStatus(row.id)}
            className={`p-1.5 ${row.status === "Active" ? "text-red-500 hover:bg-red-50 hover:text-red-600" : "text-green-600 hover:bg-green-50"}`}
            title={row.status === "Active" ? "Disable Doctor" : "Enable Doctor"}
          >
            {row.status === "Active" ? (
              <UserX size={18} />
            ) : (
              <UserCheck size={18} />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Approved Doctors"
        description={`Manage the ${doctors.length} doctors currently active on the platform.`}
      />
      <DataTable
        columns={columns}
        data={doctors}
        searchable={true}
        itemsPerPage={8}
      />
    </div>
  );
}
