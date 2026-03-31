import { useEffect, useState } from "react";
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
import { getEcosystemMetrics } from "../services/api";

export default function EcosystemMetricsPage() {
  const [data, setData] = useState({ totals: {}, revenue: [], approvals: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getEcosystemMetrics();
      if (res.status === "success") {
        setData(res.data || { totals: {}, revenue: [], approvals: {} });
      }
      setLoading(false);
    })();
  }, []);

  const revenueSeries = (data.revenue || []).map((item) => ({
    type: String(item._id || "").toUpperCase(),
    gross: Number(item.gross || 0),
    platform: Number(item.platform || 0),
    partner: Math.max(0, Number(item.gross || 0) - Number(item.platform || 0)),
  }));

  const approvalSeries = [
    {
      segment: "Labs",
      approved: Number(data.approvals?.lab?.approved || 0),
      pending: Number(data.approvals?.lab?.pending || 0),
      rejected: Number(data.approvals?.lab?.rejected || 0),
    },
    {
      segment: "Pharmacies",
      approved: Number(data.approvals?.pharmacy?.approved || 0),
      pending: Number(data.approvals?.pharmacy?.pending || 0),
      rejected: Number(data.approvals?.pharmacy?.rejected || 0),
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-slate-900">
        Ecosystem Dashboard
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="panel-card p-4">
          <p className="text-xs text-slate-500">Total Revenue</p>
          <p className="text-3xl font-extrabold">
            ₹{data.totals?.totalRevenue || 0}
          </p>
        </div>
        <div className="panel-card p-4">
          <p className="text-xs text-slate-500">Platform Revenue</p>
          <p className="text-3xl font-extrabold">
            ₹{data.totals?.totalPlatformRevenue || 0}
          </p>
        </div>
        <div className="panel-card p-4">
          <p className="text-xs text-slate-500">Total Lab Bookings</p>
          <p className="text-3xl font-extrabold">
            {data.totals?.totalBookings || 0}
          </p>
        </div>
        <div className="panel-card p-4">
          <p className="text-xs text-slate-500">Total Pharmacy Orders</p>
          <p className="text-3xl font-extrabold">
            {data.totals?.totalOrders || 0}
          </p>
        </div>
        <div className="panel-card p-4">
          <p className="text-xs text-slate-500">Pending Approvals</p>
          <p className="text-3xl font-extrabold">
            {data.totals?.pendingApprovals || 0}
          </p>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel-card p-5">
          <h2 className="text-lg font-extrabold text-slate-900">
            Revenue Breakdown
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="gross" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="platform" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel-card p-5">
          <h2 className="text-lg font-extrabold text-slate-900">
            Approval Trends
          </h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={approvalSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="approved"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#d97706"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="rejected"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="panel-card p-5">
        <h2 className="text-lg font-extrabold text-slate-900">
          Revenue Analytics Table
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Type</th>
                <th>Gross</th>
                <th>Platform Share</th>
                <th>Partner Share</th>
              </tr>
            </thead>
            <tbody>
              {revenueSeries.map((item) => (
                <tr key={item.type} className="border-b last:border-b-0">
                  <td className="py-2 capitalize">{item.type.toLowerCase()}</td>
                  <td>₹{item.gross || 0}</td>
                  <td>₹{item.platform || 0}</td>
                  <td>₹{item.partner || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {loading && (
        <p className="text-sm font-semibold text-slate-500">
          Loading ecosystem analytics...
        </p>
      )}
    </div>
  );
}
