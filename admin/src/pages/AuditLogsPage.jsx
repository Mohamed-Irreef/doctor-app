import { useEffect, useMemo, useState } from "react";
import { Clock3, Filter, RefreshCcw, ShieldCheck } from "lucide-react";
import { getAdminAuditLogs } from "../services/api";

const LIMIT = 25;

export default function AuditLogsPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    limit: LIMIT,
  });
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    performedBy: "",
    dateFrom: "",
    dateTo: "",
  });

  const load = async (targetPage = 1) => {
    setLoading(true);
    setError("");

    const response = await getAdminAuditLogs({
      page: targetPage,
      limit: LIMIT,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.performedBy ? { performedBy: filters.performedBy } : {}),
      ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
      ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
    });

    if (response.status === "error") {
      setError(response.error || "Unable to fetch audit logs");
      setEntries([]);
      setLoading(false);
      return;
    }

    setEntries(response.data?.entries || []);
    setPagination(
      response.data?.pagination || { total: 0, pages: 1, limit: LIMIT },
    );
    setPage(targetPage);
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      load(1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = useMemo(
    () =>
      Array.from(
        new Set(entries.map((entry) => entry.action).filter(Boolean)),
      ).sort(),
    [entries],
  );

  const entityTypes = useMemo(
    () =>
      Array.from(
        new Set(entries.map((entry) => entry.entityType).filter(Boolean)),
      ).sort(),
    [entries],
  );

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-linear-to-r from-cyan-700 via-sky-700 to-blue-700 p-6 text-white shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
          Compliance
        </p>
        <h1 className="mt-2 text-3xl font-black">Audit Trail</h1>
        <p className="mt-2 max-w-2xl text-sm text-cyan-100">
          Immutable timeline of critical operational actions across orders,
          bookings, approvals, and report uploads.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
            <ShieldCheck size={14} />
            {pagination.total} tracked actions
          </div>
          <button
            type="button"
            onClick={() => load(page)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-60"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <label className="text-xs font-semibold text-slate-600">
            Action
            <select
              value={filters.action}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, action: event.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">All actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-slate-600">
            Entity
            <select
              value={filters.entityType}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  entityType: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">All entities</option>
              {entityTypes.map((entityType) => (
                <option key={entityType} value={entityType}>
                  {entityType}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-slate-600">
            User ID
            <input
              type="text"
              value={filters.performedBy}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  performedBy: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Actor user id"
            />
          </label>

          <label className="text-xs font-semibold text-slate-600">
            From
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  dateFrom: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="text-xs font-semibold text-slate-600">
            To
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, dateTo: event.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => load(1)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-sm font-bold text-white"
            >
              <Filter size={14} />
              Apply
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}

      <section className="space-y-3">
        {entries.map((entry, index) => (
          <article
            key={`${entry._id || "audit"}-${index}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {entry.entityType}
                </p>
                <h2 className="mt-1 text-sm font-black text-slate-900">
                  {entry.action}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Entity ID: {entry.entityId}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="inline-flex items-center gap-1">
                  <Clock3 size={13} />
                  {entry.timestamp
                    ? new Date(entry.timestamp).toLocaleString()
                    : "Unknown time"}
                </p>
                <p className="mt-1 font-semibold text-slate-600">
                  {entry.performedBy?.name ||
                    entry.performedBy?.email ||
                    "System"}
                </p>
              </div>
            </div>

            {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
              <pre className="mt-3 max-h-56 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
                {JSON.stringify(entry.metadata, null, 2)}
              </pre>
            ) : null}
          </article>
        ))}

        {!loading && entries.length === 0 && !error ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-4 text-center text-sm font-semibold text-emerald-700">
            No audit records found for the selected filters.
          </p>
        ) : null}
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-soft">
        <p className="font-semibold text-slate-600">
          Page {page} of {Math.max(Number(pagination.pages || 1), 1)}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => load(page - 1)}
            disabled={loading || page <= 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => load(page + 1)}
            disabled={loading || page >= Number(pagination.pages || 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
