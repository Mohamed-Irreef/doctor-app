import {
    Calendar,
    CheckCircle2,
    Clock3,
    FlaskConical,
    IndianRupee,
    Stethoscope,
    Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import {
    getAdminAppointments,
    getAdminDashboard,
    getAdminDoctors,
    getAdminPatients,
    getAdminPayments,
} from "../services/api";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [
        dashboardRes,
        appointmentsRes,
        paymentsRes,
        doctorsRes,
        patientsRes,
      ] = await Promise.all([
        getAdminDashboard(),
        getAdminAppointments(),
        getAdminPayments(),
        getAdminDoctors(),
        getAdminPatients(),
      ]);

      if (dashboardRes.data) setDashboard(dashboardRes.data);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (doctorsRes.data) setDoctors(doctorsRes.data);
      if (patientsRes.data) setPatients(patientsRes.data);
    };
    load();
  }, []);

  const totalRevenue = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === "paid")
        .reduce((sum, payment) => sum + (payment.amount || 0), 0),
    [payments],
  );

  const weeklyBookings = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counters = days.map((day) => ({ day, bookings: 0 }));
    appointments.forEach((appointment) => {
      const day = new Date(appointment.date).getDay();
      counters[day].bookings += 1;
    });
    return counters;
  }, [appointments]);

  const revenueTrend = useMemo(() => {
    const monthMap = new Map();
    payments
      .filter((payment) => payment.status === "paid")
      .forEach((payment) => {
        const month = new Date(
          payment.paidAt || payment.createdAt,
        ).toLocaleDateString("en-US", {
          month: "short",
        });
        monthMap.set(month, (monthMap.get(month) || 0) + (payment.amount || 0));
      });
    return Array.from(monthMap.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }, [payments]);

  const activityItems = useMemo(
    () =>
      appointments.slice(0, 4).map((appointment, index) => ({
        id: appointment._id,
        title:
          appointment.status === "completed"
            ? "Consultation completed"
            : "Appointment confirmed",
        description: `${appointment.patient?.name || "Patient"} with ${appointment.doctor?.name || "Doctor"}`,
        time: appointment.time,
        icon:
          index % 3 === 0 ? Calendar : index % 3 === 1 ? CheckCircle2 : Clock3,
        tone: index % 3 === 0 ? "blue" : index % 3 === 1 ? "emerald" : "teal",
      })),
    [appointments],
  );

  const toneStyles = {
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    teal: "bg-teal-50 text-teal-700 ring-teal-200",
  };

  return (
    <div className="space-y-7">
      <PageHeader
        title="Dashboard Overview"
        description="Welcome to NiviDoc Admin. Track core healthcare operations and financial performance in real time."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={dashboard?.totals?.patientsCount || patients.length}
          icon={Users}
          trend={12}
          trendUp={true}
        />
        <StatCard
          title="Total Doctors"
          value={dashboard?.totals?.doctorsCount || doctors.length}
          icon={Stethoscope}
          trend={4}
          trendUp={true}
        />
        <StatCard
          title="Appointments Today"
          value={dashboard?.totals?.appointmentsToday || 0}
          icon={Calendar}
          trend={2}
          trendUp={false}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          icon={IndianRupee}
          trend={18}
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="panel-card soft-grid-bg p-6 xl:col-span-2">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Weekly Bookings
              </h3>
              <p className="text-sm text-slate-500">
                Daily consultation volume
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
              +8.6% vs last week
            </span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBookings}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: "#eff6ff" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 25px -12px rgb(15 23 42 / 0.35)",
                    fontWeight: 700,
                  }}
                />
                <Bar
                  dataKey="bookings"
                  fill="url(#bookingsGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient
                    id="bookingsGradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-card p-6">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Revenue Trend
              </h3>
              <p className="text-sm text-slate-500">Monthly collections</p>
            </div>
            <FlaskConical size={18} className="text-teal-500" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                  dx={-10}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  cursor={{ stroke: "#bfdbfe", strokeWidth: 2 }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 25px -12px rgb(15 23 42 / 0.35)",
                    fontWeight: 700,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fill="url(#areaBlue)"
                />
                <defs>
                  <linearGradient id="areaBlue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.32} />
                    <stop
                      offset="100%"
                      stopColor="#14B8A6"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel-card p-6">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-extrabold text-slate-900">
            Recent Activity
          </h3>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Live Timeline
          </span>
        </div>

        <div className="space-y-5">
          {activityItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-blue-100 hover:bg-blue-50/30"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${toneStyles[item.tone]}`}
              >
                <item.icon size={18} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">
                    {item.title}
                  </p>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {item.time}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {item.description}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Tracked by operations engine
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
