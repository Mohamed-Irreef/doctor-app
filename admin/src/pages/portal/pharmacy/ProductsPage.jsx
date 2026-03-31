import { FileText, ImagePlus } from "lucide-react";
import { useMemo, useState } from "react";
import { usePharmacyPortal } from "./PharmacyPortalContext";
import { EmptyState, ErrorState, TableSkeleton } from "./UiKit";

const TABS = [
  { key: "basic", label: "Basic" },
  { key: "pricing", label: "Pricing" },
  { key: "inventory", label: "Inventory" },
  { key: "medical", label: "Medical Info" },
  { key: "media", label: "Media" },
  { key: "seo", label: "SEO & Settings" },
];

const DOSAGE_FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Drops"];
const GST_OPTIONS = [0, 5, 12, 18];
const SCHEDULE_TYPES = ["otc", "h", "h1", "x"];

export default function PharmacyProductsRoutePage() {
  const {
    medicines,
    form,
    setForm,
    editingId,
    error,
    medicinesError,
    loadingMedicines,
    selectMedicine,
    resetForm,
    submitMedicine,
    load,
  } = usePharmacyPortal();

  const [activeSection, setActiveSection] = useState("catalogue");
  const [activeTab, setActiveTab] = useState("basic");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return medicines;
    const needle = search.toLowerCase();
    return medicines.filter((item) =>
      `${item.name} ${item.brand} ${item.category}`
        .toLowerCase()
        .includes(needle),
    );
  }, [medicines, search]);

  const mrp = Number(form.mrp || 0);
  const price = Number(form.price || 0);
  const discountPercent = mrp
    ? Math.max(0, Math.round(((mrp - price) / mrp) * 100))
    : 0;
  const gstPercent = Number(form.gstPercent || 0);
  const finalPrice = price + (price * gstPercent) / 100;
  const tabKeys = TABS.map((tab) => tab.key);
  const currentTabIndex = tabKeys.indexOf(activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabKeys.length - 1;

  const goToPrevTab = () => {
    if (currentTabIndex > 0) setActiveTab(tabKeys[currentTabIndex - 1]);
  };

  const goToNextTab = () => {
    if (currentTabIndex < tabKeys.length - 1)
      setActiveTab(tabKeys[currentTabIndex + 1]);
  };

  const handleSubmit = async (event) => {
    const ok = await submitMedicine(event);
    if (ok) setActiveTab("basic");
  };

  const updateField = (key, value) => {
    const next = { ...form, [key]: value };
    if (key === "name") {
      next.slug = String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (key === "price" || key === "mrp") {
      next.discountPercent = discountPercent;
      next.finalPrice = finalPrice;
    }
    setForm(next);
  };

  const handleFileUpload = (event, key) => {
    const file = event.target.files?.[0];
    if (!file) return;
    updateField(key, file);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Products
            </p>
            <h2 className="text-xl font-black text-slate-900">
              {activeSection === "catalogue"
                ? "Pharmacy Catalogue"
                : editingId
                  ? "Edit Medicine"
                  : "Add New Medicine"}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSection("catalogue")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeSection === "catalogue"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Pharmacy Catalogue
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("builder")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeSection === "builder"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Add New Medicine
            </button>
          </div>
        </div>

        {activeSection === "catalogue" ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3">Product</th>
                  <th className="py-3">Brand</th>
                  <th className="py-3">Price</th>
                  <th className="py-3">Stock</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medicinesError ? (
                  <tr>
                    <td colSpan={6} className="py-6">
                      <ErrorState
                        title="Connection Issue"
                        message={medicinesError}
                        onRetry={load}
                      />
                    </td>
                  </tr>
                ) : loadingMedicines ? (
                  <tr>
                    <td colSpan={6} className="py-6">
                      <TableSkeleton rows={5} />
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b border-slate-100 transition hover:bg-slate-50/70 last:border-b-0"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-100">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                                Rx
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {item.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.category || "General"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>{item.brand || "-"}</td>
                      <td className="font-semibold">Rs {item.price}</td>
                      <td>{item.stock}</td>
                      <td>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {item.approvalStatus || "pending"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            selectMedicine(item);
                            setActiveSection("builder");
                          }}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6">
                      <EmptyState
                        title="No products yet"
                        description="Add medicines to start building your catalogue."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {editingId ? "Editing" : "Draft"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "basic" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Medicine Name"
                  required
                  value={form.name}
                  onChange={(value) => updateField("name", value)}
                  placeholder="e.g., Azithromycin 500"
                />
                <Field
                  label="Generic Name"
                  value={form.genericName}
                  onChange={(value) => updateField("genericName", value)}
                  placeholder="e.g., Azithromycin"
                />
                <Field
                  label="Brand Name"
                  value={form.brand}
                  onChange={(value) => updateField("brand", value)}
                  placeholder="Brand"
                />
                <Field
                  label="Category"
                  required
                  value={form.category}
                  onChange={(value) => updateField("category", value)}
                  placeholder="Antibiotic"
                />
                <Field
                  label="Subcategory"
                  value={form.subcategory}
                  onChange={(value) => updateField("subcategory", value)}
                  placeholder="Macrolide"
                />
                <Field
                  label="Composition"
                  value={form.composition}
                  onChange={(value) => updateField("composition", value)}
                  placeholder="Azithromycin 500mg"
                />
                <SelectField
                  label="Dosage Form"
                  value={form.dosageForm}
                  onChange={(value) => updateField("dosageForm", value)}
                  options={DOSAGE_FORMS}
                />
                <Field
                  label="Strength"
                  value={form.strength}
                  onChange={(value) => updateField("strength", value)}
                  placeholder="500mg"
                />
                <Field
                  label="Pack Size"
                  value={form.packSize}
                  onChange={(value) => updateField("packSize", value)}
                  placeholder="10 tablets"
                />
              </div>
            ) : null}

            {activeTab === "pricing" ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="grid gap-4 lg:col-span-2 md:grid-cols-2">
                  <Field
                    label="MRP"
                    type="number"
                    value={form.mrp}
                    onChange={(value) => updateField("mrp", value)}
                    placeholder="0.00"
                  />
                  <Field
                    label="Selling Price"
                    required
                    type="number"
                    value={form.price}
                    onChange={(value) => updateField("price", value)}
                    placeholder="0.00"
                  />
                  <Field
                    label="Discount (%)"
                    type="number"
                    value={form.discountPercent || discountPercent}
                    onChange={(value) => updateField("discountPercent", value)}
                    placeholder="Auto"
                  />
                  <SelectField
                    label="GST (%)"
                    value={form.gstPercent}
                    onChange={(value) => updateField("gstPercent", value)}
                    options={GST_OPTIONS.map((opt) => String(opt))}
                  />
                  <Field
                    label="Final Price"
                    value={finalPrice.toFixed(2)}
                    onChange={() => {}}
                    disabled
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pricing Summary
                  </p>
                  <div className="mt-3 space-y-2 text-sm font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">MRP</span>
                      <span>Rs {mrp || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Discount</span>
                      <span>{discountPercent}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">GST</span>
                      <span>{gstPercent}%</span>
                    </div>
                    <div className="mt-4 rounded-xl bg-white px-3 py-2 text-base font-black text-slate-900 shadow-sm">
                      Final: Rs {finalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "inventory" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Stock Quantity"
                  required
                  type="number"
                  value={form.stock}
                  onChange={(value) => updateField("stock", value)}
                />
                <Field
                  label="Minimum Stock Alert"
                  type="number"
                  value={form.lowStockThreshold}
                  onChange={(value) => updateField("lowStockThreshold", value)}
                />
                <Field
                  label="Batch Number"
                  value={form.batchNumber}
                  onChange={(value) => updateField("batchNumber", value)}
                />
                <Field
                  label="Expiry Date"
                  type="date"
                  value={form.expiryDate}
                  onChange={(value) => updateField("expiryDate", value)}
                />
                <Field
                  label="Manufacture Date"
                  type="date"
                  value={form.manufactureDate}
                  onChange={(value) => updateField("manufactureDate", value)}
                />
                <Field
                  label="Storage Conditions"
                  value={form.storageConditions}
                  onChange={(value) => updateField("storageConditions", value)}
                  placeholder="Keep in a cool, dry place"
                />
                <Field
                  label="Min Order Quantity"
                  type="number"
                  value={form.minOrderQuantity}
                  onChange={(value) => updateField("minOrderQuantity", value)}
                />
                <Field
                  label="Max Order Quantity"
                  type="number"
                  value={form.maxOrderQuantity}
                  onChange={(value) => updateField("maxOrderQuantity", value)}
                />
                <Field
                  label="Delivery ETA (hours)"
                  type="number"
                  value={form.deliveryEtaHours}
                  onChange={(value) => updateField("deliveryEtaHours", value)}
                />
              </div>
            ) : null}

            {activeTab === "medical" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <TextArea
                  label="Usage Instructions"
                  value={form.usageInstructions}
                  onChange={(value) => updateField("usageInstructions", value)}
                />
                <TextArea
                  label="Indications"
                  value={form.indications}
                  onChange={(value) => updateField("indications", value)}
                />
                <TextArea
                  label="Dosage Instructions"
                  value={form.dosageInstructions}
                  onChange={(value) => updateField("dosageInstructions", value)}
                />
                <TextArea
                  label="Side Effects"
                  helper="Separate each item with a new line"
                  value={form.sideEffects}
                  onChange={(value) => updateField("sideEffects", value)}
                />
                <TextArea
                  label="Precautions"
                  value={form.precautions}
                  onChange={(value) => updateField("precautions", value)}
                />
                <TextArea
                  label="Drug Interactions"
                  helper="Separate each item with a new line"
                  value={form.drugInteractions}
                  onChange={(value) => updateField("drugInteractions", value)}
                />
                <TextArea
                  label="Contraindications"
                  helper="Separate each item with a new line"
                  value={form.contraindications}
                  onChange={(value) => updateField("contraindications", value)}
                />
                <TextArea
                  label="Description"
                  value={form.description}
                  onChange={(value) => updateField("description", value)}
                />
              </div>
            ) : null}

            {activeTab === "media" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center transition hover:border-blue-200">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleFileUpload(event, "image")}
                  />
                  <ImagePlus className="mx-auto text-slate-400" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Upload product image
                  </p>
                  <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                </label>
                <label className="cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center transition hover:border-blue-200">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => handleFileUpload(event, "pdfUrl")}
                  />
                  <FileText className="mx-auto text-slate-400" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Upload PDF document
                  </p>
                  <p className="text-xs text-slate-400">PDF up to 10MB</p>
                </label>
              </div>
            ) : null}

            {activeTab === "seo" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Search Keywords"
                  value={form.keywords}
                  onChange={(value) => updateField("keywords", value)}
                  placeholder="antibiotic, fever"
                />
                <Field
                  label="Tags"
                  value={form.tags}
                  onChange={(value) => updateField("tags", value)}
                  placeholder="Prescription, Adult"
                />
                <Field
                  label="Slug"
                  value={form.slug}
                  onChange={(value) => updateField("slug", value)}
                />
                <SelectField
                  label="Schedule Type"
                  value={form.scheduleType}
                  onChange={(value) => updateField("scheduleType", value)}
                  options={SCHEDULE_TYPES}
                />
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(form.prescriptionRequired)}
                    onChange={(event) =>
                      updateField("prescriptionRequired", event.target.checked)
                    }
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Prescription Required
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(form.featured)}
                    onChange={(event) =>
                      updateField("featured", event.target.checked)
                    }
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    Featured Product
                  </span>
                </div>
              </div>
            ) : null}

            {error ? (
              <ErrorState
                title="Unable to save"
                message={error}
                onRetry={() => load()}
              />
            ) : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              {isLastTab ? (
                <div className="ml-auto flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateField("status", "draft")}
                    className="rounded-xl border border-blue-600 px-4 py-2 text-sm font-bold text-blue-600"
                  >
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-blue-200"
                  >
                    {editingId ? "Update & Submit" : "Submit for Approval"}
                  </button>
                </div>
              ) : (
                <>
                  {isFirstTab ? null : (
                    <button
                      type="button"
                      onClick={goToPrevTab}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={goToNextTab}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-blue-200"
                  >
                    Continue
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  helper,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  disabled,
}) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      <span>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      {helper ? <p className="text-xs text-slate-400">{helper}</p> : null}
    </label>
  );
}

function TextArea({ label, helper, value, onChange }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      {helper ? <p className="text-xs text-slate-400">{helper}</p> : null}
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {String(option).toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
