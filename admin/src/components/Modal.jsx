import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = "max-w-md",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div
        className={`relative flex max-h-[92vh] w-full scale-100 flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-slate-900/20 transition-all duration-300 ${className}`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-all hover:rotate-90 hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="scrollbar-thin overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
