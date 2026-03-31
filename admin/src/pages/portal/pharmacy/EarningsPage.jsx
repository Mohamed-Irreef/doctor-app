import { ArrowUpRight } from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { usePharmacyPortal } from "./PharmacyPortalContext";
import { CardSkeleton, ErrorState } from "./UiKit";

const monthSeries = [22, 35, 28, 40, 48, 55, 62, 58, 74, 80, 86, 92];
const monthLabels = [
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

export default function PharmacyEarningsRoutePage() {
  const { dashboard, loadingDashboard, dashboardError, load } =
    usePharmacyPortal();
  const monthData = monthSeries.map((value, index) => ({
    month: monthLabels[index],
    revenue: value,
  }));
  const breakdownData = [
    { name: "Paid", value: Number(dashboard.revenue || 0) },
    { name: "Pending", value: Number(dashboard.pendingRevenue || 0) },
    { name: "Refunds", value: Number(dashboard.refundRevenue || 0) },
  ];

  return (
    <div className="space-y-4">
      {dashboardError ? (
        <ErrorState
          title="Connection Issue"
          message={dashboardError}
          onRetry={load}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {loadingDashboard ? (
          Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} rows={1} />
          ))
        ) : (
          <>
            <StatCard
              label="Total Revenue"
              value={`Rs ${dashboard.revenue || 0}`}
            />
            <StatCard
              label="Admin Share (20%)"
              value={`Rs ${dashboard.adminShare || 0}`}
            />
            <StatCard
              label="Pharmacy Share (80%)"
              value={`Rs ${dashboard.pharmacyShare || 0}`}
            />
          </>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Monthly Revenue
              </h2>
              <p className="text-sm text-slate-500">Last 12 months</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <ArrowUpRight size={12} /> +14%
            </span>
          </div>
          <div className="mt-4 h-48">
            {loadingDashboard ? (
              <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthData}>
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
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563EB"
                    fill="#93C5FD"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Earnings Breakdown
              </h3>
              <p className="text-xs text-slate-500">By payment status</p>
            </div>
          </div>
          <div className="mt-4 h-40">
            {loadingDashboard ? (
              <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: "#E2E8F0",
                      fontSize: 12,
                    }}
                  />
                  <Pie
                    data={breakdownData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={["#2563EB", "#93C5FD", "#F97316"][index % 3]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 space-y-3">
            <BreakdownRow label="Paid" value={`Rs ${dashboard.revenue || 0}`} />
            <BreakdownRow
              label="Pending"
              value={`Rs ${dashboard.pendingRevenue || 0}`}
            />
            <BreakdownRow
              label="Refunds"
              value={`Rs ${dashboard.refundRevenue || 0}`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function BreakdownRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
      <span>{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}
