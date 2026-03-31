import {
    BarChart3,
    Bell,
    ClipboardList,
    DollarSign,
    LayoutGrid,
    Pill,
    Search,
    Settings,
    UserCircle,
    Warehouse,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
    PharmacyPortalProvider,
    usePharmacyPortal,
} from "./PharmacyPortalContext";
import { ErrorState } from "./UiKit";

const NAV_ITEMS = [
  { to: "/portal/pharmacy/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/portal/pharmacy/products", label: "Products", icon: Pill },
  { to: "/portal/pharmacy/orders", label: "Orders", icon: ClipboardList },
  { to: "/portal/pharmacy/inventory", label: "Inventory", icon: Warehouse },
  { to: "/portal/pharmacy/earnings", label: "Earnings", icon: DollarSign },
  { to: "/portal/pharmacy/settings", label: "Settings", icon: Settings },
];

function Shell() {
  const { load, loading, error } = usePharmacyPortal();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <aside
        className={`fixed inset-y-0 left-0 z-20 hidden border-r border-slate-200 bg-white p-4 shadow-soft transition-all md:block ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {sidebarCollapsed ? "" : "Navigation"}
          </p>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <LayoutGrid size={14} />
          </button>
        </div>
        <nav className="mt-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <item.icon size={16} />
              {sidebarCollapsed ? null : item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex w-full items-center gap-4 px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 md:hidden"
              aria-label="Open menu"
            >
              <LayoutGrid size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                <Pill size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Pharmacy Admin
                </p>
                <p className="text-lg font-black text-slate-900">
                  NiviDoc Pharmacy Hub
                </p>
              </div>
            </div>
            <div className="relative hidden flex-1 md:block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search products, orders, customers..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <Bell size={18} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-700 shadow-sm"
                >
                  <UserCircle size={20} className="text-blue-600" />
                  <span className="hidden sm:inline">Pharmacy Admin</span>
                </button>
                {profileOpen ? (
                  <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <UserCircle size={15} /> Profile
                    </button>
                    <NavLink
                      to="/portal/pharmacy/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <Settings size={15} /> Settings
                    </NavLink>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <UserCircle size={15} /> Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 pb-10 pt-6 sm:px-6">
          <main className="space-y-4">
            {error ? (
              <ErrorState
                title="Connection Issue"
                message={error}
                onRetry={load}
              />
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-soft">
                Loading pharmacy dashboard...
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm md:hidden">
          <div className="h-full w-72 bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Navigation
              </p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <LayoutGrid size={14} />
              </button>
            </div>
            <nav className="mt-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function PharmacyPortalLayout() {
  return (
    <PharmacyPortalProvider>
      <Shell />
    </PharmacyPortalProvider>
  );
}
