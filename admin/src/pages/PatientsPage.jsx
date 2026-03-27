import { Edit, Eye, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import { PATIENTS } from "../data/mockData";

export default function PatientsPage() {
  const [patients, setPatients] = useState(PATIENTS);

  const toggleStatus = (id) => {
    setPatients(
      patients.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            status: p.status === "Active" ? "Inactive" : "Active",
          };
        }
        return p;
      }),
    );
  };

  const columns = [
    {
      header: "Patient Name",
      accessor: "name",
      render: (row) => (
        <span className="font-semibold text-slate-800">{row.name}</span>
      ),
    },
    { header: "Email ID", accessor: "email" },
    { header: "Phone", accessor: "phone" },
    { header: "Join Date", accessor: "joinDate" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge variant={row.status === "Active" ? "success" : "danger"}>
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
            title="View Details"
          >
            <Eye size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5"
            title="Edit Patient"
          >
            <Edit size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleStatus(row.id)}
            className={`p-1.5 ${row.status === "Active" ? "text-red-500 hover:bg-red-50 hover:text-red-600" : "text-green-600 hover:bg-green-50"}`}
            title={
              row.status === "Active" ? "Disable Patient" : "Enable Patient"
            }
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
        title="Patients Management"
        description={`View and manage ${patients.length} registered patients across the platform.`}
      />
      <DataTable
        columns={columns}
        data={patients}
        searchable={true}
        itemsPerPage={8}
      />
    </div>
  );
}
