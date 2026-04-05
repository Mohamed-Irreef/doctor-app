import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import {
  getLabPartnerPackages,
  createLabPartnerPackage,
  updateLabPartnerPackage,
  deleteLabPartnerPackage,
  getLabPartnerTests,
} from "../../services/api";

const defaultPackageForm = {
  name: "",
  code: "",
  category: "General",
  tags: [],
  shortDescription: "",
  fullDescription: "",
  image: "",
  brochure: "",
  thumbnailImage: "",
  price: {
    original: "",
    offer: "",
    gst: "18",
  },
  tests: [],
  ageRange: { min: "", max: "" },
  gender: "All",
  suitableFor: [],
  details: {
    whoShouldBook: "",
    preparation: "",
    howItWorks: [],
    highlyRecommendedFor: [],
  },
  instructions: {
    before: "",
    after: "",
    collection: "",
  },
  status: "DRAFT",
};

const categoryOptions = ["General", "Women", "Senior", "Executive", "Diabetes", "Cardiac", "Full Body", "Other"];
const genderOptions = ["All", "Male", "Female"];

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
      active
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-slate-600 hover:text-slate-800"
    }`}
  >
    {label}
  </button>
);

const Field = ({ label, value, required = false, error, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {label} {required && <span className="text-rose-600">*</span>}
    </label>
    <input
      {...props}
      value={value}
      className={`w-full px-4 py-2 rounded-lg border ${
        error ? "border-rose-500 bg-rose-50" : "border-slate-300 bg-white"
      } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    />
    {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
  </div>
);

const TextAreaField = ({ label, value, required = false, error, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {label} {required && <span className="text-rose-600">*</span>}
    </label>
    <textarea
      {...props}
      value={value}
      rows={4}
      className={`w-full px-4 py-2 rounded-lg border ${
        error ? "border-rose-500 bg-rose-50" : "border-slate-300 bg-white"
      } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    />
    {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
  </div>
);

const SelectField = ({ label, value, options, required = false, error, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {label} {required && <span className="text-rose-600">*</span>}
    </label>
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-2 rounded-lg border ${
        error ? "border-rose-500 bg-rose-50" : "border-slate-300 bg-white"
      } text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      <option value="">Select {label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
  </div>
);

const FileField = ({ label, value, onChange, accept }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <input
      type="file"
      accept={accept}
      onChange={(e) => onChange(e.target.files?.[0])}
      className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    {value && <p className="text-xs text-slate-500 mt-1">✓ {value.name || "File selected"}</p>}
  </div>
);

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState(defaultPackageForm);
  const [activeTab, setActiveTab] = useState("basic");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [expandedTests, setExpandedTests] = useState({});

  const [packageImageFile, setPackageImageFile] = useState(null);
  const [brochureFile, setBrochureFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const [tagInput, setTagInput] = useState("");
  const [suitableForInput, setSuitableForInput] = useState("");
  const [howItWorksInput, setHowItWorksInput] = useState("");
  const [recommendedForInput, setRecommendedForInput] = useState("");

  const tabs = ["basic", "media", "pricing", "tests", "eligibility", "details", "instructions", "review"];

  useEffect(() => {
    loadPackages();
    loadTests();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await getLabPartnerPackages();
      if (res.status === "success") {
        setPackages(res.data || []);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load packages" });
    } finally {
      setLoading(false);
    }
  };

  const loadTests = async () => {
    try {
      const res = await getLabPartnerTests();
      if (res.status === "success") {
        setTests(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load tests:", err);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Package name is required";
    if (!form.price.original) newErrors.originalPrice = "Original price is required";
    if (!form.price.offer) newErrors.offerPrice = "Offer price is required";
    if (!form.tests.length) newErrors.tests = "Add at least one test";
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const files = {
        packageImageFile,
        brochureFile,
        thumbnailFile,
      };

      if (editing) {
        const res = await updateLabPartnerPackage(editing, form, files);
        if (res.status === "success") {
          setMessage({ type: "success", text: "Package updated successfully" });
          setShowForm(false);
          setEditing(null);
          loadPackages();
        } else {
          setMessage({ type: "error", text: res.error || "Failed to update package" });
        }
      } else {
        const res = await createLabPartnerPackage(form, files);
        if (res.status === "success") {
          setMessage({ type: "success", text: "Package submitted for approval" });
          setShowForm(false);
          loadPackages();
        } else {
          setMessage({ type: "error", text: res.error || "Failed to create package" });
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this package?")) {
      try {
        const res = await deleteLabPartnerPackage(id);
        if (res.status === "success") {
          setMessage({ type: "success", text: "Package deleted" });
          loadPackages();
        }
      } catch (err) {
        setMessage({ type: "error", text: "Failed to delete package" });
      }
    }
  };

  const calculateDiscount = () => {
    const original = Number(form.price.original || 0);
    const offer = Number(form.price.offer || 0);
    return original > 0 ? Math.round(((original - offer) / original) * 100) : 0;
  };

  const calculateFinalPrice = () => {
    const offer = Number(form.price.offer || 0);
    const gst = Number(form.price.gst || 0);
    return Math.round(offer * (1 + gst / 100));
  };

  const resetForm = () => {
    setForm(defaultPackageForm);
    setPackageImageFile(null);
    setBrochureFile(null);
    setThumbnailFile(null);
    setTagInput("");
    setSuitableForInput("");
    setHowItWorksInput("");
    setRecommendedForInput("");
    setErrors({});
    setEditing(null);
    setActiveTab("basic");
  };

  const openEditForm = (pkg) => {
    setForm({
      ...pkg,
      price: {
        original: pkg.price?.original || "",
        offer: pkg.price?.offer || "",
        gst: pkg.price?.gst || "18",
      },
    });
    setEditing(pkg._id);
    setShowForm(true);
    setActiveTab("basic");
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (index) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const addSuitableFor = () => {
    if (suitableForInput.trim()) {
      setForm((prev) => ({
        ...prev,
        suitableFor: [...prev.suitableFor, suitableForInput.trim()],
      }));
      setSuitableForInput("");
    }
  };

  const removeSuitableFor = (index) => {
    setForm((prev) => ({
      ...prev,
      suitableFor: prev.suitableFor.filter((_, i) => i !== index),
    }));
  };

  const addHowItWorks = () => {
    if (howItWorksInput.trim()) {
      setForm((prev) => ({
        ...prev,
        details: {
          ...prev.details,
          howItWorks: [...prev.details.howItWorks, { step: howItWorksInput.trim() }],
        },
      }));
      setHowItWorksInput("");
    }
  };

  const removeHowItWorks = (index) => {
    setForm((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        howItWorks: prev.details.howItWorks.filter((_, i) => i !== index),
      },
    }));
  };

  const addRecommendedFor = () => {
    if (recommendedForInput.trim()) {
      setForm((prev) => ({
        ...prev,
        details: {
          ...prev.details,
          highlyRecommendedFor: [...prev.details.highlyRecommendedFor, recommendedForInput.trim()],
        },
      }));
      setRecommendedForInput("");
    }
  };

  const removeRecommendedFor = (index) => {
    setForm((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        highlyRecommendedFor: prev.details.highlyRecommendedFor.filter((_, i) => i !== index),
      },
    }));
  };

  const toggleTestGroup = (groupIndex) => {
    setExpandedTests((prev) => ({
      ...prev,
      [groupIndex]: !prev[groupIndex],
    }));
  };

  const handleAddTestGroup = () => {
    setForm((prev) => ({
      ...prev,
      tests: [...prev.tests, { category: "", tests: [] }],
    }));
  };

  const handleRemoveTestGroup = (index) => {
    setForm((prev) => ({
      ...prev,
      tests: prev.tests.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateTestGroup = (index, key, value) => {
    const newTests = [...form.tests];
    newTests[index] = { ...newTests[index], [key]: value };
    setForm((prev) => ({
      ...prev,
      tests: newTests,
    }));
  };

  const handleAddTestToGroup = (groupIndex, testId) => {
    const newTests = [...form.tests];
    if (!newTests[groupIndex].tests.includes(testId)) {
      newTests[groupIndex].tests.push(testId);
    }
    setForm((prev) => ({
      ...prev,
      tests: newTests,
    }));
  };

  const handleRemoveTestFromGroup = (groupIndex, testId) => {
    const newTests = [...form.tests];
    newTests[groupIndex].tests = newTests[groupIndex].tests.filter((id) => id !== testId);
    setForm((prev) => ({
      ...prev,
      tests: newTests,
    }));
  };

  return (
    <div className="space-y-6">
      {message.text && (
        <div
          className={`rounded-lg p-4 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Package Management</h2>
          <p className="text-sm text-slate-600 mt-1">Create and manage health checkup packages</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all"
        >
          <Plus size={16} /> New Package
        </button>
      </div>

      {/* Packages List */}
      {!showForm && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-slate-500">Loading packages...</p>
          ) : packages.length ? (
            packages.map((pkg) => (
              <div key={pkg._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 bg-white hover:shadow-md transition-all">
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{pkg.name}</p>
                  <p className="text-sm text-slate-600">{pkg.category} • {pkg.testCount} tests • ₹{pkg.price?.offer}</p>
                  <p className={`text-xs mt-1 font-semibold ${pkg.status === "DRAFT" ? "text-slate-600" : pkg.status === "PENDING_APPROVAL" ? "text-amber-600" : "text-emerald-600"}`}>
                    {pkg.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(pkg)}
                    className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg._id)}
                    className="px-3 py-1 rounded-lg bg-rose-100 text-rose-700 font-semibold hover:bg-rose-200 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-8">No packages created yet</p>
          )}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={editing ? "Edit Package" : "Create New Package"}
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-slate-200 flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <TabButton key={tab} label={tab.toUpperCase()} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
            ))}
          </div>

          {/* Basic Tab */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <Field
                label="Package Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Advanced Young Indian Health Checkup"
                required
                error={errors.name}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Package Code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="Auto-generated or manual"
                />
                <SelectField
                  label="Category"
                  value={form.category}
                  options={categoryOptions}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Add tags"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={addTag} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm">
                      {tag} <button onClick={() => removeTag(i)} className="text-blue-700 hover:text-blue-900"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <TextAreaField
                label="Short Description"
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                placeholder="Brief description for listings"
              />

              <TextAreaField
                label="Full Description"
                value={form.fullDescription}
                onChange={(e) => setForm({ ...form, fullDescription: e.target.value })}
                placeholder="Detailed description"
              />
            </div>
          )}

          {/* Media Tab */}
          {activeTab === "media" && (
            <div className="space-y-4">
              <FileField label="Package Image" onChange={setPackageImageFile} accept="image/*" />
              {!packageImageFile && form.image && <p className="text-xs text-slate-500">✓ Image exists: {form.image}</p>}

              <FileField label="Brochure PDF" onChange={setBrochureFile} accept=".pdf" />
              {!brochureFile && form.brochure && <p className="text-xs text-slate-500">✓ Brochure exists</p>}

              <FileField label="Thumbnail Image (Optional)" onChange={setThumbnailFile} accept="image/*" />
              {!thumbnailFile && form.thumbnailImage && <p className="text-xs text-slate-500">✓ Thumbnail exists</p>}
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === "pricing" && (
            <div className="space-y-4">
              <Field
                label="Original Price (₹)"
                type="number"
                value={form.price.original}
                onChange={(e) => setForm({ ...form, price: { ...form.price, original: e.target.value } })}
                required
                error={errors.originalPrice}
              />

              <Field
                label="Offer Price (₹)"
                type="number"
                value={form.price.offer}
                onChange={(e) => setForm({ ...form, price: { ...form.price, offer: e.target.value } })}
                required
                error={errors.offerPrice}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Discount %</label>
                  <input
                    type="text"
                    disabled
                    value={calculateDiscount()}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-900 opacity-60"
                  />
                </div>

                <Field
                  label="GST %"
                  type="number"
                  value={form.price.gst}
                  onChange={(e) => setForm({ ...form, price: { ...form.price, gst: e.target.value } })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Final Price (₹)</label>
                <input
                  type="text"
                  disabled
                  value={calculateFinalPrice()}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-900 opacity-60"
                />
              </div>
            </div>
          )}

          {/* Tests Tab */}
          {activeTab === "tests" && (
            <div className="space-y-4">
              <button
                onClick={handleAddTestGroup}
                className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
              >
                + Add Test Group
              </button>

              {form.tests.map((group, groupIndex) => (
                <div key={groupIndex} className="rounded-lg border border-slate-200 p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={group.category}
                      onChange={(e) => handleUpdateTestGroup(groupIndex, "category", e.target.value)}
                      placeholder="Category (e.g., Cardiac Risk)"
                      className="flex-1 px-3 py-2 rounded border border-slate-300 text-sm font-semibold"
                    />
                    <button onClick={() => toggleTestGroup(groupIndex)} className="ml-2">
                      {expandedTests[groupIndex] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button onClick={() => handleRemoveTestGroup(groupIndex)} className="ml-2 text-rose-600 hover:text-rose-700">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {expandedTests[groupIndex] && (
                    <div className="space-y-3 mt-3 pt-3 border-t border-slate-200">
                      {tests.map((test) => (
                        <label key={test._id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={group.tests.includes(test._id)}
                            onChange={(e) =>
                              e.target.checked
                                ? handleAddTestToGroup(groupIndex, test._id)
                                : handleRemoveTestFromGroup(groupIndex, test._id)
                            }
                            className="w-4 h-4 rounded"
                          />
                          {test.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {form.tests.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900">Total Tests: {form.tests.reduce((sum, g) => sum + g.tests.length, 0)}</p>
                </div>
              )}

              {errors.tests && <p className="text-xs text-rose-600">{errors.tests}</p>}
            </div>
          )}

          {/* Eligibility Tab */}
          {activeTab === "eligibility" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Min Age"
                  type="number"
                  value={form.ageRange.min}
                  onChange={(e) => setForm({ ...form, ageRange: { ...form.ageRange, min: e.target.value } })}
                />
                <Field
                  label="Max Age"
                  type="number"
                  value={form.ageRange.max}
                  onChange={(e) => setForm({ ...form, ageRange: { ...form.ageRange, max: e.target.value } })}
                />
              </div>

              <SelectField
                label="Gender"
                value={form.gender}
                options={genderOptions}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Suitable For</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={suitableForInput}
                    onChange={(e) => setSuitableForInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSuitableFor())}
                    placeholder="e.g., People with Heart Disease"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={addSuitableFor} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {form.suitableFor.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                      <span className="text-sm">{item}</span>
                      <button onClick={() => removeSuitableFor(i)} className="text-rose-600 hover:text-rose-700">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <TextAreaField
                label="Who Should Book This?"
                value={form.details.whoShouldBook}
                onChange={(e) => setForm({ ...form, details: { ...form.details, whoShouldBook: e.target.value } })}
                placeholder="Explain who should book this package"
              />

              <TextAreaField
                label="Preparation Needed"
                value={form.details.preparation}
                onChange={(e) => setForm({ ...form, details: { ...form.details, preparation: e.target.value } })}
                placeholder="Fasting, diet instructions, etc."
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">How It Works (Steps)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={howItWorksInput}
                    onChange={(e) => setHowItWorksInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHowItWorks())}
                    placeholder="Add a step"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={addHowItWorks} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {form.details.howItWorks.map((step, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                      <span className="text-sm">{i + 1}. {step.step}</span>
                      <button onClick={() => removeHowItWorks(i)} className="text-rose-600 hover:text-rose-700">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Highly Recommended For</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={recommendedForInput}
                    onChange={(e) => setRecommendedForInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRecommendedFor())}
                    placeholder="e.g., Acne / Hair fall"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={addRecommendedFor} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {form.details.highlyRecommendedFor.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                      <span className="text-sm">{item}</span>
                      <button onClick={() => removeRecommendedFor(i)} className="text-rose-600 hover:text-rose-700">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Instructions Tab */}
          {activeTab === "instructions" && (
            <div className="space-y-4">
              <TextAreaField
                label="Before Test Instructions"
                value={form.instructions.before}
                onChange={(e) => setForm({ ...form, instructions: { ...form.instructions, before: e.target.value } })}
                placeholder="Fasting hours, what not to do, etc."
              />

              <TextAreaField
                label="After Test Instructions"
                value={form.instructions.after}
                onChange={(e) => setForm({ ...form, instructions: { ...form.instructions, after: e.target.value } })}
                placeholder="Post-test care instructions"
              />

              <TextAreaField
                label="Collection Instructions"
                value={form.instructions.collection}
                onChange={(e) => setForm({ ...form, instructions: { ...form.instructions, collection: e.target.value } })}
                placeholder="How samples will be collected"
              />
            </div>
          )}

          {/* Review Tab */}
          {activeTab === "review" && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-slate-900">Package Summary</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">Package Name</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{form.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">Category</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{form.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">Price</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">₹{form.price.offer} (from ₹{form.price.original})</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">Discount</p>
                    <p className="text-sm font-bold text-emerald-600 mt-1">{calculateDiscount()}% off</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">Tests</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{form.tests.reduce((sum, g) => sum + g.tests.length, 0)} tests</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">Age Range</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{form.ageRange.min || "Any"} - {form.ageRange.max || "Any"}</p>
                  </div>
                </div>

                <div className="bg-white rounded p-3">
                  <p className="text-xs text-slate-600 uppercase font-semibold mb-2">Description</p>
                  <p className="text-sm text-slate-700">{form.shortDescription || form.fullDescription || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-2 justify-between border-t border-slate-200 pt-4">
            <button
              onClick={() => {
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex > 0) {
                  setActiveTab(tabs[currentIndex - 1]);
                }
              }}
              disabled={activeTab === tabs[0]}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              {activeTab === tabs[tabs.length - 1] ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Submitting..." : editing ? "Update" : "Submit for Approval"}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1]);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
