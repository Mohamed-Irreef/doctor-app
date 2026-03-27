import {
    Activity,
    Bell,
    Calendar,
    ChevronDown,
    ChevronRight,
    Clock,
    CreditCard,
    FlaskConical,
    LayoutDashboard,
    LogOut,
    Pill,
    Settings,
    ShieldCheck,
    ShoppingCart,
    Star,
    Stethoscope,
    UserCheck,
    UserPlus,
    Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const NAV_SECTIONS = [
  {
    label: "Core",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/appointments", icon: Calendar, label: "Appointments" },
      { to: "/slots", icon: Clock, label: "Slots" },
      { to: "/patients", icon: Users, label: "Patients" },
    ],
  },
  {
    label: "Management",
    items: [
      {
        icon: Stethoscope,
        label: "Doctors",
        key: "doctors",
        children: [
          { to: "/doctors/requests", icon: UserPlus, label: "Requests" },
          { to: "/doctors", icon: UserCheck, label: "Approved" },
        ],
      },
      { to: "/lab-tests", icon: FlaskConical, label: "Lab Tests" },
      { to: "/pharmacy", icon: Pill, label: "Pharmacy" },
      { to: "/orders", icon: ShoppingCart, label: "Orders" },
      { to: "/payments", icon: CreditCard, label: "Payments" },
      { to: "/reviews", icon: Star, label: "Reviews" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/notifications", icon: Bell, label: "Notifications" },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

const linkBase =
  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200";
const active =
  "bg-blue-50/90 text-blue-700 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.15)]";
const inactive = "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900";

export default function Sidebar({ mobileOpen, onCloseMobile, collapsed }) {
  const navigate = useNavigate();
  const [doctorsOpen, setDoctorsOpen] = useState(true);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <div
        onClick={onCloseMobile}
        className={`fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[260px] flex-col border-r border-white/60 bg-white/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          collapsed ? "lg:w-[84px]" : "lg:w-[260px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mx-3 mt-3 flex h-[66px] items-center gap-3 rounded-2xl border border-white/80 bg-gradient-to-br from-blue-500 to-indigo-500 px-4 text-white shadow-lg shadow-blue-200/60">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Stethoscope size={18} />
          </div>
          {!collapsed && (
            <div>
              <p className="text-base font-extrabold leading-tight">NiviDoc</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-blue-100">
                Admin Control
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 px-4 text-xs font-semibold text-slate-500">
          <Activity size={14} />
          {!collapsed && <span>Operational Pulse: Stable</span>}
        </div>

        <nav className="scrollbar-thin mt-5 flex-1 space-y-5 overflow-y-auto px-3 pb-5">
          {NAV_SECTIONS.map((section) => (
            <section key={section.label} className="space-y-2">
              {!collapsed && (
                <h4 className="px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {section.label}
                </h4>
              )}

              {section.items.map((item) => {
                if (item.children) {
                  return (
                    <div key={item.key} className="space-y-1">
                      <button
                        type="button"
                        title={collapsed ? item.label : undefined}
                        className={`${linkBase} ${inactive} w-full ${collapsed ? "justify-center" : "justify-between"}`}
                        onClick={() => setDoctorsOpen((open) => !open)}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={18} />
                          {!collapsed && item.label}
                        </div>
                        {!collapsed &&
                          (doctorsOpen ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          ))}
                      </button>

                      {doctorsOpen && !collapsed && (
                        <div className="ml-4 space-y-1 border-l border-slate-200/80 pl-3">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              end
                              onClick={onCloseMobile}
                              className={({ isActive }) =>
                                `${linkBase} ${isActive ? active : inactive}`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  {isActive && (
                                    <span className="absolute -left-[13px] top-2.5 h-6 w-[3px] rounded-full bg-blue-600" />
                                  )}
                                  <child.icon size={16} />
                                  {child.label}
                                </>
                              )}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    title={collapsed ? item.label : undefined}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `${linkBase} ${isActive ? active : inactive} ${collapsed ? "justify-center" : ""}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute -left-3 top-2.5 h-6 w-[3px] rounded-full bg-blue-600" />
                        )}
                        <item.icon size={18} />
                        {!collapsed && item.label}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </section>
          ))}
        </nav>

        <div className="border-t border-slate-200/80 p-3">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <ShieldCheck size={16} className="text-teal-600" />
            {!collapsed && (
              <p className="text-xs font-semibold text-slate-600">
                Security audit synced 2 mins ago
              </p>
            )}
          </div>

          <button
            type="button"
            title={collapsed ? "Log Out" : undefined}
            className={`${linkBase} w-full text-red-600 hover:bg-red-50 ${collapsed ? "justify-center" : ""}`}
            onClick={handleLogout}
          >
            <LogOut size={18} />
            {!collapsed && "Log Out"}
          </button>
        </div>
      </aside>
    </>
  );
}
