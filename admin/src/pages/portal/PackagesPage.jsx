import { Check, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/Modal";
import {
  createLabPartnerPackage,
  deleteLabPartnerPackage,
  getLabPartnerPackages,
  updateLabPartnerPackage,
} from "../../services/api";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

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
  // UI-state for the dynamic Test Builder (will be transformed to API payload on submit)
  tests: { groups: [] },
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

const categoryOptions = [
  "General",
  "Women",
  "Senior",
  "Executive",
  "Diabetes",
  "Cardiac",
  "Full Body",
  "Other",
];
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

const SelectField = ({
  label,
  value,
  options,
  required = false,
  error,
  onChange,
}) => (
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
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {label}
    </label>
    <input
      type="file"
      accept={accept}
      onChange={(e) => onChange(e.target.files?.[0])}
      className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    {value && (
      <p className="text-xs text-slate-500 mt-1">
        ✓ {value.name || "File selected"}
      </p>
    )}
  </div>
);

const validateFile = (file, kind) => {
  if (!file) return null;
  if (file.size > MAX_UPLOAD_BYTES) return "File is too large (max 10MB)";

  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();

  if (kind === "image") {
    if (!mime.startsWith("image/")) return "Please select a valid image";
    return null;
  }

  if (kind === "pdf") {
    if (mime !== "application/pdf" && !name.endsWith(".pdf"))
      return "Please select a PDF brochure";
    return null;
  }

  return null;
};

const normalizeTestName = (value) => value.trim().replace(/\s+/g, " ");

const getTotalTestsFromBuilder = (testBuilder) => {
  const groups = testBuilder?.groups || [];
  return groups.reduce((sum, group) => sum + (group.tests?.length || 0), 0);
};

const toTestBuilderFromApi = (apiTests) => {
  const groups = Array.isArray(apiTests)
    ? apiTests.map((group) => ({
        groupName: group?.category || "",
        isOpen: true,
        newTest: "",
        tests: (group?.tests || []).map((name) => ({ name })),
      }))
    : [];

  return { groups };
};

const toApiTestsFromBuilder = (testBuilder) => {
  const groups = testBuilder?.groups || [];
  return groups
    .map((group) => ({
      category: (group.groupName || "").trim(),
      tests: (group.tests || [])
        .map((t) => normalizeTestName(t.name))
        .filter(Boolean),
    }))
    .filter((group) => group.category && group.tests.length > 0);
};

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(defaultPackageForm);
  const [activeTab, setActiveTab] = useState("basic");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});

  const [packageImageFile, setPackageImageFile] = useState(null);
  const [brochureFile, setBrochureFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const packageImagePreviewUrl = useMemo(() => {
    if (!packageImageFile) return "";
    return URL.createObjectURL(packageImageFile);
  }, [packageImageFile]);

  const thumbnailPreviewUrl = useMemo(() => {
    if (!thumbnailFile) return "";
    return URL.createObjectURL(thumbnailFile);
  }, [thumbnailFile]);

  const brochurePreviewUrl = useMemo(() => {
    if (!brochureFile) return "";
    return URL.createObjectURL(brochureFile);
  }, [brochureFile]);

  useEffect(() => {
    return () => {
      if (packageImagePreviewUrl) URL.revokeObjectURL(packageImagePreviewUrl);
    };
  }, [packageImagePreviewUrl]);

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    };
  }, [thumbnailPreviewUrl]);

  useEffect(() => {
    return () => {
      if (brochurePreviewUrl) URL.revokeObjectURL(brochurePreviewUrl);
    };
  }, [brochurePreviewUrl]);

  const [tagInput, setTagInput] = useState("");
  const [suitableForInput, setSuitableForInput] = useState("");
  const [howItWorksInput, setHowItWorksInput] = useState("");
  const [recommendedForInput, setRecommendedForInput] = useState("");

  const tabs = [
    "basic",
    "media",
    "pricing",
    "tests",
    "eligibility",
    "details",
    "instructions",
    "review",
  ];

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await getLabPartnerPackages();
      if (res.status === "success") {
        setPackages(res.data || []);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load packages" });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Package name is required";

    const original = Number(form.price.original || 0);
    const offer = Number(form.price.offer || 0);
    if (!(original > 0))
      newErrors.originalPrice = "Original price must be greater than 0";
    if (!(offer > 0))
      newErrors.offerPrice = "Offer price must be greater than 0";
    if (original > 0 && offer > original)
      newErrors.offerPrice = "Offer price cannot exceed original price";

    const minAgeRaw = form.ageRange?.min;
    const maxAgeRaw = form.ageRange?.max;
    const minAge =
      minAgeRaw === "" || minAgeRaw == null ? null : Number(minAgeRaw);
    const maxAge =
      maxAgeRaw === "" || maxAgeRaw == null ? null : Number(maxAgeRaw);
    if (minAge != null && Number.isNaN(minAge))
      newErrors.minAge = "Min age must be a number";
    if (maxAge != null && Number.isNaN(maxAge))
      newErrors.maxAge = "Max age must be a number";
    if (minAge != null && maxAge != null && minAge > maxAge)
      newErrors.maxAge = "Max age must be >= min age";

    if (!packageImageFile && !form.image)
      newErrors.packageImage = "Package image is required";

    const totalTests = getTotalTestsFromBuilder(form.tests);
    if (totalTests === 0) newErrors.tests = "Add at least one test";

    const groups = form.tests?.groups || [];
    const hasUnnamedGroupWithTests = groups.some(
      (g) => (g.tests?.length || 0) > 0 && !(g.groupName || "").trim(),
    );
    if (hasUnnamedGroupWithTests)
      newErrors.tests = "Each test group must have a group name";

    return newErrors;
  };

  const handleSelectImage = (file, setter, errorKey) => {
    if (!file) {
      setter(null);
      return;
    }
    const error = validateFile(file, "image");
    if (error) {
      setErrors((prev) => ({ ...prev, [errorKey]: error }));
      flashMessage("error", error);
      return;
    }
    setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    setter(file);
  };

  const handleSelectBrochure = (file) => {
    if (!file) {
      setBrochureFile(null);
      return;
    }
    const error = validateFile(file, "pdf");
    if (error) {
      setErrors((prev) => ({ ...prev, brochure: error }));
      flashMessage("error", error);
      return;
    }
    setErrors((prev) => ({ ...prev, brochure: undefined }));
    setBrochureFile(file);
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

      const payload = {
        ...form,
        status: "PENDING_APPROVAL",
        tests: toApiTestsFromBuilder(form.tests),
      };

      if (editing) {
        const res = await updateLabPartnerPackage(editing, payload, files);
        if (res.status === "success") {
          setMessage({ type: "success", text: "Package updated successfully" });
          setShowForm(false);
          setEditing(null);
          loadPackages();
        } else {
          setMessage({
            type: "error",
            text: res.error || "Failed to update package",
          });
        }
      } else {
        const res = await createLabPartnerPackage(payload, files);
        if (res.status === "success") {
          setMessage({
            type: "success",
            text: "Package submitted for approval",
          });
          setShowForm(false);
          loadPackages();
        } else {
          setMessage({
            type: "error",
            text: res.error || "Failed to create package",
          });
        }
      }
    } catch {
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
      } catch {
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
      ...defaultPackageForm,
      ...pkg,
      tags: Array.isArray(pkg.tags) ? pkg.tags : [],
      suitableFor: Array.isArray(pkg.suitableFor) ? pkg.suitableFor : [],
      ageRange: { ...defaultPackageForm.ageRange, ...(pkg.ageRange || {}) },
      details: { ...defaultPackageForm.details, ...(pkg.details || {}) },
      instructions: {
        ...defaultPackageForm.instructions,
        ...(pkg.instructions || {}),
      },
      price: {
        original: pkg.price?.original || "",
        offer: pkg.price?.offer || "",
        gst: pkg.price?.gst || "18",
      },
      tests: toTestBuilderFromApi(pkg.tests),
    });
    setEditing(pkg._id);
    setPackageImageFile(null);
    setBrochureFile(null);
    setThumbnailFile(null);
    setErrors({});
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
          howItWorks: [
            ...prev.details.howItWorks,
            { step: howItWorksInput.trim() },
          ],
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
          highlyRecommendedFor: [
            ...prev.details.highlyRecommendedFor,
            recommendedForInput.trim(),
          ],
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
        highlyRecommendedFor: prev.details.highlyRecommendedFor.filter(
          (_, i) => i !== index,
        ),
      },
    }));
  };

  const flashMessage = (type, text) => {
    setMessage({ type, text });
    window.clearTimeout(flashMessage._t);
    flashMessage._t = window.setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 2000);
  };

  // ─── Tests Tab: Dynamic Test Group + Test CRUD ────────────────────────────
  const addGroup = () => {
    setErrors((prev) => ({ ...prev, tests: undefined }));
    setForm((prev) => ({
      ...prev,
      tests: {
        ...prev.tests,
        groups: [
          ...(prev.tests?.groups || []),
          {
            groupName: "",
            isOpen: true,
            newTest: "",
            tests: [],
          },
        ],
      },
    }));
  };

  const deleteGroup = (groupIndex) => {
    setForm((prev) => ({
      ...prev,
      tests: {
        ...prev.tests,
        groups: (prev.tests?.groups || []).filter((_, i) => i !== groupIndex),
      },
    }));
    flashMessage("success", "Test group deleted");
  };

  const toggleGroup = (groupIndex) => {
    setForm((prev) => ({
      ...prev,
      tests: {
        ...prev.tests,
        groups: (prev.tests?.groups || []).map((g, i) =>
          i === groupIndex ? { ...g, isOpen: !g.isOpen } : g,
        ),
      },
    }));
  };

  const updateGroupName = (groupIndex, value) => {
    setForm((prev) => ({
      ...prev,
      tests: {
        ...prev.tests,
        groups: (prev.tests?.groups || []).map((g, i) =>
          i === groupIndex ? { ...g, groupName: value } : g,
        ),
      },
    }));
  };

  const updateNewTest = (groupIndex, value) => {
    setForm((prev) => ({
      ...prev,
      tests: {
        ...prev.tests,
        groups: (prev.tests?.groups || []).map((g, i) =>
          i === groupIndex ? { ...g, newTest: value } : g,
        ),
      },
    }));
  };

  const addTest = (groupIndex) => {
    const groups = form.tests?.groups || [];
    const group = groups[groupIndex];
    const candidate = normalizeTestName(group?.newTest || "");
    if (!candidate) {
      flashMessage("error", "Test name is required");
      return;
    }

    const duplicate = (group.tests || []).some(
      (t) =>
        normalizeTestName(t.name).toLowerCase() === candidate.toLowerCase(),
    );
    if (duplicate) {
      flashMessage("error", "Duplicate test name in this group");
      return;
    }

    setErrors((prev) => ({ ...prev, tests: undefined }));
    setForm((prev) => ({
      ...prev,
      tests: {
        ...prev.tests,
        groups: (prev.tests?.groups || []).map((g, i) => {
          if (i !== groupIndex) return g;
          return {
            ...g,
            tests: [...(g.tests || []), { name: candidate }],
            newTest: "",
          };
        }),
      },
    }));
    flashMessage("success", "Test added");
  };

  // editTest acts as: start editing (✏️) OR save (Save button)
  const editTest = (groupIndex, testIndex) => {
    const groups = form.tests?.groups || [];
    const group = groups[groupIndex];
    const current = group?.tests?.[testIndex];
    if (!current) return;

    if (current.isEditing) {
      const candidate = normalizeTestName(current.draftName ?? current.name);
      if (!candidate) {
        flashMessage("error", "Test name is required");
        return;
      }
      const duplicate = (group.tests || []).some((t, i) =>
        i === testIndex
          ? false
          : normalizeTestName(t.name).toLowerCase() === candidate.toLowerCase(),
      );
      if (duplicate) {
        flashMessage("error", "Duplicate test name in this group");
        return;
      }

      setForm((prev) => ({
        ...prev,
        tests: {
          ...prev.tests,
          groups: (prev.tests?.groups || []).map((g, gi) => {
            if (gi !== groupIndex) return g;
            return {
              ...g,
              tests: (g.tests || []).map((t, ti) =>
                ti === testIndex ? { name: candidate } : { name: t.name },
              ),
            };
          }),
        },
      }));
      flashMessage("success", "Test updated");
      return;
    }

    setForm((prev) => ({
      ...prev,
      tests: {
        ...prev.tests,
        groups: (prev.tests?.groups || []).map((g, gi) => {
          if (gi !== groupIndex) return g;
          return {
            ...g,
            tests: (g.tests || []).map((t, ti) =>
              ti === testIndex
                ? { ...t, isEditing: true, draftName: t.name }
                : { name: t.name },
            ),
          };
        }),
      },
    }));
  };

  const updateTest = (groupIndex, testIndex, value) => {
    setForm((prev) => ({
      ...prev,
      tests: {
        ...prev.tests,
        groups: (prev.tests?.groups || []).map((g, gi) => {
          if (gi !== groupIndex) return g;
          return {
            ...g,
            tests: (g.tests || []).map((t, ti) =>
              ti === testIndex ? { ...t, draftName: value } : t,
            ),
          };
        }),
      },
    }));
  };

  const deleteTest = (groupIndex, testIndex) => {
    setForm((prev) => ({
      ...prev,
      tests: {
        ...prev.tests,
        groups: (prev.tests?.groups || []).map((g, gi) => {
          if (gi !== groupIndex) return g;
          return {
            ...g,
            tests: (g.tests || []).filter((_, ti) => ti !== testIndex),
          };
        }),
      },
    }));
    flashMessage("success", "Test deleted");
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
          <h2 className="text-2xl font-extrabold text-slate-900">
            Package Management
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Create and manage health checkup packages
          </p>
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
              <div
                key={pkg._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 bg-white hover:shadow-md transition-all"
              >
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{pkg.name}</p>
                  <p className="text-sm text-slate-600">
                    {pkg.category} • {pkg.testCount} tests • ₹{pkg.price?.offer}
                  </p>
                  <p
                    className={`text-xs mt-1 font-semibold ${pkg.status === "DRAFT" ? "text-slate-600" : pkg.status === "PENDING_APPROVAL" ? "text-amber-600" : "text-emerald-600"}`}
                  >
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
            <p className="text-slate-500 text-center py-8">
              No packages created yet
            </p>
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
              <TabButton
                key={tab}
                label={tab.toUpperCase()}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
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
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    placeholder="Add tags"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm"
                    >
                      {tag}{" "}
                      <button
                        onClick={() => removeTag(i)}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <TextAreaField
                label="Short Description"
                value={form.shortDescription}
                onChange={(e) =>
                  setForm({ ...form, shortDescription: e.target.value })
                }
                placeholder="Brief description for listings"
              />

              <TextAreaField
                label="Full Description"
                value={form.fullDescription}
                onChange={(e) =>
                  setForm({ ...form, fullDescription: e.target.value })
                }
                placeholder="Detailed description"
              />
            </div>
          )}

          {/* Media Tab */}
          {activeTab === "media" && (
            <div className="space-y-4">
              <FileField
                label="Package Image"
                value={packageImageFile}
                onChange={(file) =>
                  handleSelectImage(file, setPackageImageFile, "packageImage")
                }
                accept="image/*"
              />
              {errors.packageImage && (
                <p className="text-xs text-rose-600">{errors.packageImage}</p>
              )}

              {(packageImagePreviewUrl || form.image) && (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase text-slate-600 mb-2">
                    Preview
                  </p>
                  <img
                    src={packageImagePreviewUrl || form.image}
                    alt="Package preview"
                    className="w-full max-h-64 object-cover rounded-lg border border-slate-200"
                  />
                </div>
              )}
              {!packageImageFile && form.image && (
                <p className="text-xs text-slate-500">
                  ✓ Image exists: {form.image}
                </p>
              )}

              <FileField
                label="Brochure PDF"
                value={brochureFile}
                onChange={handleSelectBrochure}
                accept=".pdf"
              />
              {errors.brochure && (
                <p className="text-xs text-rose-600">{errors.brochure}</p>
              )}

              {(brochurePreviewUrl || form.brochureUrl || form.brochure) && (
                <p className="text-xs text-slate-600">
                  <a
                    href={brochurePreviewUrl || form.brochureUrl || form.brochure}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Open brochure preview
                  </a>
                </p>
              )}
              {!brochureFile && form.brochure && (
                <p className="text-xs text-slate-500">✓ Brochure exists</p>
              )}

              <FileField
                label="Thumbnail Image (Optional)"
                value={thumbnailFile}
                onChange={(file) =>
                  handleSelectImage(file, setThumbnailFile, "thumbnail")
                }
                accept="image/*"
              />
              {errors.thumbnail && (
                <p className="text-xs text-rose-600">{errors.thumbnail}</p>
              )}

              {(thumbnailPreviewUrl || form.thumbnailImage) && (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase text-slate-600 mb-2">
                    Thumbnail preview
                  </p>
                  <img
                    src={thumbnailPreviewUrl || form.thumbnailImage}
                    alt="Thumbnail preview"
                    className="w-full max-h-40 object-cover rounded-lg border border-slate-200"
                  />
                </div>
              )}
              {!thumbnailFile && form.thumbnailImage && (
                <p className="text-xs text-slate-500">✓ Thumbnail exists</p>
              )}
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === "pricing" && (
            <div className="space-y-4">
              <Field
                label="Original Price (₹)"
                type="number"
                value={form.price.original}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: { ...form.price, original: e.target.value },
                  })
                }
                required
                error={errors.originalPrice}
              />

              <Field
                label="Offer Price (₹)"
                type="number"
                value={form.price.offer}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: { ...form.price, offer: e.target.value },
                  })
                }
                required
                error={errors.offerPrice}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Discount %
                  </label>
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
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: { ...form.price, gst: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Final Price (₹)
                </label>
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
                onClick={addGroup}
                className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
              >
                + Add Test Group
              </button>

              {(form.tests?.groups || []).map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-center gap-2 p-4">
                    <input
                      type="text"
                      value={group.groupName}
                      onChange={(e) =>
                        updateGroupName(groupIndex, e.target.value)
                      }
                      placeholder="Group Name (e.g., Hematology)"
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
                    />

                    <button
                      type="button"
                      onClick={() => toggleGroup(groupIndex)}
                      className="p-2 rounded-lg hover:bg-slate-100"
                      title={group.isOpen ? "Collapse" : "Expand"}
                    >
                      <ChevronDown
                        size={18}
                        className={`transition-transform ${group.isOpen ? "rotate-180" : "rotate-0"}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteGroup(groupIndex)}
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      title="Delete group"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div
                    className={`border-t border-slate-200 overflow-hidden transition-all duration-200 ${
                      group.isOpen ? "max-h-[1200px]" : "max-h-0"
                    }`}
                  >
                    <div className="p-4 space-y-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase text-slate-600 mb-2">
                          + Add Test
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={group.newTest}
                            onChange={(e) =>
                              updateNewTest(groupIndex, e.target.value)
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), addTest(groupIndex))
                            }
                            placeholder="Test Name (required)"
                            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => addTest(groupIndex)}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200">
                        <div className="px-4 py-2 text-xs font-bold uppercase text-slate-600 border-b border-slate-200 bg-white">
                          Test List
                        </div>

                        <div className="divide-y divide-slate-100">
                          {(group.tests || []).length === 0 ? (
                            <div className="px-4 py-3 text-sm text-slate-500">
                              No tests added yet
                            </div>
                          ) : (
                            (group.tests || []).map((t, testIndex) => (
                              <div
                                key={`${groupIndex}-${testIndex}`}
                                className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-slate-50"
                              >
                                <div className="flex-1">
                                  {t.isEditing ? (
                                    <input
                                      type="text"
                                      value={t.draftName ?? ""}
                                      onChange={(e) =>
                                        updateTest(
                                          groupIndex,
                                          testIndex,
                                          e.target.value,
                                        )
                                      }
                                      onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        (e.preventDefault(),
                                        editTest(groupIndex, testIndex))
                                      }
                                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                                    />
                                  ) : (
                                    <p className="text-sm font-medium text-slate-900">
                                      {t.name}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {t.isEditing ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        editTest(groupIndex, testIndex)
                                      }
                                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                                      title="Save"
                                    >
                                      <Check size={16} /> Save
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        editTest(groupIndex, testIndex)
                                      }
                                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
                                      title="Edit"
                                    >
                                      <Pencil size={16} />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteTest(groupIndex, testIndex)
                                    }
                                    className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                                    title="Delete"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {(form.tests?.groups || []).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900">
                    Total Tests: {getTotalTestsFromBuilder(form.tests)}
                  </p>
                </div>
              )}

              {errors.tests && (
                <p className="text-xs text-rose-600">{errors.tests}</p>
              )}
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
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ageRange: { ...form.ageRange, min: e.target.value },
                    })
                  }
                  error={errors.minAge}
                />
                <Field
                  label="Max Age"
                  type="number"
                  value={form.ageRange.max}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ageRange: { ...form.ageRange, max: e.target.value },
                    })
                  }
                  error={errors.maxAge}
                />
              </div>

              <SelectField
                label="Gender"
                value={form.gender}
                options={genderOptions}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Suitable For
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={suitableForInput}
                    onChange={(e) => setSuitableForInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addSuitableFor())
                    }
                    placeholder="e.g., People with Heart Disease"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addSuitableFor}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {form.suitableFor.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-slate-50 p-2 rounded"
                    >
                      <span className="text-sm">{item}</span>
                      <button
                        onClick={() => removeSuitableFor(i)}
                        className="text-rose-600 hover:text-rose-700"
                      >
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
                onChange={(e) =>
                  setForm({
                    ...form,
                    details: { ...form.details, whoShouldBook: e.target.value },
                  })
                }
                placeholder="Explain who should book this package"
              />

              <TextAreaField
                label="Preparation Needed"
                value={form.details.preparation}
                onChange={(e) =>
                  setForm({
                    ...form,
                    details: { ...form.details, preparation: e.target.value },
                  })
                }
                placeholder="Fasting, diet instructions, etc."
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  How It Works (Steps)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={howItWorksInput}
                    onChange={(e) => setHowItWorksInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addHowItWorks())
                    }
                    placeholder="Add a step"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addHowItWorks}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {form.details.howItWorks.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-slate-50 p-2 rounded"
                    >
                      <span className="text-sm">
                        {i + 1}. {step.step}
                      </span>
                      <button
                        onClick={() => removeHowItWorks(i)}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Highly Recommended For
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={recommendedForInput}
                    onChange={(e) => setRecommendedForInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addRecommendedFor())
                    }
                    placeholder="e.g., Acne / Hair fall"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addRecommendedFor}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {form.details.highlyRecommendedFor.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-slate-50 p-2 rounded"
                    >
                      <span className="text-sm">{item}</span>
                      <button
                        onClick={() => removeRecommendedFor(i)}
                        className="text-rose-600 hover:text-rose-700"
                      >
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
                onChange={(e) =>
                  setForm({
                    ...form,
                    instructions: {
                      ...form.instructions,
                      before: e.target.value,
                    },
                  })
                }
                placeholder="Fasting hours, what not to do, etc."
              />

              <TextAreaField
                label="After Test Instructions"
                value={form.instructions.after}
                onChange={(e) =>
                  setForm({
                    ...form,
                    instructions: {
                      ...form.instructions,
                      after: e.target.value,
                    },
                  })
                }
                placeholder="Post-test care instructions"
              />

              <TextAreaField
                label="Collection Instructions"
                value={form.instructions.collection}
                onChange={(e) =>
                  setForm({
                    ...form,
                    instructions: {
                      ...form.instructions,
                      collection: e.target.value,
                    },
                  })
                }
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
                    <p className="text-xs text-slate-600 uppercase font-semibold">
                      Package Name
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {form.name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">
                      Category
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {form.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">
                      Price
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      ₹{form.price.offer} (from ₹{form.price.original})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">
                      Discount
                    </p>
                    <p className="text-sm font-bold text-emerald-600 mt-1">
                      {calculateDiscount()}% off
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">
                      Tests
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {getTotalTestsFromBuilder(form.tests)} tests
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold">
                      Age Range
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {form.ageRange.min || "Any"} -{" "}
                      {form.ageRange.max || "Any"}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded p-3">
                  <p className="text-xs text-slate-600 uppercase font-semibold mb-2">
                    Description
                  </p>
                  <p className="text-sm text-slate-700">
                    {form.shortDescription || form.fullDescription || "—"}
                  </p>
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
                  {loading
                    ? "Submitting..."
                    : editing
                      ? "Update"
                      : "Submit for Approval"}
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
