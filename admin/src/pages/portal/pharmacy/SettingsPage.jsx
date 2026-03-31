export default function PharmacySettingsRoutePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Settings
        </p>
        <h1 className="text-2xl font-black text-slate-900">
          Pharmacy Profile & Preferences
        </h1>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-extrabold text-slate-900">
            Pharmacy Profile
          </h2>
          <div className="mt-4 grid gap-4">
            <Field label="Pharmacy Name" placeholder="NiviDoc Pharmacy" />
            <Field label="Registration ID" placeholder="PHM-2024-0001" />
            <Field label="Support Email" placeholder="support@nividoc.com" />
            <Field label="Support Phone" placeholder="+91 98765 43210" />
            <Field label="Address" placeholder="Street, City, State" />
            <Field label="Operational Hours" placeholder="9:00 AM - 9:00 PM" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-extrabold text-slate-900">
            Bank Details
          </h2>
          <div className="mt-4 grid gap-4">
            <Field label="Account Holder Name" placeholder="NiviDoc Pharmacy" />
            <Field label="Account Number" placeholder="XXXX XXXX XXXX" />
            <Field label="IFSC Code" placeholder="HDFC0001234" />
            <Field label="Bank Name" placeholder="HDFC Bank" />
            <Field label="Branch" placeholder="Koramangala" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-extrabold text-slate-900">
            Notification Settings
          </h2>
          <div className="mt-4 space-y-3">
            <ToggleRow
              label="Order Updates"
              description="Get notified when order status changes."
            />
            <ToggleRow
              label="Low Stock Alerts"
              description="Daily alerts for low stock items."
            />
            <ToggleRow
              label="Payment Settlements"
              description="Updates on weekly settlements."
            />
            <ToggleRow
              label="Platform Announcements"
              description="Product updates and policy changes."
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-extrabold text-slate-900">Security</h2>
          <div className="mt-4 grid gap-4">
            <Field label="Current Password" type="password" />
            <Field label="New Password" type="password" />
            <Field label="Confirm Password" type="password" />
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-200">
              Update Password
            </button>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
              Enable 2FA in your account settings to protect pharmacy access.
            </div>
          </div>
        </div>
      </section>

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
          Cancel
        </button>
        <button className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-blue-200">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text" }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function ToggleRow({ label, description }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        className="relative h-6 w-11 rounded-full bg-blue-600 p-0.5"
        aria-label={label}
      >
        <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}
