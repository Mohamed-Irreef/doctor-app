import { Edit, Eye, Trash2, UserCheck, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import { deleteAdminPatient, getAdminPatients } from "../services/api";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await getAdminPatients();
      if (response.data) setPatients(response.data);
    };
    load();
  }, []);

  const toggleStatus = (id) => {
    setPatients(
      patients.map((p) => {
        if ((p.id || p._id) === id) {
          return {
            ...p,
            status: p.status === "active" ? "inactive" : "active",
          };
        }
        return p;
      }),
    );
  };

  const handleDelete = async (row) => {
    const id = row.id || row._id;
    if (!id) return;

    const confirmed = window.confirm(
      `Delete patient "${row.name || "this patient"}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(id);
    const response = await deleteAdminPatient(id);
    setDeletingId(null);

    if (response.status === "success") {
      setPatients((prev) =>
        prev.filter((item) => (item.id || item._id) !== id),
      );
      return;
    }

    window.alert(response.error || "Failed to delete patient");
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
    {
      header: "Gender",
      accessor: "gender",
      render: (row) => row.profile?.gender || "-",
    },
    {
      header: "Blood Group",
      accessor: "bloodGroup",
      render: (row) => row.profile?.bloodGroup || "-",
    },
    {
      header: "Address",
      accessor: "address",
      render: (row) => row.profile?.address || "-",
    },
    {
      header: "Join Date",
      accessor: "joinDate",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge variant={row.status === "active" ? "success" : "danger"}>
          {row.status === "active" ? "Active" : "Inactive"}
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
            onClick={() => toggleStatus(row.id || row._id)}
            className={`p-1.5 ${row.status === "active" ? "text-red-500 hover:bg-red-50 hover:text-red-600" : "text-green-600 hover:bg-green-50"}`}
            title={
              row.status === "active" ? "Disable Patient" : "Enable Patient"
            }
          >
            {row.status === "active" ? (
              <UserX size={18} />
            ) : (
              <UserCheck size={18} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row)}
            disabled={deletingId === (row.id || row._id)}
            className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            title="Delete Patient"
          >
            <Trash2 size={18} />
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
