import { AlertTriangle, PackageOpen } from "lucide-react";
import { usePharmacyPortal } from "./PharmacyPortalContext";
import { EmptyState, ErrorState, TableSkeleton } from "./UiKit";

export default function PharmacyInventoryRoutePage() {
  const { medicines, lowStockItems, medicinesError, loadingMedicines, load } =
    usePharmacyPortal();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">Inventory</h2>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
            {lowStockItems.length} low stock
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3">Product</th>
                <th className="py-3">Stock</th>
                <th className="py-3">Threshold</th>
                <th className="py-3">Expiry</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {medicinesError ? (
                <tr>
                  <td colSpan={5} className="py-6">
                    <ErrorState
                      title="Connection Issue"
                      message={medicinesError}
                      onRetry={load}
                    />
                  </td>
                </tr>
              ) : loadingMedicines ? (
                <tr>
                  <td colSpan={5} className="py-6">
                    <TableSkeleton rows={5} />
                  </td>
                </tr>
              ) : medicines.length ? (
                medicines.map((item) => {
                  const low =
                    Number(item.stock || 0) <=
                    Number(item.lowStockThreshold || 10);
                  return (
                    <tr
                      key={item._id}
                      className="border-b border-slate-100 transition hover:bg-slate-50/70 last:border-b-0"
                    >
                      <td className="py-4 font-semibold text-slate-800">
                        {item.name}
                      </td>
                      <td>{item.stock}</td>
                      <td>{item.lowStockThreshold || 10}</td>
                      <td>
                        {item.expiryDate ? item.expiryDate.slice(0, 10) : "-"}
                      </td>
                      <td>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            low
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {low ? "Low" : "Healthy"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-6">
                    <EmptyState
                      title="No inventory data"
                      description="Add products to track stock levels."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-rose-600" />
            <div>
              <p className="text-sm font-semibold text-rose-700">
                Low Stock Alerts
              </p>
              <p className="text-xs text-rose-600">
                Reorder critical items soon.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm font-semibold text-rose-800">
            {lowStockItems.length ? (
              lowStockItems.slice(0, 4).map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between"
                >
                  <span>{item.name}</span>
                  <span>{item.stock}</span>
                </div>
              ))
            ) : (
              <p className="text-rose-700">No low stock items right now.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <PackageOpen className="text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Stock Insights
              </p>
              <p className="text-xs text-slate-500">
                Keep top-selling items stocked.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>
              Average stock per SKU:{" "}
              {Math.round(
                medicines.length
                  ? medicines.reduce(
                      (sum, item) => sum + Number(item.stock || 0),
                      0,
                    ) / medicines.length
                  : 0,
              )}
            </p>
            <p>Active SKUs: {medicines.length}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
