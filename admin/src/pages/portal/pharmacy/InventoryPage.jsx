import { AlertTriangle, PackageOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePharmacyPortal } from "./PharmacyPortalContext";
import { EmptyState, ErrorState, TableSkeleton } from "./UiKit";

export default function PharmacyInventoryRoutePage() {
  const navigate = useNavigate();
  const {
    medicines,
    lowStockItems,
    medicinesError,
    loadingMedicines,
    load,
    selectMedicine,
    removeMedicine,
  } = usePharmacyPortal();

  const [selectedMedicine, setSelectedMedicine] = useState(null);

  const approvedMedicines = useMemo(
    () =>
      medicines.filter(
        (item) =>
          String(item.approvalStatus).toLowerCase() === "approved" &&
          item.isApproved !== false,
      ),
    [medicines],
  );

  const approvedLowStockItems = lowStockItems.filter((item) =>
    approvedMedicines.some((approved) => approved._id === item._id),
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">Inventory</h2>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
            {approvedLowStockItems.length} low stock
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
                <th className="py-3">Display</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicinesError ? (
                <tr>
                  <td colSpan={7} className="py-6">
                    <ErrorState
                      title="Connection Issue"
                      message={medicinesError}
                      onRetry={load}
                    />
                  </td>
                </tr>
              ) : loadingMedicines ? (
                <tr>
                  <td colSpan={7} className="py-6">
                    <TableSkeleton rows={5} />
                  </td>
                </tr>
              ) : approvedMedicines.length ? (
                approvedMedicines.map((item) => {
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
                      <td>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            item.active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedMedicine(item)}
                            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              selectMedicine(item);
                              navigate("/portal/pharmacy/products");
                            }}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = window.confirm(
                                `Delete ${item.name}? This action cannot be undone.`,
                              );
                              if (!ok) return;
                              await removeMedicine(item._id);
                            }}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6">
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
            {approvedLowStockItems.length ? (
              approvedLowStockItems.slice(0, 4).map((item) => (
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
                approvedMedicines.length
                  ? approvedMedicines.reduce(
                      (sum, item) => sum + Number(item.stock || 0),
                      0,
                    ) / approvedMedicines.length
                  : 0,
              )}
            </p>
            <p>Active SKUs: {approvedMedicines.length}</p>
          </div>
        </div>
      </section>

      {selectedMedicine ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                Product Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMedicine(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Detail label="Name" value={selectedMedicine.name} />
              <Detail
                label="Generic Name"
                value={selectedMedicine.genericName}
              />
              <Detail label="Brand" value={selectedMedicine.brand} />
              <Detail label="Category" value={selectedMedicine.category} />
              <Detail
                label="Subcategory"
                value={selectedMedicine.subcategory}
              />
              <Detail
                label="Price"
                value={`Rs ${selectedMedicine.price || 0}`}
              />
              <Detail label="MRP" value={`Rs ${selectedMedicine.mrp || 0}`} />
              <Detail label="Stock" value={selectedMedicine.stock} />
              <Detail
                label="Low Stock Threshold"
                value={selectedMedicine.lowStockThreshold}
              />
              <Detail
                label="Batch Number"
                value={selectedMedicine.batchNumber}
              />
              <Detail
                label="Expiry Date"
                value={
                  selectedMedicine.expiryDate
                    ? String(selectedMedicine.expiryDate).slice(0, 10)
                    : "-"
                }
              />
              <Detail
                label="Display"
                value={selectedMedicine.active ? "Active" : "Inactive"}
              />
            </div>

            {selectedMedicine.description ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {selectedMedicine.description}
                </p>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product Image
                </p>
                {selectedMedicine.image ? (
                  <img
                    src={selectedMedicine.image}
                    alt={selectedMedicine.name || "Product"}
                    className="mt-2 h-44 w-full rounded-lg object-contain bg-slate-50"
                  />
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No image uploaded.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product Document
                </p>
                {selectedMedicine.pdfUrl ? (
                  <a
                    href={selectedMedicine.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    Open Document
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No document uploaded.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800 break-words">
        {value || "-"}
      </p>
    </div>
  );
}
