import {
  BarChart3,
  ClipboardList,
  DollarSign,
  PackagePlus,
  Pill,
  Settings,
  Shield,
  Truck,
  User,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createPharmacyPartnerMedicine,
  getPharmacyPartnerDashboard,
  getPharmacyPartnerMedicines,
  getPharmacyPartnerOrders,
  updatePharmacyPartnerMedicine,
  updatePharmacyPartnerOrderStatus,
} from "../../services/api";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "products", label: "Products", icon: Pill },
  { key: "add-edit", label: "Add/Edit Product", icon: PackagePlus },
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "inventory", label: "Inventory", icon: Warehouse },
  { key: "earnings", label: "Earnings", icon: DollarSign },
  { key: "profile", label: "Profile", icon: User },
  { key: "settings", label: "Settings", icon: Settings },
];

const ORDER_FLOW = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

const EMPTY_FORM = {
  name: "",
  category: "",
  brand: "",
  composition: "",
  description: "",
  image: "",
  manufacturer: "",
  packSize: "",
  price: 0,
  mrp: 0,
  stock: 0,
  lowStockThreshold: 10,
  deliveryEtaHours: 24,
  prescriptionRequired: false,
  usageInstructions: "",
};

export default function PharmacyPortalPage() {
  const [activePage, setActivePage] = useState("dashboard");
  const [dashboard, setDashboard] = useState({});
  const [medicines, setMedicines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [d, m, o] = await Promise.all([
      getPharmacyPartnerDashboard(),
      getPharmacyPartnerMedicines(),
      getPharmacyPartnerOrders(),
    ]);
    if (d.status === "success") setDashboard(d.data || {});
    if (m.status === "success") setMedicines(m.data || []);
    if (o.status === "success") setOrders(o.data || []);
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
  }, []);

  const lowStockItems = useMemo(
    () =>
      medicines.filter(
        (item) =>
          Number(item.stock || 0) <= Number(item.lowStockThreshold || 10),
      ),
    [medicines],
  );

  const pendingOrders = useMemo(
    () =>
      orders.filter(
        (item) =>
          !["delivered", "cancelled"].includes(
            String(item.status).toLowerCase(),
          ),
      ),
    [orders],
  );

  const selectMedicine = (item) => {
    setEditingId(item._id);
    setActivePage("add-edit");
    setForm({
      ...EMPTY_FORM,
      ...item,
      price: Number(item.price || 0),
      mrp: Number(item.mrp || item.price || 0),
      stock: Number(item.stock || 0),
      lowStockThreshold: Number(item.lowStockThreshold || 10),
      deliveryEtaHours: Number(item.deliveryEtaHours || 24),
    });
  };

  const submitMedicine = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      ...form,
      price: Number(form.price),
      mrp: Number(form.mrp || form.price),
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold || 10),
      deliveryEtaHours: Number(form.deliveryEtaHours || 24),
    };

    const response = editingId
      ? await updatePharmacyPartnerMedicine(editingId, payload)
      : await createPharmacyPartnerMedicine(payload);

    if (response.status === "error") {
      setError(response.error || "Unable to save medicine");
      return;
    }

    setForm(EMPTY_FORM);
    setEditingId(null);
    await load();
  };

  const updateOrder = async (id, status) => {
    const response = await updatePharmacyPartnerOrderStatus(id, {
      status,
      note: `Status updated to ${status}`,
    });

    if (response.status === "error") {
      setError(response.error || "Unable to update order");
      return;
    }

    await load();
  };

  const renderDashboard = () => (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Approved Medicines"
          value={dashboard.medicinesCount || 0}
        />
        <StatCard label="Orders" value={dashboard.ordersCount || 0} />
        <StatCard label="In Transit" value={dashboard.inTransitCount || 0} />
        <StatCard label="Revenue" value={`Rs ${dashboard.revenue || 0}`} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-extrabold text-slate-900">
          Operations Snapshot
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MiniTile
            title="Queued Orders"
            value={pendingOrders.length}
            tone="bg-amber-50 text-amber-700"
          />
          <MiniTile
            title="Low Stock Alerts"
            value={lowStockItems.length}
            tone="bg-rose-50 text-rose-700"
          />
          <MiniTile
            title="Pharmacy Share"
            value={`Rs ${dashboard.pharmacyShare || 0}`}
            tone="bg-emerald-50 text-emerald-700"
          />
        </div>
      </section>
    </div>
  );

  const renderProducts = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-extrabold text-slate-900">Products</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2">Name</th>
              <th className="py-2">Brand</th>
              <th className="py-2">Pricing</th>
              <th className="py-2">Stock</th>
              <th className="py-2">Approval</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((item) => (
              <tr
                key={item._id}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="py-3 font-semibold text-slate-800">
                  {item.name}
                </td>
                <td>{item.brand || "-"}</td>
                <td>Rs {item.price}</td>
                <td>{item.stock}</td>
                <td className="capitalize">{item.approvalStatus}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => selectMedicine(item)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderAddEdit = () => (
    <form
      onSubmit={submitMedicine}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-2"
    >
      <h2 className="md:col-span-2 text-lg font-extrabold text-slate-900">
        {editingId ? "Edit Product" : "Add Product"}
      </h2>
      <Input
        value={form.name}
        onChange={(value) => setForm({ ...form, name: value })}
        placeholder="Medicine name"
        required
      />
      <Input
        value={form.brand}
        onChange={(value) => setForm({ ...form, brand: value })}
        placeholder="Brand"
      />
      <Input
        value={form.category}
        onChange={(value) => setForm({ ...form, category: value })}
        placeholder="Category"
        required
      />
      <Input
        value={form.composition}
        onChange={(value) => setForm({ ...form, composition: value })}
        placeholder="Composition"
      />
      <Input
        type="number"
        value={form.price}
        onChange={(value) => setForm({ ...form, price: value })}
        placeholder="Selling price"
        required
      />
      <Input
        type="number"
        value={form.mrp}
        onChange={(value) => setForm({ ...form, mrp: value })}
        placeholder="MRP"
        required
      />
      <Input
        type="number"
        value={form.stock}
        onChange={(value) => setForm({ ...form, stock: value })}
        placeholder="Stock"
        required
      />
      <Input
        type="number"
        value={form.lowStockThreshold}
        onChange={(value) => setForm({ ...form, lowStockThreshold: value })}
        placeholder="Low stock threshold"
      />
      <Input
        value={form.packSize}
        onChange={(value) => setForm({ ...form, packSize: value })}
        placeholder="Pack size"
      />
      <Input
        value={form.manufacturer}
        onChange={(value) => setForm({ ...form, manufacturer: value })}
        placeholder="Manufacturer"
      />
      <Input
        type="number"
        value={form.deliveryEtaHours}
        onChange={(value) => setForm({ ...form, deliveryEtaHours: value })}
        placeholder="Delivery ETA (hours)"
      />
      <Input
        value={form.image}
        onChange={(value) => setForm({ ...form, image: value })}
        placeholder="Image URL"
      />
      <textarea
        className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
        placeholder="Usage instructions"
        value={form.usageInstructions}
        onChange={(event) =>
          setForm({ ...form, usageInstructions: event.target.value })
        }
      />
      <textarea
        className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
        placeholder="Description"
        value={form.description}
        onChange={(event) =>
          setForm({ ...form, description: event.target.value })
        }
      />
      <label className="md:col-span-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={Boolean(form.prescriptionRequired)}
          onChange={(event) =>
            setForm({ ...form, prescriptionRequired: event.target.checked })
          }
        />
        Prescription required
      </label>
      {error ? (
        <p className="md:col-span-2 text-sm font-semibold text-rose-600">
          {error}
        </p>
      ) : null}
      <div className="md:col-span-2 flex flex-wrap gap-2">
        <button className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white">
          {editingId ? "Update and Re-submit" : "Submit for Approval"}
        </button>
        {editingId ? (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY_FORM);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
          >
            Cancel Edit
          </button>
        ) : null}
      </div>
    </form>
  );

  const renderOrders = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-extrabold text-slate-900">Order Lifecycle</h2>
      <div className="mt-4 space-y-3">
        {orders.map((item) => (
          <div
            key={item._id}
            className="rounded-xl border border-slate-200 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-black text-slate-800">
                  Order #{item._id?.slice(-8)}
                </p>
                <p className="text-xs text-slate-500">
                  {item.user?.name || "Patient"} • Rs {item.amount} •{" "}
                  {item.deliveryAddress || "Address pending"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={15} className="text-sky-600" />
                <select
                  value={item.status}
                  onChange={(event) =>
                    updateOrder(item._id, event.target.value)
                  }
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                >
                  {ORDER_FLOW.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderInventory = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-extrabold text-slate-900">
        Inventory Alerts
      </h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {lowStockItems.length ? (
          lowStockItems.map((item) => (
            <div
              key={item._id}
              className="rounded-xl border border-rose-200 bg-rose-50 p-3"
            >
              <p className="font-bold text-rose-800">{item.name}</p>
              <p className="text-sm text-rose-700">
                Stock {item.stock} / Alert Threshold{" "}
                {item.lowStockThreshold || 10}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm font-semibold text-slate-500">
            No low-stock medicines right now.
          </p>
        )}
      </div>
    </section>
  );

  const renderEarnings = () => (
    <section className="grid gap-4 md:grid-cols-3">
      <StatCard label="Total Revenue" value={`Rs ${dashboard.revenue || 0}`} />
      <StatCard
        label="Admin Share (20%)"
        value={`Rs ${dashboard.adminShare || 0}`}
      />
      <StatCard
        label="Pharmacy Share (80%)"
        value={`Rs ${dashboard.pharmacyShare || 0}`}
      />
    </section>
  );

  const renderProfile = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-extrabold text-slate-900">
        Pharmacy Profile
      </h2>
      <p className="mt-3 text-sm text-slate-600">
        Profile updates are managed in business registration records. This page
        is reserved for verified profile and compliance displays.
      </p>
    </section>
  );

  const renderSettings = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="text-lg font-extrabold text-slate-900">Order Settings</h2>
      <p className="mt-3 text-sm text-slate-600">
        Lifecycle control is enabled: placed → confirmed → packed → shipped →
        delivered. Invalid jumps are blocked server-side.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
        <Shield size={15} />
        Payment verification enforced before confirmation
      </div>
    </section>
  );

  const pageBody = {
    dashboard: renderDashboard(),
    products: renderProducts(),
    "add-edit": renderAddEdit(),
    orders: renderOrders(),
    inventory: renderInventory(),
    earnings: renderEarnings(),
    profile: renderProfile(),
    settings: renderSettings(),
  }[activePage];

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto flex max-w-7xl gap-4">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft md:block">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Pharmacy Console
          </p>
          <h1 className="mt-2 text-xl font-black text-slate-900">
            Admin Dashboard
          </h1>
          <nav className="mt-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActivePage(item.key)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                  activePage === item.key
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Production Environment
              </p>
              <p className="text-xl font-black text-slate-900">
                Pharmacy Operations
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:hidden">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActivePage(item.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    activePage === item.key
                      ? "bg-sky-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-soft">
              Loading pharmacy dashboard...
            </div>
          ) : (
            pageBody
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function MiniTile({ title, value, tone }) {
  return (
    <div className={`rounded-xl p-3 ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
      placeholder={placeholder}
      required={required}
    />
  );
}
