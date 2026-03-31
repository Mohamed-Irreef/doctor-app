import { CheckCircle2, Info, TriangleAlert } from "lucide-react";

const STYLE_MAP = {
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Icon: CheckCircle2,
  },
  error: {
    wrap: "border-rose-200 bg-rose-50 text-rose-800",
    Icon: TriangleAlert,
  },
  info: {
    wrap: "border-blue-200 bg-blue-50 text-blue-800",
    Icon: Info,
  },
};

export default function Toast({ message, type = "info", onClose }) {
  if (!message) return null;
  const style = STYLE_MAP[type] || STYLE_MAP.info;
  const Icon = style.Icon;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-soft ${style.wrap}`}
    >
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 shrink-0" />
        <p className="text-sm font-semibold leading-6">{message}</p>
        <button
          type="button"
          className="ml-auto text-xs font-bold uppercase tracking-wide opacity-70 hover:opacity-100"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
