import { Eye, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import { deleteAdminReview, getAdminReviews } from "../services/api";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const load = async () => {
      const response = await getAdminReviews();
      if (response.data) setReviews(response.data);
    };
    load();
  }, []);

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
        <span className="font-medium text-slate-800">{row.patient?.name}</span>
      ),
    },
    {
      header: "Doctor",
      accessor: "doctor",
      render: (row) => (
        <span className="text-slate-600">{row.doctor?.name}</span>
      ),
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
    {
      header: "Date",
      accessor: "date",
      className: "whitespace-nowrap",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
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
            title="View Full Review"
          >
            <Eye size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await deleteAdminReview(row._id || row.id);
              setReviews(
                reviews.filter((r) => (r._id || r.id) !== (row._id || row.id)),
              );
            }}
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
            <p className="text-2xl font-bold text-slate-900">
              {reviews.length
                ? (
                    reviews.reduce(
                      (sum, review) => sum + (review.rating || 0),
                      0,
                    ) / reviews.length
                  ).toFixed(1)
                : "0.0"}{" "}
              / 5.0
            </p>
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
