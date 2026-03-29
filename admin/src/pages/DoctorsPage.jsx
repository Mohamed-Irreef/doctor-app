import { Edit, Eye, Star, UserCheck, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import { getAdminDoctors } from "../services/api";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await getAdminDoctors();
      if (response.data) setDoctors(response.data);
    };
    load();
  }, []);

  const toggleStatus = (id) => {
    setDoctors(
      doctors.map((d) => {
        if ((d.id || d._id) === id) {
          return {
            ...d,
            status: d.status === "active" ? "inactive" : "active",
          };
        }
        return d;
      }),
    );
  };

  const openDoctorDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setIsDetailsOpen(true);
  };

  const closeDoctorDetails = () => {
    setIsDetailsOpen(false);
    setSelectedDoctor(null);
  };

  const columns = [
    {
      header: "Doctor",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.image || "https://via.placeholder.com/40"}
            alt={row.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="font-semibold text-slate-800">{row.name}</div>
            <div className="text-xs text-slate-500">
              {row.profile?.specialization || "Doctor"}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Hospital",
      accessor: "hospital",
      render: (row) => (
        <div
          className="max-w-[200px] truncate"
          title={row.profile?.hospital || "-"}
        >
          {row.profile?.hospital || "-"}
        </div>
      ),
    },
    {
      header: "Experience",
      accessor: "experience",
      render: (row) => `${row.profile?.experienceYears || 0} Years`,
    },
    {
      header: "Rating",
      accessor: "rating",
      render: (row) => (
        <div className="flex items-center gap-1 font-medium text-amber-600">
          <Star size={14} className="fill-current" /> {row.profile?.rating || 0}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge variant={row.status === "active" ? "primary" : "danger"}>
          {row.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Approval",
      accessor: "doctorApprovalStatus",
      render: (row) => {
        const approval = row.doctorApprovalStatus || "none";
        const variant =
          approval === "approved"
            ? "success"
            : approval === "pending"
              ? "warning"
              : approval === "rejected"
                ? "danger"
                : "default";

        return (
          <Badge variant={variant}>
            {approval.charAt(0).toUpperCase() + approval.slice(1)}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessor: "id",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDoctorDetails(row)}
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
            onClick={() => toggleStatus(row.id || row._id)}
            className={`p-1.5 ${row.status === "active" ? "text-red-500 hover:bg-red-50 hover:text-red-600" : "text-green-600 hover:bg-green-50"}`}
            title={row.status === "active" ? "Disable Doctor" : "Enable Doctor"}
          >
            {row.status === "active" ? (
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

      <Modal
        isOpen={isDetailsOpen}
        onClose={closeDoctorDetails}
        title="Doctor Details"
        className="max-w-3xl"
      >
        {selectedDoctor && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <img
                src={selectedDoctor.image || "https://via.placeholder.com/64"}
                alt={selectedDoctor.name}
                className="h-16 w-16 rounded-full border border-slate-200 object-cover"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedDoctor.name}
                </h3>
                <p className="text-sm font-semibold text-blue-600">
                  {selectedDoctor.profile?.specialization || "Doctor"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedDoctor.email || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Phone
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedDoctor.phone || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Hospital
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedDoctor.profile?.hospital || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Experience
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedDoctor.profile?.experienceYears || 0} Years
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedDoctor.status || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Approval
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedDoctor.doctorApprovalStatus || "-"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
