export default function OrdersCalendarHeader({
  selectedDate,
  onDateChange,
  onToday,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">
            Orders Calendar
          </h3>
          <p className="text-sm text-slate-500">
            Selected date: {new Date(selectedDate).toDateString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold"
          />
          <button
            type="button"
            onClick={onToday}
            className="h-10 rounded-lg bg-[#2563EB] px-4 text-sm font-bold text-white"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
}
