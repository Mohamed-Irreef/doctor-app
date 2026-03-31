import { ExternalLink, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { usePharmacyPortal } from "./PharmacyPortalContext";
import { EmptyState, ErrorState, TableSkeleton } from "./UiKit";

export default function PharmacyOrdersRoutePage() {
  const { orders, orderFlow, updateOrder, ordersError, loadingOrders, load } =
    usePharmacyPortal();
  const [selected, setSelected] = useState(null);
  const timeline = useMemo(
    () => ["placed", "confirmed", "packed", "shipped", "delivered"],
    [],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">Orders</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {orders.length} active
          </span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3">Order</th>
                <th className="py-3">Customer</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Status</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordersError ? (
                <tr>
                  <td colSpan={5} className="py-6">
                    <ErrorState
                      title="Connection Issue"
                      message={ordersError}
                      onRetry={load}
                    />
                  </td>
                </tr>
              ) : loadingOrders ? (
                <tr>
                  <td colSpan={5} className="py-6">
                    <TableSkeleton rows={5} />
                  </td>
                </tr>
              ) : orders.length ? (
                orders.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/70 last:border-b-0"
                  >
                    <td className="py-4 font-semibold text-slate-800">
                      #{item._id?.slice(-8)}
                    </td>
                    <td>{item.user?.name || "Patient"}</td>
                    <td className="font-semibold">Rs {item.amount}</td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(event) =>
                          updateOrder(item._id, event.target.value)
                        }
                        className="rounded-xl border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600"
                      >
                        {orderFlow.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6">
                    <EmptyState
                      title="No orders yet"
                      description="Orders will appear here as customers checkout."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="text-base font-extrabold text-slate-900">
          Order Details
        </h3>
        {selected ? (
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Customer
              </p>
              <p className="mt-1 font-semibold text-slate-800">
                {selected.user?.name || "Patient"}
              </p>
              <p className="text-xs text-slate-500">
                {selected.user?.email || "Email unavailable"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Address
              </p>
              <p className="mt-1 text-slate-600">
                {selected.deliveryAddress || "Address pending"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Payment Summary
              </p>
              <p className="mt-1 font-semibold text-slate-800">
                Rs {selected.amount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Tracking
              </p>
              <p className="mt-1 text-slate-600">
                {selected.trackingId || "Pending"}
              </p>
            </div>
            {selected.prescriptionUrl || selected.prescription?.url ? (
              <a
                href={selected.prescriptionUrl || selected.prescription?.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
              >
                <ExternalLink size={14} /> View Prescription
              </a>
            ) : (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                Prescription not attached
              </p>
            )}
            <div className="rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-700">
              <Truck size={14} className="inline-block" /> Status:{" "}
              {selected.status}
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Timeline
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {timeline.map((step) => {
                  const active =
                    timeline.indexOf(step) <=
                    timeline.indexOf(
                      String(selected.status || "").toLowerCase(),
                    );
                  return (
                    <span
                      key={step}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {step}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-500">
            Select an order to view details.
          </p>
        )}
      </aside>
    </div>
  );
}
