import {
    ArrowUpRight,
    ClipboardList,
    DollarSign,
    PackageCheck,
    Pill,
    Truck,
} from "lucide-react";
import { useMemo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { usePharmacyPortal } from "./PharmacyPortalContext";
import { CardSkeleton, EmptyState } from "./UiKit";

const revenueSeries = [42, 55, 48, 62, 70, 66, 84, 78, 92, 88, 104, 110];
const revenueLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function PharmacyDashboardRoutePage() {
  const {
    dashboard,
    pendingOrders,
    lowStockItems,
    medicines,
    orders,
    loadingDashboard,
    loadingOrders,
    loadingMedicines,
  } = usePharmacyPortal();

  const statusCounts = useMemo(() => {
    const initial = {
      placed: 0,
      confirmed: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
    };
    return orders.reduce((acc, item) => {
      const key = String(item.status || "placed").toLowerCase();
      if (acc[key] !== undefined) acc[key] += 1;
      return acc;
    }, initial);
  }, [orders]);

  const recentOrders = orders.slice(0, 4);
  const recentProducts = medicines.slice(0, 4);
  const revenueData = revenueSeries.map((value, index) => ({
    month: revenueLabels[index],
    revenue: value,
  }));
  const statusData = [
    { name: "Placed", value: statusCounts.placed },
    { name: "Confirmed", value: statusCounts.confirmed },
    { name: "Packed", value: statusCounts.packed },
    { name: "Shipped", value: statusCounts.shipped },
    { name: "Delivered", value: statusCounts.delivered },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Dashboard
          </p>
          <h1 className="text-2xl font-black text-slate-900">
            Pharmacy Overview
          </h1>
        </div>
        <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700">
          Download Report
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {loadingDashboard ? (
          Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} rows={1} />
          ))
        ) : (
          <>
            <MetricCard
              label="Total Products"
              value={dashboard.medicinesCount || medicines.length}
              icon={Pill}
              trend="+12%"
            />
            <MetricCard
              label="Total Orders"
              value={dashboard.ordersCount || orders.length}
              icon={ClipboardList}
              trend="+8%"
            />
            <MetricCard
              label="In Transit"
              value={dashboard.inTransitCount || statusCounts.shipped}
              icon={Truck}
              trend="+3%"
            />
            <MetricCard
              label="Total Revenue"
              value={`Rs ${dashboard.revenue || 0}`}
              icon={DollarSign}
              trend="+18%"
            />
          </>
        )}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {loadingDashboard ? (
          Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} rows={1} />
          ))
        ) : (
          <>
            <HighlightCard
              title="Queued Orders"
              value={pendingOrders.length}
              tone="amber"
            />
            <HighlightCard
              title="Low Stock Alerts"
              value={lowStockItems.length}
              tone="rose"
            />
            <HighlightCard
              title="Pharmacy Earnings"
              value={`Rs ${dashboard.pharmacyShare || 0}`}
              tone="emerald"
            />
          </>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Revenue Overview
              </h2>
              <p className="text-sm text-slate-500">
                Monthly performance trend
              </p>
            </div>
            <button className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">
              12 months
            </button>
          </div>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#E2E8F0",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-extrabold text-slate-900">
            Orders by Status
          </h2>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusData}
                layout="vertical"
                margin={{ left: 10 }}
              >
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#E2E8F0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#60A5FA" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">
              Latest Orders
            </h2>
            <button className="text-xs font-bold text-blue-600">
              View all
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {loadingOrders ? (
              <EmptyState
                title="Loading orders"
                description="Fetching recent orders"
              />
            ) : recentOrders.length ? (
              recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      #{order._id?.slice(-6)} · {order.user?.name || "Customer"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.deliveryAddress || "Delivery pending"}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {String(order.status || "placed").toUpperCase()}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No recent orders"
                description="New orders will appear here."
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">
              Recent Products
            </h2>
            <button className="text-xs font-bold text-blue-600">
              View all
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {loadingMedicines ? (
              <EmptyState
                title="Loading products"
                description="Fetching recent products"
              />
            ) : recentProducts.length ? (
              recentProducts.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <PackageCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.brand || "Generic"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    Rs {item.price}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No products added"
                description="Add products to start selling."
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-600">
        <ArrowUpRight size={14} /> {trend}
      </div>
    </div>
  );
}

function HighlightCard({ title, value, tone }) {
  const toneClasses = {
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-3 text-xs font-semibold">Updated just now</p>
    </div>
  );
}
