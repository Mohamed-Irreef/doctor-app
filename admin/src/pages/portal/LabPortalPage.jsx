import {
    CalendarDays,
    ClipboardList,
    LayoutDashboard,
    ListChecks,
    Settings,
    TestTube2,
    Wallet,
    Package,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import {
    createLabPartnerTestMultipart,
    deleteLabPartnerTest,
    getLabPartnerBookings,
    getLabPartnerDashboard,
    getLabPartnerSettings,
    getLabPartnerTests,
    updateLabPartnerSettings,
    updateLabPartnerTest,
    uploadLabReportFile,
} from "../../services/api";
import AdminBookingsPage from "../admin/bookings";
import OrdersCalendarPage from "../lab/OrdersCalendar";
import PackagesPage from "./PackagesPage";

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "tests", label: "Test Management", icon: TestTube2 },
  { key: "test-list", label: "Test List", icon: ListChecks },
  { key: "packages", label: "Package Management", icon: Package },
  { key: "bookings", label: "Bookings", icon: ClipboardList },
  { key: "orders-calendar", label: "Orders Calendar", icon: CalendarDays },
  { key: "reports", label: "Reports", icon: ClipboardList },
  { key: "revenue", label: "Revenue", icon: Wallet },
  { key: "settings", label: "Settings", icon: Settings },
];

const defaultTestForm = {
  name: "",
  testCode: "",
  category: "Blood Tests",
  subcategory: "",
  tags: [],
  shortDescription: "",
  fullDescription: "",
  originalPrice: "",
  price: "",
  gstPercent: "18",
  fastingRequired: false,
  fastingDurationHours: "",
  collectionInstructions: "",
  homeCollectionAvailable: true,
  labVisitRequired: false,
  bothAvailable: false,
  technicianRequired: false,
  collectionTimeSlots: [],
  sampleType: "Blood",
  reportTurnaroundTime: "24h",
  parameters: [{ name: "", normalRange: "", unit: "" }],
  methodUsed: "ELISA",
  department: "Biochemistry",
  beforeTestInstructions: "",
  afterTestInstructions: "",
  searchKeywords: "",
  slug: "",
  popularTest: false,
  recommendedTest: false,
  status: "draft",
};

const defaultCategoryOptions = [
  {
    name: "Blood Tests",
    subcategories: ["Hematology", "Biochemistry", "Serology", "Immunology"],
  },
  { name: "Urine Tests", subcategories: ["Routine", "Microscopy"] },
  { name: "Saliva Tests", subcategories: ["Hormone Panel", "DNA Screening"] },
  { name: "Stool Tests", subcategories: ["Occult Blood", "Culture"] },
  { name: "Imaging", subcategories: ["X-Ray", "Ultrasound", "CT", "MRI"] },
  {
    name: "Genetic Tests",
    subcategories: ["Carrier", "Prenatal", "Cancer Panel"],
  },
  {
    name: "Allergy Tests",
    subcategories: ["Food Allergy", "Respiratory", "Skin Panel"],
  },
  {
    name: "Hormone Tests",
    subcategories: ["Thyroid", "Reproductive", "Cortisol"],
  },
];

const sampleTypeOptions = ["Blood", "Urine", "Saliva", "Other"];
const methodOptions = ["ELISA", "PCR", "CLIA", "HPLC", "Analyzer"];
const departmentOptions = [
  "Biochemistry",
  "Pathology",
  "Microbiology",
  "Immunology",
];
const fastingRequirementOptions = [
  { label: "Not Required", value: "0" },
  { label: "6h", value: "6" },
  { label: "8h", value: "8" },
  { label: "10h", value: "10" },
  { label: "12h", value: "12" },
];
const reportTurnaroundOptions = ["6h", "12h", "24h", "48h", "72h"];
const collectionTimeSlotOptions = ["Morning", "Afternoon", "Evening"];
const parameterSuggestions = [
  "Hemoglobin",
  "RBC",
  "WBC",
  "Platelets",
  "Glucose",
];

const sectionCardClass =
  "bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] shadow-sm p-6";

const Card = ({ title, value }) => (
  <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm">
    <p className="text-sm text-slate-500">{title}</p>
    <h2 className="text-2xl font-bold text-[#0F172A] mt-2">{value}</h2>
  </div>
);

const DetailField = ({ label, value }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-1 text-sm font-medium text-slate-800 break-words">
      {value || "-"}
    </p>
  </div>
);

function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-[260px] bg-white border-r border-[#E2E8F0] h-full p-4">
      <div className="rounded-xl border border-[#E2E8F0] p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#14B8A6] font-bold">
          Lab Console
        </p>
        <h1 className="mt-2 text-xl font-extrabold text-[#0F172A]">
          Lab Admin
        </h1>
      </div>

      <nav className="mt-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`w-full text-left rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                active
                  ? "bg-[#2563EB] text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {Icon ? <Icon size={16} /> : null}
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function DashboardPage({ stats }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl p-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F172A]">
            Lab Admin Dashboard
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Monitor tests, bookings, reports, and revenue in one place.
          </p>
        </div>
        <div className="rounded-full bg-[#14B8A6]/10 text-[#14B8A6] px-4 py-2 text-xs font-bold">
          APPROVED
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card title="Total Tests" value={String(stats.totalTests)} />
        <Card title="Pending" value={String(stats.pendingTests)} />
        <Card title="Bookings" value={String(stats.bookings)} />
        <Card title="Revenue" value={`INR ${stats.revenue}`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className={sectionCardClass}>
          <h3 className="text-lg font-bold text-[#0F172A]">
            Operational Summary
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#2563EB]/10 p-4">
              <p className="text-xs text-[#2563EB] font-bold">
                Reports Pending
              </p>
              <p className="mt-2 text-2xl font-bold text-[#0F172A]">
                {stats.reportsPending}
              </p>
            </div>
            <div className="rounded-xl bg-[#14B8A6]/10 p-4">
              <p className="text-xs text-[#14B8A6] font-bold">Rejected Tests</p>
              <p className="mt-2 text-2xl font-bold text-[#0F172A]">
                {stats.rejectedTests}
              </p>
            </div>
          </div>
        </div>

        <div className={sectionCardClass}>
          <h3 className="text-lg font-bold text-[#0F172A]">Today Activity</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-lg bg-slate-50 p-3">
              New booking created
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              Report uploaded for a patient
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              Test submitted for approval
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestsPage({ onSubmitTest }) {
  const [form, setForm] = useState(defaultTestForm);
  const [activeTab, setActiveTab] = useState("basic");
  const [categoryOptions, setCategoryOptions] = useState(
    defaultCategoryOptions,
  );
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [testImageFile, setTestImageFile] = useState(null);
  const [reportSampleFile, setReportSampleFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tabs = [
    "basic",
    "media",
    "pricing",
    "sample",
    "collection",
    "timing",
    "medical",
    "instructions",
  ];
  const dropdownClass =
    "h-12 w-full rounded-lg border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer";
  const activeTabIndex = tabs.indexOf(activeTab);
  const isFirstTab = activeTabIndex === 0;
  const isLastTab = activeTabIndex === tabs.length - 1;

  useEffect(() => {
    if (!testImageFile) {
      setImagePreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(testImageFile);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [testImageFile]);

  const slugify = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const categorySubOptions =
    categoryOptions.find((item) => item.name === form.category)
      ?.subcategories || [];

  const originalPriceNum = Number(form.originalPrice || 0);
  const offerPriceNum = Number(form.price || 0);
  const gstNum = Number(form.gstPercent || 0);
  const discountPercent =
    originalPriceNum > 0
      ? Math.max(
          0,
          ((originalPriceNum - offerPriceNum) / originalPriceNum) * 100,
        )
      : 0;
  const finalPrice = offerPriceNum + (offerPriceNum * gstNum) / 100;

  const isValid =
    form.name.trim().length > 0 &&
    form.category.trim().length > 0 &&
    form.sampleType.trim().length > 0 &&
    Number(form.originalPrice) > 0 &&
    Number(form.price) > 0 &&
    Number(form.price) <= Number(form.originalPrice) &&
    !Number.isNaN(Number(form.gstPercent));

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Test name is required";
    if (!form.category.trim()) nextErrors.category = "Category is required";
    if (!form.sampleType.trim())
      nextErrors.sampleType = "Sample type is required";
    if (Number(form.originalPrice || 0) <= 0) {
      nextErrors.originalPrice = "Original price must be greater than 0";
    }
    if (Number(form.price || 0) <= 0) {
      nextErrors.price = "Offer price must be greater than 0";
    }
    if (Number(form.price || 0) > Number(form.originalPrice || 0)) {
      nextErrors.price = "Offer price cannot exceed original price";
    }
    if (Number.isNaN(Number(form.gstPercent))) {
      nextErrors.gstPercent = "GST must be numeric";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const nextValue = type === "checkbox" ? checked : value;
      const next = { ...prev, [name]: nextValue };
      if (name === "name" && !prev.slug) {
        next.slug = slugify(value);
      }
      return next;
    });

    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const addTag = () => {
    const nextTag = tagInput.trim();
    if (!nextTag) return;
    if (form.tags.includes(nextTag)) {
      setTagInput("");
      return;
    }
    setField("tags", [...form.tags, nextTag]);
    setTagInput("");
  };

  const removeTag = (tag) => {
    setField(
      "tags",
      form.tags.filter((item) => item !== tag),
    );
  };

  const addCategory = () => {
    const next = newCategory.trim();
    if (!next) return;
    if (
      categoryOptions.some(
        (item) => item.name.toLowerCase() === next.toLowerCase(),
      )
    ) {
      setNewCategory("");
      return;
    }
    const updated = [...categoryOptions, { name: next, subcategories: [] }];
    setCategoryOptions(updated);
    setField("category", next);
    setField("subcategory", "");
    setNewCategory("");
  };

  const addSubcategory = () => {
    const next = newSubcategory.trim();
    if (!next || !form.category) return;
    const updated = categoryOptions.map((item) => {
      if (item.name !== form.category) return item;
      if (
        item.subcategories.some(
          (sub) => sub.toLowerCase() === next.toLowerCase(),
        )
      ) {
        return item;
      }
      return { ...item, subcategories: [...item.subcategories, next] };
    });
    setCategoryOptions(updated);
    setField("subcategory", next);
    setNewSubcategory("");
  };

  const updateParameter = (index, key, value) => {
    const updated = form.parameters.map((item, idx) =>
      idx === index ? { ...item, [key]: value } : item,
    );
    setField("parameters", updated);
  };

  const addParameter = () => {
    setField("parameters", [
      ...form.parameters,
      { name: "", normalRange: "", unit: "" },
    ]);
  };

  const removeParameter = (index) => {
    if (form.parameters.length === 1) return;
    setField(
      "parameters",
      form.parameters.filter((_, idx) => idx !== index),
    );
  };

  const goToNextTab = () => {
    if (isLastTab) return;
    setActiveTab(tabs[activeTabIndex + 1]);
  };

  const goToPreviousTab = () => {
    if (isFirstTab) return;
    setActiveTab(tabs[activeTabIndex - 1]);
  };

  const applyWorkflowStatus = async (workflowStatus) => {
    setSubmitError("");
    if (!validate()) return;
    if (!isValid) return;

    setSubmitting(true);
    try {
      await onSubmitTest(
        {
          ...form,
          status: workflowStatus,
          slug: form.slug || slugify(form.name),
          testCode: form.testCode || `LAB-${Date.now().toString().slice(-6)}`,
        },
        { testImageFile, reportSampleFile },
      );
      setForm(defaultTestForm);
      setErrors({});
      setSubmitError("");
      setTestImageFile(null);
      setReportSampleFile(null);
      setTagInput("");
    } catch (error) {
      setSubmitError(
        error?.message || "Unable to submit test. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="bg-white p-6 rounded-xl border border-gray-200 space-y-6"
      >
        <div className="flex gap-2 mb-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg whitespace-nowrap text-sm font-semibold ${
                activeTab === tab
                  ? "bg-[#2563EB] text-white"
                  : "text-gray-600 hover:bg-slate-100"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === "basic" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                name="name"
                className="w-full rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                placeholder="Test Name"
                value={form.name || ""}
                onChange={handleChange}
                required
              />
              {errors.name ? (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              ) : null}
            </div>
            <input
              name="testCode"
              className="w-full rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              placeholder="Test Code"
              value={form.testCode || ""}
              onChange={handleChange}
            />
            <div>
              <select
                name="category"
                className={dropdownClass}
                value={form.category || ""}
                onChange={(e) => {
                  handleChange(e);
                  setField("subcategory", "");
                }}
              >
                {categoryOptions.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              {errors.category ? (
                <p className="mt-1 text-xs text-red-600">{errors.category}</p>
              ) : null}
            </div>
            <div>
              <select
                name="subcategory"
                className={dropdownClass}
                value={form.subcategory || ""}
                onChange={handleChange}
              >
                <option value="">Select Subcategory</option>
                {categorySubOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {errors.subcategory ? (
                <p className="mt-1 text-xs text-red-600">
                  {errors.subcategory}
                </p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                placeholder="Add Category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg px-4 bg-slate-100 hover:bg-slate-200"
                onClick={addCategory}
              >
                Add
              </button>
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                placeholder="Add Subcategory"
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg px-4 bg-slate-100 hover:bg-slate-200"
                onClick={addSubcategory}
              >
                Add
              </button>
            </div>
            <div className="md:col-span-2 space-y-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  placeholder="Tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <button
                  type="button"
                  className="rounded-lg px-4 bg-slate-100 hover:bg-slate-200"
                  onClick={addTag}
                >
                  Add Tag
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(form.tags || []).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-full bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold px-3 py-1"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} x
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <textarea
                name="shortDescription"
                className="w-full rounded-lg border border-gray-200 p-3 min-h-20 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                placeholder="Short Description"
                value={form.shortDescription || ""}
                onChange={handleChange}
              />
              {errors.shortDescription ? (
                <p className="mt-1 text-xs text-red-600">
                  {errors.shortDescription}
                </p>
              ) : null}
            </div>
            <textarea
              name="fullDescription"
              className="md:col-span-2 w-full rounded-lg border border-gray-200 p-3 min-h-24 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              placeholder="Full Description"
              value={form.fullDescription || ""}
              onChange={handleChange}
            />
          </div>
        )}

        {activeTab === "media" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-slate-700"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith("image/"))
                  setTestImageFile(file);
              }}
            >
              <p className="font-medium text-[#0F172A]">Test Image</p>
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full"
                onChange={(e) => setTestImageFile(e.target.files?.[0] || null)}
              />
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="mt-3 h-24 w-24 rounded-lg object-cover border border-gray-200"
                />
              ) : null}
            </label>
            <label
              className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-slate-700"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type === "application/pdf")
                  setReportSampleFile(file);
              }}
            >
              <p className="font-medium text-[#0F172A]">Sample Report PDF</p>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="mt-2 block w-full"
                onChange={(e) =>
                  setReportSampleFile(e.target.files?.[0] || null)
                }
              />
              <p className="mt-3 text-xs text-slate-600">
                {reportSampleFile ? reportSampleFile.name : "No file selected"}
              </p>
            </label>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                name="originalPrice"
                className="w-full rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                placeholder="Original Price"
                type="number"
                value={form.originalPrice || ""}
                onChange={handleChange}
              />
              {errors.originalPrice ? (
                <p className="mt-1 text-xs text-red-600">
                  {errors.originalPrice}
                </p>
              ) : null}
            </div>
            <div>
              <input
                name="price"
                className="w-full rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                placeholder="Offer Price"
                type="number"
                value={form.price || ""}
                onChange={handleChange}
              />
              {errors.price ? (
                <p className="mt-1 text-xs text-red-600">{errors.price}</p>
              ) : null}
            </div>
            <input
              name="gstPercent"
              className="w-full rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              placeholder="GST %"
              type="number"
              value={form.gstPercent || ""}
              onChange={handleChange}
            />
            {errors.gstPercent ? (
              <p className="-mt-2 text-xs text-red-600 md:col-span-2">
                {errors.gstPercent}
              </p>
            ) : null}
            <div className="w-full rounded-lg border border-gray-200 bg-slate-50 p-3 text-slate-600">
              Discount: {discountPercent.toFixed(2)}%
            </div>
            <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg text-sm text-[#0F172A] space-y-1">
              <p>
                MRP:{" "}
                <span className="font-semibold">
                  INR {originalPriceNum.toFixed(2)}
                </span>
              </p>
              <p>
                Offer:{" "}
                <span className="font-semibold">
                  INR {offerPriceNum.toFixed(2)}
                </span>
              </p>
              <p>
                GST: <span className="font-semibold">{gstNum.toFixed(2)}%</span>
              </p>
              <p>
                Final Price:{" "}
                <span className="font-semibold">
                  INR {finalPrice.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        )}

        {activeTab === "sample" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <select
                name="sampleType"
                className={dropdownClass}
                value={form.sampleType || ""}
                onChange={handleChange}
              >
                {sampleTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.sampleType ? (
                <p className="mt-1 text-xs text-red-600">{errors.sampleType}</p>
              ) : null}
            </div>
            <select
              name="fastingRequirement"
              className={dropdownClass}
              value={
                !form.fastingRequired
                  ? "0"
                  : String(form.fastingDurationHours || "8")
              }
              onChange={(e) => {
                const selected = e.target.value;
                if (selected === "0") {
                  setField("fastingRequired", false);
                  setField("fastingDurationHours", "");
                  return;
                }
                setField("fastingRequired", true);
                setField("fastingDurationHours", selected);
              }}
            >
              {fastingRequirementOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === "collection" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm">
              <input
                name="homeCollectionAvailable"
                type="checkbox"
                checked={Boolean(form.homeCollectionAvailable)}
                onChange={handleChange}
              />
              Home Collection
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm">
              <input
                name="labVisitRequired"
                checked={Boolean(form.labVisitRequired)}
                type="checkbox"
                onChange={handleChange}
              />
              Lab Visit
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm">
              <input
                name="bothAvailable"
                type="checkbox"
                checked={Boolean(form.bothAvailable)}
                onChange={handleChange}
              />
              Both Available
            </label>

            <div className="space-y-2">
              <select
                className={dropdownClass}
                value=""
                onChange={(e) => {
                  const selected = e.target.value;
                  if (!selected) return;
                  if ((form.collectionTimeSlots || []).includes(selected))
                    return;
                  setField("collectionTimeSlots", [
                    ...(form.collectionTimeSlots || []),
                    selected,
                  ]);
                }}
              >
                <option value="">Select Collection Time Slot</option>
                {collectionTimeSlotOptions.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                {(form.collectionTimeSlots || []).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                    onClick={() =>
                      setField(
                        "collectionTimeSlots",
                        (form.collectionTimeSlots || []).filter(
                          (item) => item !== slot,
                        ),
                      )
                    }
                  >
                    {slot} x
                  </button>
                ))}
              </div>
            </div>

            <select
              name="technicianRequired"
              className={`md:col-span-2 ${dropdownClass}`}
              value={String(Boolean(form.technicianRequired))}
              onChange={(e) =>
                setField("technicianRequired", e.target.value === "true")
              }
            >
              <option value="true">Required</option>
              <option value="false">Not Required</option>
            </select>
          </div>
        )}

        {activeTab === "timing" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              name="reportTurnaroundTime"
              className={dropdownClass}
              value={form.reportTurnaroundTime || ""}
              onChange={handleChange}
            >
              {reportTurnaroundOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === "medical" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-[#2563EB]">
                Parameters
              </h3>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200"
                onClick={addParameter}
              >
                Add Parameter
              </button>
            </div>
            <div className="space-y-3">
              {(form.parameters || []).map((parameter, index) => (
                <div
                  key={`${index}-${parameter.name}`}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <input
                    list="parameter-suggestions"
                    className="w-full rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                    placeholder="Parameter"
                    value={parameter.name || ""}
                    onChange={(e) =>
                      updateParameter(index, "name", e.target.value)
                    }
                  />
                  <input
                    className="w-full rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                    placeholder="Normal Range"
                    value={parameter.normalRange || ""}
                    onChange={(e) =>
                      updateParameter(index, "normalRange", e.target.value)
                    }
                  />
                  <input
                    className="w-full rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                    placeholder="Unit"
                    value={parameter.unit || ""}
                    onChange={(e) =>
                      updateParameter(index, "unit", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="rounded-lg px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
                    onClick={() => removeParameter(index)}
                    disabled={(form.parameters || []).length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <datalist id="parameter-suggestions">
              {parameterSuggestions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="methodUsed"
                className={dropdownClass}
                value={form.methodUsed || ""}
                onChange={handleChange}
              >
                <option value="">Select Method</option>
                {methodOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                name="department"
                className={dropdownClass}
                value={form.department || ""}
                onChange={handleChange}
              >
                {departmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === "instructions" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              name="beforeTestInstructions"
              className="w-full rounded-lg border border-gray-200 p-3 min-h-20 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              placeholder="Before Test Instructions"
              value={form.beforeTestInstructions || ""}
              onChange={handleChange}
            />
            <textarea
              name="afterTestInstructions"
              className="w-full rounded-lg border border-gray-200 p-3 min-h-20 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              placeholder="After Test Instructions"
              value={form.afterTestInstructions || ""}
              onChange={handleChange}
            />
            <textarea
              name="collectionInstructions"
              className="md:col-span-2 w-full rounded-lg border border-gray-200 p-3 min-h-20 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              placeholder="Collection Instructions"
              value={form.collectionInstructions || ""}
              onChange={handleChange}
            />
            <input
              name="searchKeywords"
              className="w-full rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              placeholder="Search Keywords (comma separated)"
              value={form.searchKeywords || ""}
              onChange={handleChange}
            />
            <input
              name="slug"
              className="w-full rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              placeholder="Slug"
              value={form.slug || ""}
              onChange={handleChange}
            />
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm">
              <input
                name="popularTest"
                type="checkbox"
                checked={Boolean(form.popularTest)}
                onChange={handleChange}
              />
              Popular Test
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm">
              <input
                name="recommendedTest"
                type="checkbox"
                checked={Boolean(form.recommendedTest)}
                onChange={handleChange}
              />
              Recommended Test
            </label>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {isFirstTab ? (
            <button
              type="button"
              onClick={goToNextTab}
              className="bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Continue
            </button>
          ) : null}

          {!isFirstTab && !isLastTab ? (
            <>
              <button
                type="button"
                onClick={goToPreviousTab}
                className="border px-4 py-2 rounded-lg bg-white text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={goToNextTab}
                className="bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Continue Next
              </button>
            </>
          ) : null}

          {isLastTab ? (
            <>
              <button
                type="button"
                disabled={submitting || !isValid}
                onClick={() => applyWorkflowStatus("draft")}
                className="border px-4 py-2 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save Draft"}
              </button>

              <button
                type="button"
                disabled={submitting || !isValid}
                onClick={() => applyWorkflowStatus("submitted")}
                className="bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit for Approval"}
              </button>
            </>
          ) : null}
        </div>
        {isLastTab && submitError ? (
          <p className="text-sm text-red-600">{submitError}</p>
        ) : null}
      </form>
    </div>
  );
}

function TestListPage({ tests, onDeleteTest, onUpdateTest }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [deletingId, setDeletingId] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState("");
  const [savingId, setSavingId] = useState("");

  const openDetails = (test) => {
    setSelectedTest(test);
    setDetailOpen(true);
  };

  const openEdit = (test) => {
    setSelectedTest(test);
    setEditForm({
      name: test.name || "",
      testCode: test.testCode || "",
      category: test.category || "",
      subcategory: test.subcategory || "",
      shortDescription: test.shortDescription || "",
      fullDescription: test.fullDescription || "",
      originalPrice:
        test.originalPrice !== undefined ? String(test.originalPrice) : "",
      price: test.price !== undefined ? String(test.price) : "",
      sampleType: test.sampleType || "",
      fastingRequired: Boolean(test.fastingRequired),
      fastingHours:
        test.fastingHours !== undefined ? String(test.fastingHours) : "",
      reportTime: test.reportTime || test.turnaround || "",
      method: test.method || "",
      department: test.department || "",
      tags: Array.isArray(test.tags) ? test.tags.join(", ") : "",
      keywords: Array.isArray(test.keywords) ? test.keywords.join(", ") : "",
    });
    setEditError("");
    setEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitEdit = async () => {
    if (!selectedTest?._id) return;
    setEditError("");
    setSavingId(selectedTest._id);

    const payload = {
      name: editForm.name || undefined,
      testCode: editForm.testCode || undefined,
      category: editForm.category || undefined,
      subcategory: editForm.subcategory || undefined,
      shortDescription: editForm.shortDescription || undefined,
      fullDescription: editForm.fullDescription || undefined,
      originalPrice:
        editForm.originalPrice !== ""
          ? Number(editForm.originalPrice)
          : undefined,
      price: editForm.price !== "" ? Number(editForm.price) : undefined,
      sampleType: editForm.sampleType || undefined,
      fastingRequired: Boolean(editForm.fastingRequired),
      fastingHours:
        editForm.fastingHours !== ""
          ? Number(editForm.fastingHours)
          : undefined,
      reportTime: editForm.reportTime || undefined,
      method: editForm.method || undefined,
      department: editForm.department || undefined,
      tags: editForm.tags
        ? editForm.tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
      keywords: editForm.keywords
        ? editForm.keywords
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
    };

    try {
      await onUpdateTest(selectedTest._id, payload);
      setEditOpen(false);
      setSelectedTest(null);
    } catch (error) {
      setEditError(error?.message || "Unable to update test.");
    } finally {
      setSavingId("");
    }
  };

  const handleDelete = async (test) => {
    if (!test?._id) return;
    const confirmed = window.confirm(
      "Delete this lab test? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingId(test._id);
    try {
      await onDeleteTest(test._id);
    } finally {
      setDeletingId("");
    }
  };

  const mediaLinks = (selectedTest) => {
    if (!selectedTest) return [];
    return [
      {
        label: "Test Image",
        url: selectedTest.testImage || selectedTest.imageUrl,
      },
      { label: "Report Sample", url: selectedTest.reportSampleUrl },
      { label: "Test Video", url: selectedTest.testVideoUrl },
    ].filter((entry) => entry.url);
  };

  return (
    <div className={sectionCardClass}>
      <h3 className="text-lg font-bold text-[#0F172A]">Test List</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-left text-slate-500">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Price</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.length ? (
              tests.map((item) => (
                <tr key={item._id} className="border-b border-[#E2E8F0]">
                  <td className="py-3 pr-3 font-semibold text-[#0F172A]">
                    {item.name}
                  </td>
                  <td className="py-3 pr-3">{item.category}</td>
                  <td className="py-3 pr-3">INR {item.price}</td>
                  <td className="py-3 pr-3 capitalize">
                    {item.approvalStatus || "pending"}
                  </td>
                  <td className="py-3 pr-3">
                    <button
                      type="button"
                      onClick={() => openDetails(item)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="ml-2 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item._id}
                      className="ml-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {deletingId === item._id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No tests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Lab Test Details"
        className="max-w-4xl"
      >
        {selectedTest ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Test Name" value={selectedTest.name} />
              <DetailField label="Test Code" value={selectedTest.testCode} />
              <DetailField label="Category" value={selectedTest.category} />
              <DetailField
                label="Subcategory"
                value={selectedTest.subcategory}
              />
              <DetailField
                label="Price"
                value={
                  selectedTest.price !== undefined
                    ? `INR ${selectedTest.price}`
                    : "-"
                }
              />
              <DetailField
                label="Original Price"
                value={
                  selectedTest.originalPrice !== undefined
                    ? `INR ${selectedTest.originalPrice}`
                    : "-"
                }
              />
              <DetailField
                label="Sample Type"
                value={selectedTest.sampleType}
              />
              <DetailField
                label="Fasting Hours"
                value={
                  selectedTest.fastingRequired
                    ? selectedTest.fastingHours
                    : "Not Required"
                }
              />
              <DetailField
                label="Report Time"
                value={selectedTest.reportTime || selectedTest.turnaround}
              />
              <DetailField label="Method" value={selectedTest.method} />
              <DetailField label="Department" value={selectedTest.department} />
              <DetailField
                label="Keywords"
                value={
                  Array.isArray(selectedTest.keywords)
                    ? selectedTest.keywords.join(", ")
                    : "-"
                }
              />
              <DetailField
                label="Tags"
                value={
                  Array.isArray(selectedTest.tags)
                    ? selectedTest.tags.join(", ")
                    : "-"
                }
              />
              <DetailField
                label="Collection Slots"
                value={
                  Array.isArray(selectedTest.collectionTimeSlots)
                    ? selectedTest.collectionTimeSlots.join(", ")
                    : "-"
                }
              />
              <DetailField
                label="Short Description"
                value={selectedTest.shortDescription}
              />
              <DetailField
                label="Full Description"
                value={selectedTest.fullDescription}
              />
              <DetailField
                label="Preparation Instructions"
                value={selectedTest.preparationInstructions}
              />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-extrabold text-slate-900">
                Parameters
              </h3>
              {Array.isArray(selectedTest.parameters) &&
              selectedTest.parameters.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedTest.parameters.map((param, index) => (
                    <div
                      key={`${param.name}-${index}`}
                      className="rounded-xl border border-slate-200 p-3 text-sm"
                    >
                      <p className="font-semibold text-slate-900">
                        {param.name}
                      </p>
                      <p className="text-slate-500">
                        {param.normalRange || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No parameters added.</p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-extrabold text-slate-900">
                Uploaded Documents
              </h3>
              {mediaLinks(selectedTest).length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {mediaLinks(selectedTest).map((entry) => (
                    <a
                      key={entry.label}
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      {entry.label}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No documents uploaded.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Lab Test"
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              name="name"
              value={editForm.name || ""}
              onChange={handleEditChange}
              placeholder="Test Name"
              className="w-full rounded-lg border border-slate-200 p-3"
            />
            <input
              name="testCode"
              value={editForm.testCode || ""}
              onChange={handleEditChange}
              placeholder="Test Code"
              className="w-full rounded-lg border border-slate-200 p-3"
            />
            <select
              name="category"
              value={editForm.category || ""}
              onChange={handleEditChange}
              className="w-full rounded-lg border border-slate-200 p-3"
            >
              {defaultCategoryOptions.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              name="subcategory"
              value={editForm.subcategory || ""}
              onChange={handleEditChange}
              placeholder="Subcategory"
              className="w-full rounded-lg border border-slate-200 p-3"
            />
            <input
              name="originalPrice"
              value={editForm.originalPrice || ""}
              onChange={handleEditChange}
              placeholder="Original Price"
              type="number"
              className="w-full rounded-lg border border-slate-200 p-3"
            />
            <input
              name="price"
              value={editForm.price || ""}
              onChange={handleEditChange}
              placeholder="Price"
              type="number"
              className="w-full rounded-lg border border-slate-200 p-3"
            />
            <select
              name="sampleType"
              value={editForm.sampleType || ""}
              onChange={handleEditChange}
              className="w-full rounded-lg border border-slate-200 p-3"
            >
              {sampleTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              name="reportTime"
              value={editForm.reportTime || ""}
              onChange={handleEditChange}
              className="w-full rounded-lg border border-slate-200 p-3"
            >
              {reportTurnaroundOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              name="method"
              value={editForm.method || ""}
              onChange={handleEditChange}
              className="w-full rounded-lg border border-slate-200 p-3"
            >
              {methodOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              name="department"
              value={editForm.department || ""}
              onChange={handleEditChange}
              className="w-full rounded-lg border border-slate-200 p-3"
            >
              {departmentOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                name="fastingRequired"
                checked={Boolean(editForm.fastingRequired)}
                onChange={handleEditChange}
              />
              Fasting Required
            </label>
            <input
              name="fastingHours"
              value={editForm.fastingHours || ""}
              onChange={handleEditChange}
              placeholder="Fasting Hours"
              type="number"
              className="w-full rounded-lg border border-slate-200 p-3"
            />
            <input
              name="tags"
              value={editForm.tags || ""}
              onChange={handleEditChange}
              placeholder="Tags (comma separated)"
              className="w-full rounded-lg border border-slate-200 p-3 md:col-span-2"
            />
            <input
              name="keywords"
              value={editForm.keywords || ""}
              onChange={handleEditChange}
              placeholder="Keywords (comma separated)"
              className="w-full rounded-lg border border-slate-200 p-3 md:col-span-2"
            />
            <textarea
              name="shortDescription"
              value={editForm.shortDescription || ""}
              onChange={handleEditChange}
              placeholder="Short Description"
              className="w-full rounded-lg border border-slate-200 p-3 md:col-span-2"
            />
            <textarea
              name="fullDescription"
              value={editForm.fullDescription || ""}
              onChange={handleEditChange}
              placeholder="Full Description"
              className="w-full rounded-lg border border-slate-200 p-3 md:col-span-2"
            />
          </div>
          {editError ? (
            <p className="text-sm text-rose-600">{editError}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitEdit}
              disabled={savingId === selectedTest?._id}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {savingId === selectedTest?._id ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ReportsPage({ bookings }) {
  const [uploading, setUploading] = useState(false);

  const reportRows = bookings.filter(
    (item) => item.status === "report-ready" || item.status === "completed",
  );

  const dummyUpload = async () => {
    setUploading(true);
    const blob = new Blob(["Sample report"], { type: "application/pdf" });
    const file = new File([blob], "sample-report.pdf", {
      type: "application/pdf",
    });
    await uploadLabReportFile(file);
    setUploading(false);
  };

  return (
    <div className={sectionCardClass}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#0F172A]">Reports</h3>
        <button
          type="button"
          onClick={dummyUpload}
          disabled={uploading}
          className="bg-[#2563EB] text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Upload Report"}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-left text-slate-500">
              <th className="py-2 pr-3">Patient</th>
              <th className="py-2 pr-3">Test</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Report</th>
            </tr>
          </thead>
          <tbody>
            {reportRows.length ? (
              reportRows.map((item) => (
                <tr key={item._id} className="border-b border-[#E2E8F0]">
                  <td className="py-3 pr-3">
                    {item.patient?.name || "Patient"}
                  </td>
                  <td className="py-3 pr-3">{item.labTest?.name || "Test"}</td>
                  <td className="py-3 pr-3 capitalize">{item.status}</td>
                  <td className="py-3 pr-3">
                    {item.reportUrl ? (
                      <a
                        href={item.reportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#2563EB] font-semibold hover:underline"
                      >
                        View Report
                      </a>
                    ) : (
                      "Not Uploaded"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  No reports available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevenuePage({ stats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Revenue" value={`INR ${stats.revenue}`} />
        <Card title="Lab Share" value={`INR ${stats.labShare}`} />
        <Card title="Commission" value={`INR ${stats.adminShare}`} />
      </div>

      <div className={sectionCardClass}>
        <h3 className="text-lg font-bold text-[#0F172A]">Revenue Trend</h3>
        <div className="mt-4 h-52 rounded-xl border border-dashed border-[#E2E8F0] flex items-center justify-center text-slate-500">
          Chart placeholder
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [labName, setLabName] = useState("");
  const [address, setAddress] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [labLogo, setLabLogo] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [costPerKm, setCostPerKm] = useState("0");
  const [minCharge, setMinCharge] = useState("0");
  const [maxServiceRadiusKm, setMaxServiceRadiusKm] = useState("0");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const response = await getLabPartnerSettings();
      if (response.status !== "success") return;
      const data = response.data || {};
      setLabName(data.labName || "");
      setAddress(data.address || "");
      setSupportPhone(data.supportPhone || "");
      setLabLogo(data.logo || "");
      setCostPerKm(String(data.deliveryPricing?.costPerKm ?? 0));
      setMinCharge(String(data.deliveryPricing?.minCharge ?? 0));
      setMaxServiceRadiusKm(
        String(data.deliveryPricing?.maxServiceRadiusKm ?? 0),
      );
    };
    load();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    
    let logoUrl = labLogo;
    if (logoFile) {
      const formData = new FormData();
      formData.append("file", logoFile);
      const uploadRes = await uploadLabReportFile(formData);
      if (uploadRes.status === "success") {
        logoUrl = uploadRes.data?.url || labLogo;
      }
    }

    const response = await updateLabPartnerSettings({
      labName,
      address,
      supportPhone,
      logo: logoUrl,
      deliveryPricing: {
        costPerKm: Number(costPerKm || 0),
        minCharge: Number(minCharge || 0),
        maxServiceRadiusKm: Number(maxServiceRadiusKm || 0),
      },
    });
    setSaving(false);
    if (response.status === "success") {
      setMessage("Settings saved.");
      setLogoFile(null);
    } else {
      setMessage(response.error || "Unable to save settings.");
    }
  };

  return (
    <div className={sectionCardClass}>
      <h3 className="text-lg font-bold text-[#0F172A]">Settings</h3>
      <div className="mt-4 space-y-4">
        <input
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2"
          value={labName}
          onChange={(e) => setLabName(e.target.value)}
          placeholder="Lab name"
        />
        <textarea
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 min-h-24"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
        />
        <input
          className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2"
          value={supportPhone}
          onChange={(e) => setSupportPhone(e.target.value)}
          placeholder="Support phone"
        />

        <div className="rounded-xl border border-[#E2E8F0] p-4 space-y-3">
          <h4 className="text-sm font-bold text-[#0F172A]">Lab Logo</h4>
          {labLogo && (
            <div className="mb-3">
              <img
                src={labLogo}
                alt="Lab Logo"
                className="h-20 w-20 rounded-lg object-cover"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setLogoFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                  setLabLogo(reader.result);
                };
                reader.readAsDataURL(file);
              }
            }}
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2"
            placeholder="Upload lab logo"
          />
        </div>

        <div className="rounded-xl border border-[#E2E8F0] p-4 space-y-3">
          <h4 className="text-sm font-bold text-[#0F172A]">
            Delivery Pricing Settings
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2"
              type="number"
              value={costPerKm}
              onChange={(e) => setCostPerKm(e.target.value)}
              placeholder="Cost per KM"
            />
            <input
              className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2"
              type="number"
              value={minCharge}
              onChange={(e) => setMinCharge(e.target.value)}
              placeholder="Minimum Charge"
            />
            <input
              className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2"
              type="number"
              value={maxServiceRadiusKm}
              onChange={(e) => setMaxServiceRadiusKm(e.target.value)}
              placeholder="Max Service Radius (KM)"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={saveSettings}
          className="w-full rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </div>
  );
}

export default function LabPortalPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState({});
  const [tests, setTests] = useState([]);
  const [bookings, setBookings] = useState([]);

  const stats = useMemo(
    () => ({
      totalTests: Number(dashboard.testsCount || tests.length || 0),
      pendingTests: Number(
        dashboard.pendingTests ||
          tests.filter((item) => item.approvalStatus === "pending").length ||
          0,
      ),
      bookings: Number(dashboard.bookingsCount || bookings.length || 0),
      revenue: Number(dashboard.revenue || 0),
      labShare: Number(dashboard.labShare || 0),
      adminShare: Number(dashboard.adminShare || 0),
      reportsPending: Number(dashboard.reportsPendingCount || 0),
      rejectedTests: Number(dashboard.rejectedTests || 0),
    }),
    [dashboard, tests, bookings],
  );

  const load = async () => {
    const [d, t, b] = await Promise.all([
      getLabPartnerDashboard(),
      getLabPartnerTests(),
      getLabPartnerBookings(),
    ]);

    if (d.status === "success") setDashboard(d.data || {});
    if (t.status === "success") setTests(t.data || []);
    if (b.status === "success") setBookings(b.data || []);
  };

  useEffect(() => {
    queueMicrotask(load);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith("/orders-calendar")) {
      setActiveTab("orders-calendar");
      return;
    }
    if (path.endsWith("/bookings")) {
      setActiveTab("bookings");
      return;
    }
    setActiveTab("dashboard");
  }, [location.pathname]);

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    if (nextTab === "orders-calendar") {
      navigate("/portal/lab/orders-calendar");
      return;
    }
    if (nextTab === "bookings") {
      navigate("/portal/lab/bookings");
      return;
    }
    navigate("/portal/lab");
  };

  const submitTest = async (form, files) => {
    const cleanedParameters = (form.parameters || []).filter(
      (item) => item?.name && item.name.trim(),
    );

    const formatValidationDetails = (details) => {
      const fieldErrors = details?.fieldErrors || {};
      const entries = Object.entries(fieldErrors).filter(
        ([, messages]) => Array.isArray(messages) && messages.length,
      );
      if (!entries.length) return "";
      return entries
        .map(([field, messages]) => `${field}: ${messages.join(" ")}`)
        .join("; ");
    };

    const payload = {
      name: form.name,
      testCode: form.testCode,
      category: form.category,
      subcategory: form.subcategory,
      tags: form.tags || [],
      shortDescription: form.shortDescription,
      fullDescription: form.fullDescription,
      description: form.shortDescription || form.fullDescription,
      originalPrice: Number(form.originalPrice || 0),
      price: Number(form.price || 0),
      gstPercent: Number(form.gstPercent || 0),
      discountPercent:
        Number(form.originalPrice || 0) > 0
          ? ((Number(form.originalPrice || 0) - Number(form.price || 0)) /
              Number(form.originalPrice || 1)) *
            100
          : 0,
      finalPrice:
        Number(form.price || 0) +
        (Number(form.price || 0) * Number(form.gstPercent || 0)) / 100,
      sampleType: form.sampleType,
      fastingRequired: Boolean(form.fastingRequired),
      fastingHours: Number(form.fastingDurationHours || 0),
      collectionInstructions: form.collectionInstructions,
      homeCollectionAvailable: Boolean(form.homeCollectionAvailable),
      labVisitRequired: Boolean(form.labVisitRequired),
      bothAvailable: Boolean(form.bothAvailable),
      technicianRequired: Boolean(form.technicianRequired),
      collectionOption: form.bothAvailable
        ? "both"
        : form.labVisitRequired
          ? "lab"
          : form.homeCollectionAvailable
            ? "home"
            : "both",
      collectionTimeSlots: form.collectionTimeSlots,
      reportTime: form.reportTurnaroundTime,
      parameters: cleanedParameters,
      method: form.methodUsed,
      department: form.department,
      preparationInstructions: [
        form.beforeTestInstructions,
        form.afterTestInstructions,
      ]
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .join("\n"),
      beforeTestInstructions: form.beforeTestInstructions,
      afterTestInstructions: form.afterTestInstructions,
      keywords: form.searchKeywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      slug: form.slug,
      popular: Boolean(form.popularTest),
      recommendedTest: Boolean(form.recommendedTest),
      status: form.status || "submitted",
    };

    const response = await createLabPartnerTestMultipart(payload, files);
    if (response.status === "error") {
      const detailMessage = formatValidationDetails(response.details);
      const message = detailMessage
        ? `Validation failed: ${detailMessage}`
        : response.error || "Unable to submit test.";
      throw new Error(message);
    }
    await load();
  };

  const deleteTest = async (id) => {
    const response = await deleteLabPartnerTest(id);
    if (response.status === "error") {
      throw new Error(response.error || "Unable to delete test.");
    }
    await load();
  };

  const updateTest = async (id, payload) => {
    const response = await updateLabPartnerTest(id, payload);
    if (response.status === "error") {
      throw new Error(response.error || "Unable to update test.");
    }
    await load();
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {activeTab === "dashboard" && <DashboardPage stats={stats} />}
          {activeTab === "tests" && <TestsPage onSubmitTest={submitTest} />}
          {activeTab === "test-list" && (
            <TestListPage
              tests={tests}
              onDeleteTest={deleteTest}
              onUpdateTest={updateTest}
            />
          )}
          {activeTab === "packages" && <PackagesPage />}
          {activeTab === "bookings" && <AdminBookingsPage />}
          {activeTab === "orders-calendar" && <OrdersCalendarPage />}
          {activeTab === "reports" && <ReportsPage bookings={bookings} />}
          {activeTab === "revenue" && <RevenuePage stats={stats} />}
          {activeTab === "settings" && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
