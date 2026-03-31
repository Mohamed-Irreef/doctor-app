import { useEffect, useState } from "react";
import { AlertTriangle, Clock3, RefreshCcw } from "lucide-react";
import { getAdminErrors } from "../services/api";

export default function ErrorLogsPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    const response = await getAdminErrors({ limit: 200 });
    if (response.status === "error") {
      setError(response.error || "Unable to fetch error logs");
      setEntries([]);
      setLoading(false);
      return;
    }

    setEntries(response.data?.entries || []);
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-500 p-6 text-white shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-100">
          Observability
        </p>
        <h1 className="mt-2 text-3xl font-black">System Error Logs</h1>
        <p className="mt-2 max-w-2xl text-sm text-rose-100">
          Centralized runtime failures from backend services for faster triage
          and incident response.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            Recent failures
          </p>
          <p className="text-xl font-black text-slate-900">{entries.length}</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-60"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <article
            key={`${entry.timestamp || "na"}-${index}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                <AlertTriangle size={14} />
                {entry.event || "unknown_error"}
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                <Clock3 size={13} />
                {entry.timestamp
                  ? new Date(entry.timestamp).toLocaleString()
                  : "Unknown time"}
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {entry.message || "No message"}
            </p>
            {entry.bookingId && (
              <p className="mt-1 text-xs text-slate-500">
                Booking ID: {entry.bookingId}
              </p>
            )}
            {entry.orderId && (
              <p className="mt-1 text-xs text-slate-500">
                Order ID: {entry.orderId}
              </p>
            )}
            {entry.stack && (
              <pre className="mt-3 max-h-56 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
                {entry.stack}
              </pre>
            )}
          </article>
        ))}
      </div>

      {!loading && entries.length === 0 && !error && (
        <p className="rounded-xl bg-emerald-50 px-3 py-4 text-center text-sm font-semibold text-emerald-700">
          No errors recorded in recent logs.
        </p>
      )}
    </div>
  );
}
