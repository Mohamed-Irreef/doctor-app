import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

const toneStyles = {
  success: {
    icon: CheckCircle2,
    box: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  danger: {
    icon: TriangleAlert,
    box: "bg-rose-50 text-rose-700 border-rose-200",
  },
  info: {
    icon: Info,
    box: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

export default function Toast({ message, tone = "info", onClose }) {
  if (!message) return null;

  const config = toneStyles[tone] || toneStyles.info;
  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-[70]">
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl shadow-slate-900/10 ${config.box}`}
      >
        <Icon size={18} className="mt-0.5 shrink-0" />
        <p className="max-w-xs text-sm font-semibold">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 opacity-70 transition hover:bg-white/60 hover:opacity-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
