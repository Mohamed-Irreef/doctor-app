import { Building2, Eye, ShieldBan, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import {
    deleteAdminPartner,
    getAdminApprovedPartners,
    getAdminPartnerDetails,
    toggleAdminPartnerBan,
} from "../services/api";

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "lab", label: "Labs" },
  { value: "pharmacy", label: "Pharmacies" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Banned" },
];

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800 wrap-break-word">
        {value || "-"}
      </p>
    </div>
  );
}

function statusPill(status) {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function renderContentTable(detail) {
  const content = detail?.content || [];
  if (!content.length) {
    return <p className="text-sm text-slate-500">No items added yet.</p>;
  }

  const isLab = detail.partnerType === "lab";

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Price</th>
            {!isLab ? <th className="px-3 py-2">Stock</th> : null}
            <th className="px-3 py-2">Approval</th>
            <th className="px-3 py-2">State</th>
          </tr>
        </thead>
        <tbody>
          {content.map((item) => (
            <tr key={item._id} className="border-t border-slate-100">
              <td className="px-3 py-2 font-semibold text-slate-800">
                {item.name}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {item.category || "-"}
              </td>
              <td className="px-3 py-2 text-slate-700">
                INR {Number(item.price || 0)}
              </td>
              {!isLab ? (
                <td className="px-3 py-2 text-slate-700">
                  {Number(item.stock || 0)}
                </td>
              ) : null}
              <td className="px-3 py-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-700">
                  {item.approvalStatus || "-"}
                </span>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    item.active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {item.active ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PartnersManagementPage() {
  const [partners, setPartners] = useState([]);
  const [summary, setSummary] = useState({ total: 0, labs: 0, pharmacies: 0 });
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const [toast, setToast] = useState({ message: "", type: "info" });
  const [busyKey, setBusyKey] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await getAdminApprovedPartners({ type, status, search });
    setLoading(false);

    if (response.status === "error") {
      setToast({
        message: response.error || "Failed to load partners",
        type: "error",
      });
      return;
    }

    setPartners(response.data?.items || []);
    setSummary(response.data?.summary || { total: 0, labs: 0, pharmacies: 0 });
  }, [type, status, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(
      () => setToast({ message: "", type: "info" }),
      2500,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const cards = useMemo(() => partners || [], [partners]);

  const openDetails = async (item) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);

    const response = await getAdminPartnerDetails(item._id);
    setDetailLoading(false);

    if (response.status === "error") {
      setToast({
        message: response.error || "Failed to load details",
        type: "error",
      });
      return;
    }

    setDetail(response.data);
  };

  const toggleBan = async (item) => {
    const nextBanned = item.partnerStatus === "active";
    const opKey = `${item._id}-${nextBanned ? "ban" : "unban"}`;
    setBusyKey(opKey);

    const response = await toggleAdminPartnerBan(item._id, nextBanned);
    setBusyKey("");

    if (response.status === "error") {
      setToast({ message: response.error || "Action failed", type: "error" });
      return;
    }

    setToast({
      message: nextBanned ? "Partner banned" : "Partner unbanned",
      type: "success",
    });
    await load();
  };

  const deletePartner = async (item) => {
    const okDelete = window.confirm(
      `Delete ${item.partnerType} ${item.labName || item.pharmacyName}? This will remove partner account and all their items.`,
    );
    if (!okDelete) return;

    const opKey = `${item._id}-delete`;
    setBusyKey(opKey);
    const response = await deleteAdminPartner(item._id);
    setBusyKey("");

    if (response.status === "error") {
      setToast({ message: response.error || "Delete failed", type: "error" });
      return;
    }

    setToast({ message: "Partner deleted", type: "success" });
    if (detail?._id === item._id) {
      setDetailOpen(false);
      setDetail(null);
    }
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Partners Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage approved labs and pharmacies, view profiles and content, ban
            or delete accounts.
          </p>
        </div>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            Total: {summary.total || 0}
          </span>
          <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700">
            Labs: {summary.labs || 0}
          </span>
          <span className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-teal-700">
            Pharmacies: {summary.pharmacies || 0}
          </span>
        </div>
      </div>

      <section className="panel-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by partner, city, email"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <p className="text-sm font-semibold text-slate-500">
            Loading approved partners...
          </p>
        ) : cards.length ? (
          cards.map((item) => {
            const label =
              item.partnerType === "lab" ? item.labName : item.pharmacyName;
            const banKey = `${item._id}-${item.partnerStatus === "active" ? "ban" : "unban"}`;
            const deleteKey = `${item._id}-delete`;
            return (
              <article
                key={item._id}
                className="panel-card flex flex-col gap-3 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {item.partnerType}
                    </p>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {label}
                    </h3>
                    <p className="text-xs text-slate-500">{item.email}</p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-bold capitalize ${statusPill(item.partnerStatus)}`}
                  >
                    {item.partnerStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2 text-xs font-semibold text-slate-600">
                  <span>Owner: {item.fullName || "-"}</span>
                  <span>City: {item.city || "-"}</span>
                  <span>Phone: {item.phone || "-"}</span>
                  <span>Items: {item.publishedItems || 0}</span>
                </div>

                <div className="mt-auto flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    onClick={() => openDetails(item)}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Eye size={14} /> View
                    </span>
                  </button>
                  <button
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                    disabled={busyKey === banKey}
                    onClick={() => toggleBan(item)}
                  >
                    <span className="inline-flex items-center gap-1">
                      <ShieldBan size={14} />
                      {busyKey === banKey
                        ? "Saving..."
                        : item.partnerStatus === "active"
                          ? "Ban"
                          : "Unban"}
                    </span>
                  </button>
                  <button
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                    disabled={busyKey === deleteKey}
                    onClick={() => deletePartner(item)}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Trash2 size={14} />
                      {busyKey === deleteKey ? "Deleting..." : "Delete"}
                    </span>
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="text-sm font-semibold text-slate-500">
            No approved partners found for this filter.
          </p>
        )}
      </section>

      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Partner Details"
        className="max-w-5xl"
      >
        {detailLoading ? (
          <p className="text-sm font-semibold text-slate-500">
            Loading details...
          </p>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Building2 size={16} />
              {detail.partnerType === "lab"
                ? "Lab Partner"
                : "Pharmacy Partner"}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Owner" value={detail.fullName} />
              <Field
                label="Business"
                value={detail.labName || detail.pharmacyName}
              />
              <Field label="Email" value={detail.email} />
              <Field label="Phone" value={detail.phone} />
              <Field label="Support Email" value={detail.supportEmail} />
              <Field label="Support Phone" value={detail.supportPhone} />
              <Field label="Address" value={detail.address} />
              <Field label="City" value={detail.city} />
              <Field label="State" value={detail.state} />
              <Field label="Pincode" value={detail.pincode} />
              <Field label="Approval Status" value={detail.approvalStatus} />
              <Field label="Partner Status" value={detail.partnerStatus} />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-extrabold text-slate-900">
                {detail.partnerType === "lab"
                  ? "Lab Tests"
                  : "Pharmacy Products"}
              </h3>
              {renderContentTable(detail)}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Partner details unavailable.</p>
        )}
      </Modal>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </div>
  );
}
