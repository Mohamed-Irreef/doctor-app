import { useEffect, useState } from "react";
import {
    getPharmacyPartnerSettings,
    updatePharmacyPartnerSettings,
    uploadPublicFile,
} from "../../../services/api";

export default function PharmacySettingsRoutePage() {
  const emptyForm = {
    pharmacyName: "",
    registrationId: "",
    supportEmail: "",
    supportPhone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    operationalHours: "",
    logo: "",
  };
  const [form, setForm] = useState({
    ...emptyForm,
  });
  const [initialForm, setInitialForm] = useState({ ...emptyForm });
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const response = await getPharmacyPartnerSettings();
      if (response.status !== "success") {
        setMessage(response.error || "Unable to load settings.");
        return;
      }

      const data = response.data || {};
      setForm({
        pharmacyName: data.pharmacyName || "",
        registrationId: data.registrationId || "",
        supportEmail: data.supportEmail || "",
        supportPhone: data.supportPhone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
        operationalHours: data.operationalHours || "",
        logo: data.logo || "",
      });
      setInitialForm({
        pharmacyName: data.pharmacyName || "",
        registrationId: data.registrationId || "",
        supportEmail: data.supportEmail || "",
        supportPhone: data.supportPhone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
        operationalHours: data.operationalHours || "",
        logo: data.logo || "",
      });
    };

    load();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    setMessage("");

    let logoUrl = form.logo;
    if (logoFile) {
      const uploadRes = await uploadPublicFile(
        logoFile,
        "nividoc/pharmacy/logos",
      );
      if (uploadRes.status !== "success") {
        setSaving(false);
        setMessage(uploadRes.error || "Unable to upload logo.");
        return;
      }
      logoUrl = uploadRes.data?.url || logoUrl;
    }

    const payload = {
      pharmacyName: form.pharmacyName,
      supportEmail: form.supportEmail,
      supportPhone: form.supportPhone,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      operationalHours: form.operationalHours,
    };

    // Only send logo when it is an actual URL to satisfy backend validation.
    if (logoUrl && /^https?:\/\//i.test(logoUrl)) {
      payload.logo = logoUrl;
    }

    const response = await updatePharmacyPartnerSettings(payload);

    setSaving(false);
    if (response.status === "success") {
      const fresh = await getPharmacyPartnerSettings();
      const saved =
        fresh.status === "success" ? fresh.data || {} : response.data || {};
      const merged = {
        ...form,
        pharmacyName: saved.pharmacyName ?? form.pharmacyName,
        registrationId: saved.registrationId ?? form.registrationId,
        supportEmail: saved.supportEmail ?? form.supportEmail,
        supportPhone: saved.supportPhone ?? form.supportPhone,
        address: saved.address ?? form.address,
        city: saved.city ?? form.city,
        state: saved.state ?? form.state,
        pincode: saved.pincode ?? form.pincode,
        operationalHours: saved.operationalHours ?? form.operationalHours,
        logo: saved.logo ?? logoUrl ?? form.logo,
      };
      setForm(merged);
      setInitialForm(merged);
      setLogoFile(null);
      setMessage("Settings saved.");
    } else {
      setMessage(response.error || "Unable to save settings.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Settings
        </p>
        <h1 className="text-2xl font-black text-slate-900">Pharmacy Profile</h1>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-extrabold text-slate-900">
          Pharmacy Profile
        </h2>

        <div className="mt-4 grid gap-4">
          <Field
            label="Pharmacy Name"
            value={form.pharmacyName}
            onChange={(value) => updateField("pharmacyName", value)}
            placeholder="Enter pharmacy name"
          />
          <Field
            label="Registration ID"
            value={form.registrationId}
            placeholder="Registration ID"
            disabled
          />
          <Field
            label="Support Email"
            value={form.supportEmail}
            onChange={(value) => updateField("supportEmail", value)}
            placeholder="Enter support email"
          />
          <Field
            label="Support Phone"
            value={form.supportPhone}
            onChange={(value) => updateField("supportPhone", value)}
            placeholder="Enter support phone"
          />
          <Field
            label="Address"
            value={form.address}
            onChange={(value) => updateField("address", value)}
            placeholder="Enter street address"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="City"
              value={form.city}
              onChange={(value) => updateField("city", value)}
              placeholder="Enter city"
            />
            <Field
              label="State"
              value={form.state}
              onChange={(value) => updateField("state", value)}
              placeholder="Enter state"
            />
            <Field
              label="Pincode"
              value={form.pincode}
              onChange={(value) => updateField("pincode", value)}
              placeholder="Enter pincode"
            />
          </div>
          <Field
            label="Operational Hours"
            value={form.operationalHours}
            onChange={(value) => updateField("operationalHours", value)}
            placeholder="Enter operational hours"
          />

          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Company Logo</h4>
            {form.logo ? (
              <img
                src={form.logo}
                alt="Pharmacy logo"
                className="h-20 w-20 rounded-lg object-cover"
              />
            ) : null}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setLogoFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                  updateField("logo", String(reader.result || ""));
                };
                reader.readAsDataURL(file);
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
          onClick={() => {
            setForm(initialForm);
            setLogoFile(null);
            setMessage("");
          }}
        >
          Cancel
        </button>
        <button
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-blue-200 disabled:opacity-60"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message ? (
        <p className="text-sm font-medium text-slate-600">{message}</p>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  type = "text",
}) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
      />
    </label>
  );
}
