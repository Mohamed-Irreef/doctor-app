import { AlertTriangle, Inbox } from "lucide-react";

export function ErrorState({ title, message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-rose-100 p-2 text-rose-600">
          <AlertTriangle size={16} />
        </div>
        <div className="flex-1">
          <p className="font-bold">{title}</p>
          <p className="mt-1 text-rose-600/90">{message}</p>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Inbox size={18} />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

export function CardSkeleton({ rows = 2 }) {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="h-4 w-24 rounded bg-slate-100" />
      <div className="mt-3 h-7 w-32 rounded bg-slate-100" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-3 w-full rounded bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-10 rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}
