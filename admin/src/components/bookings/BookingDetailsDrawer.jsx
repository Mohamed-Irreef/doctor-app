import { X } from "lucide-react";

function Row({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value || "-"}</p>
    </div>
  );
}

export default function BookingDetailsDrawer({
  open,
  title,
  onClose,
  sections = [],
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40">
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <section
              key={section.heading}
              className="rounded-xl border border-slate-200 p-4"
            >
              <h4 className="text-sm font-bold text-slate-800">
                {section.heading}
              </h4>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(section.rows || []).map((row) => (
                  <Row key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
