import { CreditCard, Download, ShieldCheck } from "lucide-react";
import { useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import { PAYMENTS } from "../data/mockData";

export default function PaymentsPage() {
  const [payments] = useState(PAYMENTS);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return "success";
      case "Pending":
        return "warning";
      case "Failed":
        return "danger";
      default:
        return "default";
    }
  };

  const columns = [
    {
      header: "Transaction ID",
      accessor: "id",
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-500">
          {row.id}
        </span>
      ),
    },
    {
      header: "User",
      accessor: "user",
      render: (row) => (
        <span className="font-semibold text-slate-800">{row.user}</span>
      ),
    },
    {
      header: "Type",
      accessor: "type",
      render: (row) => <span className="text-slate-600">{row.type}</span>,
    },
    { header: "Date", accessor: "date" },
    {
      header: "Method",
      accessor: "method",
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-2 py-1 rounded inline-flex text-xs font-medium border border-slate-100">
          <CreditCard size={14} /> {row.method}
        </div>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      render: (row) => (
        <span className="font-bold text-slate-900">₹{row.amount}</span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge variant={getStatusBadge(row.status)}>{row.status}</Badge>
      ),
    },
    {
      header: "Receipt",
      accessor: "id",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={row.status !== "Paid"}
          className="p-1.5"
          title="Download Receipt"
        >
          <Download size={18} />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payment Transactions"
        description="View all financial transactions across consultations, labs, and pharmacy."
        action={
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
            <ShieldCheck size={18} />
            <span className="text-sm font-medium">100% Secure Gateway</span>
          </div>
        }
      />
      <DataTable
        columns={columns}
        data={payments}
        searchable={true}
        itemsPerPage={10}
      />
    </div>
  );
}
