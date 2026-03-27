import { Eye, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import { REVIEWS } from "../data/mockData";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(REVIEWS);

  const columns = [
    {
      header: "Rating",
      accessor: "rating",
      render: (row) => (
        <div className="flex gap-1 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={i < row.rating ? "fill-current" : "text-slate-300"}
            />
          ))}
        </div>
      ),
    },
    {
      header: "Patient",
      accessor: "patient",
      render: (row) => (
        <span className="font-medium text-slate-800">{row.patient}</span>
      ),
    },
    {
      header: "Doctor",
      accessor: "doctor",
      render: (row) => <span className="text-slate-600">{row.doctor}</span>,
    },
    {
      header: "Comment",
      accessor: "comment",
      render: (row) => (
        <span
          className="text-slate-600 line-clamp-1 max-w-[300px]"
          title={row.comment}
        >
          {row.comment}
        </span>
      ),
    },
    { header: "Date", accessor: "date", className: "whitespace-nowrap" },
    {
      header: "Actions",
      accessor: "id",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5"
            title="View Full Review"
          >
            <Eye size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReviews(reviews.filter((r) => r.id !== row.id))}
            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
            title="Delete Review"
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
        title="Patient Reviews"
        description="Monitor feedback left by patients for doctors across the platform."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <Star size={24} className="fill-current" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Average Rating</p>
            <p className="text-2xl font-bold text-slate-900">4.8 / 5.0</p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={reviews}
        searchable={true}
        itemsPerPage={10}
      />
    </div>
  );
}
