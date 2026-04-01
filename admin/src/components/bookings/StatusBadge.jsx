const STATUS_STYLES = {
  booked: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  "on-the-way": "bg-teal-100 text-teal-700",
  reached: "bg-teal-100 text-teal-700",
  arrived: "bg-cyan-100 text-cyan-700",
  "sample-collected": "bg-indigo-100 text-indigo-700",
  "report-submitted": "bg-violet-100 text-violet-700",
  "report-ready": "bg-violet-100 text-violet-700",
  completed: "bg-slate-200 text-slate-700",
  closed: "bg-slate-200 text-slate-700",
  cancelled: "bg-rose-100 text-rose-700",
};

function titleCase(value) {
  return String(value || "pending")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function StatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();
  const className = STATUS_STYLES[normalized] || "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${className}`}
    >
      {titleCase(normalized)}
    </span>
  );
}
