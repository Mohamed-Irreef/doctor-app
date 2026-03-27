import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

export default function DataTable({
  columns,
  data,
  searchable = true,
  itemsPerPage = 8,
  title,
  description,
  toolbar,
  activeFilters = [],
  onClearFilters,
  loading = false,
  emptyState,
}) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIdx, startIdx + itemsPerPage);

  return (
    <section className="panel-card flex flex-col overflow-hidden">
      {(title || description || toolbar || searchable) && (
        <div className="space-y-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          {(title || description) && (
            <div>
              {title && (
                <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {searchable ? (
              <div className="relative w-full max-w-md group">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search records"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            ) : (
              <div />
            )}

            {toolbar && (
              <div className="flex items-center gap-2">{toolbar}</div>
            )}
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((filter, index) => (
                <span
                  key={`${filter}-${index}`}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200"
                >
                  {filter}
                </span>
              ))}
              {onClearFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="rounded-full px-3 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[780px] border-separate border-spacing-y-2 px-2 text-left">
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-[0.13em] text-slate-500 ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(itemsPerPage, 6) }).map(
                (_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`}>
                    {columns.map((_, colIndex) => (
                      <td
                        key={`skeleton-${rowIndex}-${colIndex}`}
                        className="px-4 py-4"
                      >
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ),
              )
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-14 text-center text-sm text-slate-500"
                >
                  {emptyState || (
                    <div className="space-y-2">
                      <p className="text-base font-bold text-slate-700">
                        No records available
                      </p>
                      <p className="text-sm text-slate-500">
                        Try adjusting the search query or active filters.
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="rounded-xl bg-white transition hover:-translate-y-[1px] hover:bg-slate-50/80 hover:shadow-md"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`whitespace-nowrap border-y border-slate-100 px-4 py-3.5 text-sm font-medium text-slate-700 first:rounded-l-xl first:border-l first:border-slate-100 last:rounded-r-xl last:border-r last:border-slate-100 ${col.className || ""}`}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Showing <span className="text-slate-900">{startIdx + 1}</span> -{" "}
            <span className="text-slate-900">
              {Math.min(startIdx + itemsPerPage, filteredData.length)}
            </span>{" "}
            of {filteredData.length}
          </p>
          <div className="flex gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="rounded-lg border border-transparent p-2 text-slate-600 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded-lg border border-transparent p-2 text-slate-600 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
