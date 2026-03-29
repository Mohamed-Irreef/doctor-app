import { CheckCircle, MapPin, Package, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import { getAdminOrders, updateAdminOrderStatus } from "../services/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const load = async () => {
      const response = await getAdminOrders();
      if (response.data) setOrders(response.data);
    };
    load();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Ordered":
      case "ordered":
        return "warning";
      case "Shipped":
      case "shipped":
        return "primary";
      case "Delivered":
      case "delivered":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Ordered":
      case "ordered":
        return <Package size={16} className="text-amber-500" />;
      case "Shipped":
      case "shipped":
        return <Truck size={16} className="text-blue-500" />;
      case "Delivered":
      case "delivered":
        return <CheckCircle size={16} className="text-green-500" />;
      default:
        return null;
    }
  };

  const advanceStatus = async (id, currentStatus) => {
    let nextStatus = currentStatus;
    if (currentStatus === "ordered") nextStatus = "shipped";
    else if (currentStatus === "shipped") nextStatus = "delivered";

    if (nextStatus !== currentStatus) {
      await updateAdminOrderStatus(id, nextStatus);
      setOrders(
        orders.map((o) =>
          (o.id || o._id) === id ? { ...o, status: nextStatus } : o,
        ),
      );
    }
  };

  const columns = [
    {
      header: "Order ID",
      accessor: "id",
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-slate-700">
          #{(row._id || row.id || "").slice(-8)}
        </span>
      ),
    },
    {
      header: "Patient",
      accessor: "user",
      render: (row) => (
        <span className="font-semibold text-slate-800">{row.user?.name}</span>
      ),
    },
    {
      header: "Items",
      accessor: "items",
      render: (row) => (
        <span
          className="text-slate-600 truncate max-w-[200px] block"
          title={(row.items || []).map((item) => item.name).join(", ")}
        >
          {(row.items || []).map((item) => item.name).join(", ")}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "date",
      render: (row) => new Date(row.date || row.createdAt).toLocaleDateString(),
    },
    {
      header: "Amount",
      accessor: "amount",
      render: (row) => <span className="font-semibold">₹{row.amount}</span>,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.status)}
          <Badge variant={getStatusBadge(row.status)}>
            {String(row.status).charAt(0).toUpperCase() +
              String(row.status).slice(1)}
          </Badge>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: "id",
      render: (row) => (
        <div className="flex gap-2">
          {row.status !== "delivered" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => advanceStatus(row.id || row._id, row.status)}
              className="text-[11px] uppercase tracking-widest font-black bg-slate-50 border border-slate-100"
            >
              Mark {row.status === "ordered" ? "Shipped" : "Delivered"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pharmacy Orders"
        description="Track and fulfill medicine deliveries."
        action={
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <MapPin size={16} className="text-blue-600" />
            <span className="font-medium text-slate-800">12</span> Active
            Deliveries
          </div>
        }
      />
      <DataTable
        columns={columns}
        data={orders}
        searchable={true}
        itemsPerPage={10}
      />
    </div>
  );
}
