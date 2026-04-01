export default function EmptyState({
  message = "No orders for selected date",
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
