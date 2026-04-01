import { useEffect, useMemo, useState } from "react";
import {
    createAdminArticle,
    deleteAdminArticle,
    getAdminArticles,
    updateAdminArticle,
    uploadPublicFile,
} from "../../services/api";

const TABS = ["basic", "content", "media", "settings", "seo"];
const CATEGORIES = [
  "General Health",
  "Cardiology",
  "Mental Health",
  "Nutrition",
  "Pediatrics",
  "Fitness",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Gynecology",
  "Pulmonology",
  "Gastroenterology",
  "Endocrinology",
  "Nephrology",
  "Oncology",
  "ENT",
  "Ophthalmology",
  "Urology",
  "Preventive Care",
  "Lifestyle",
  "Public Health",
];

const INITIAL_FORM = {
  title: "",
  slug: "",
  shortDescription: "",
  content: "",
  coverImage: "",
  images: [],
  category: CATEGORIES[0],
  tags: "",
  authorName: "NiviDoc Editorial",
  authorRole: "Admin",
  authorAvatar: "",
  isFeatured: false,
  isPublished: false,
  readTime: "",
  metaTitle: "",
  metaDescription: "",
  keywords: "",
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanText(value) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

export default function CreateArticlePage() {
  const [activeTab, setActiveTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState(INITIAL_FORM);
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState("");
  const activeTabIndex = TABS.indexOf(activeTab);
  const isFirstTab = activeTabIndex === 0;
  const isLastTab = activeTabIndex === TABS.length - 1;

  const readTimePreview = useMemo(() => {
    const content = form.content || "";
    const words = content
      .replace(/<[^>]*>/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [form.content]);

  const loadArticles = async () => {
    setLoading(true);
    const res = await getAdminArticles({
      page: 1,
      limit: 20,
      sortBy: "latest",
    });
    setLoading(false);
    if (res.status === "success") {
      setItems(res.data?.items || []);
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !editingId) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const uploadAndSet = async (file, key, isGallery = false) => {
    if (!file) return;
    const uploaded = await uploadPublicFile(file, "nividoc/articles");
    if (uploaded.status === "error") {
      setMessage({ type: "error", text: uploaded.error || "Upload failed" });
      return;
    }

    const url = uploaded.data?.url;
    if (!url) return;

    if (isGallery) {
      setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
    } else {
      updateField(key, url);
    }
  };

  const toPayload = () => {
    const metaTitle = cleanText(form.metaTitle);
    const metaDescription = cleanText(form.metaDescription);
    const keywords = splitCsv(form.keywords);

    const seo =
      metaTitle || metaDescription || keywords.length
        ? {
            ...(metaTitle ? { metaTitle } : {}),
            ...(metaDescription ? { metaDescription } : {}),
            ...(keywords.length ? { keywords } : {}),
          }
        : undefined;

    return {
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      shortDescription: String(form.shortDescription || "").trim(),
      content: form.content,
      coverImage: cleanText(form.coverImage),
      images: Array.isArray(form.images)
        ? form.images.map((image) => String(image || "").trim()).filter(Boolean)
        : [],
      category: String(form.category || "").trim(),
      tags: splitCsv(form.tags),
      author: {
        name: String(form.authorName || "").trim(),
        role: form.authorRole,
        avatar: cleanText(form.authorAvatar),
      },
      isFeatured: Boolean(form.isFeatured),
      isPublished: Boolean(form.isPublished),
      readTime: Number(form.readTime || readTimePreview),
      ...(seo ? { seo } : {}),
    };
  };

  const saveArticle = async ({ publish = true } = {}, event) => {
    if (event?.preventDefault) event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    const payload = {
      ...toPayload(),
      isPublished: publish,
    };

    const response = editingId
      ? await updateAdminArticle(editingId, payload)
      : await createAdminArticle(payload);

    setSaving(false);

    if (response.status === "error") {
      setMessage({ type: "error", text: response.error || "Save failed" });
      return;
    }

    setMessage({
      type: "success",
      text: publish
        ? editingId
          ? "Article updated."
          : "Article published."
        : editingId
          ? "Draft updated."
          : "Draft saved.",
    });
    setForm(INITIAL_FORM);
    setEditingId("");
    await loadArticles();
  };

  const goNext = () => {
    if (isLastTab) return;
    setActiveTab(TABS[activeTabIndex + 1]);
  };

  const goBack = () => {
    if (isFirstTab) return;
    setActiveTab(TABS[activeTabIndex - 1]);
  };

  const editArticle = (item) => {
    setEditingId(item._id);
    setActiveTab("basic");
    setForm({
      ...INITIAL_FORM,
      title: item.title || "",
      slug: item.slug || "",
      shortDescription: item.shortDescription || "",
      content: item.content || "",
      coverImage: item.coverImage || "",
      images: item.images || [],
      category: item.category || CATEGORIES[0],
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
      authorName: item.author?.name || "",
      authorRole: item.author?.role || "Admin",
      authorAvatar: item.author?.avatar || "",
      isFeatured: Boolean(item.isFeatured),
      isPublished: Boolean(item.isPublished),
      readTime: String(item.readTime || ""),
      metaTitle: item.seo?.metaTitle || "",
      metaDescription: item.seo?.metaDescription || "",
      keywords: Array.isArray(item.seo?.keywords)
        ? item.seo.keywords.join(", ")
        : "",
    });
  };

  const removeArticle = async (id) => {
    const yes = window.confirm("Delete this article?");
    if (!yes) return;
    const response = await deleteAdminArticle(id);
    if (response.status === "error") {
      setMessage({ type: "error", text: response.error || "Delete failed" });
      return;
    }
    await loadArticles();
  };

  useEffect(() => {
    queueMicrotask(() => {
      loadArticles();
    });
  }, []);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
          Content Module
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Articles CMS
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Create, publish, and manage educational health articles.
        </p>
      </header>

      <form
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"
        onSubmit={(event) => saveArticle({ publish: true }, event)}
      >
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "basic" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field
              label="Title"
              value={form.title}
              onChange={(v) => updateField("title", v)}
              required
            />
            <Field
              label="Slug"
              value={form.slug}
              onChange={(v) => updateField("slug", slugify(v))}
              required
            />
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Category
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Tags (comma separated)"
              value={form.tags}
              onChange={(v) => updateField("tags", v)}
            />
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Short Description
              </label>
              <textarea
                className="min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={form.shortDescription}
                onChange={(e) =>
                  updateField("shortDescription", e.target.value)
                }
              />
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rich Content (HTML/Markdown)
            </p>
            <textarea
              className="min-h-72 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              value={form.content}
              onChange={(e) => updateField("content", e.target.value)}
              placeholder="Write article content with headings, lists and inline markup"
            />
          </div>
        )}

        {activeTab === "media" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Cover Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  uploadAndSet(e.target.files?.[0], "coverImage")
                }
              />
              {form.coverImage ? (
                <img
                  src={form.coverImage}
                  alt="cover"
                  className="mt-2 h-40 w-full rounded-xl object-cover"
                />
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Additional Images
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  uploadAndSet(e.target.files?.[0], "images", true)
                }
              />
              <div className="mt-2 grid grid-cols-3 gap-2">
                {form.images.map((img) => (
                  <img
                    key={img}
                    src={img}
                    alt="article"
                    className="h-20 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Toggle
              label="Featured"
              checked={form.isFeatured}
              onChange={(v) => updateField("isFeatured", v)}
            />
            <Toggle
              label="Published"
              checked={form.isPublished}
              onChange={(v) => updateField("isPublished", v)}
            />
            <Field
              label="Author Name"
              value={form.authorName}
              onChange={(v) => updateField("authorName", v)}
              required
            />
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Author Role
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={form.authorRole}
                onChange={(e) => updateField("authorRole", e.target.value)}
              >
                <option value="Admin">Admin</option>
                <option value="Doctor">Doctor</option>
              </select>
            </div>
            <Field
              label="Read Time (min)"
              value={form.readTime}
              onChange={(v) => updateField("readTime", v)}
              placeholder={`Auto: ${readTimePreview}`}
            />
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Author Avatar Upload
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  uploadAndSet(e.target.files?.[0], "authorAvatar")
                }
              />
              {form.authorAvatar ? (
                <img
                  src={form.authorAvatar}
                  alt="author avatar"
                  className="mt-2 h-16 w-16 rounded-full border border-slate-200 object-cover"
                />
              ) : null}
            </div>
          </div>
        )}

        {activeTab === "seo" && (
          <div className="mt-4 grid gap-4">
            <Field
              label="Meta Title"
              value={form.metaTitle}
              onChange={(v) => updateField("metaTitle", v)}
            />
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Meta Description
              </label>
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                value={form.metaDescription}
                onChange={(e) => updateField("metaDescription", e.target.value)}
              />
            </div>
            <Field
              label="Keywords (comma separated)"
              value={form.keywords}
              onChange={(v) => updateField("keywords", v)}
            />
          </div>
        )}

        {message.text ? (
          <div
            className={`mt-4 rounded-xl border px-3 py-2 text-sm font-semibold ${message.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setForm(INITIAL_FORM);
              setEditingId("");
            }}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Reset
          </button>

          {isFirstTab ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
            >
              Continue
            </button>
          ) : null}

          {!isFirstTab && !isLastTab ? (
            <>
              <button
                type="button"
                onClick={goBack}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={goNext}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
              >
                Continue
              </button>
            </>
          ) : null}

          {isLastTab ? (
            <>
              <button
                type="button"
                onClick={goBack}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Back
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={(event) => saveArticle({ publish: false }, event)}
                className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save as Draft"}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Submit Update" : "Submit"}
              </button>
            </>
          ) : null}
        </div>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            Existing Articles
          </h2>
          <button
            type="button"
            onClick={loadArticles}
            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading articles...</p>
        ) : !items.length ? (
          <p className="text-sm text-slate-500">No articles created yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    /{item.slug} · {item.isPublished ? "Published" : "Draft"} ·{" "}
                    {item.isFeatured ? "Featured" : "Standard"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editArticle(item)}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeArticle(item._id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-12 rounded-full p-0.5 transition-all duration-200 ${checked ? "bg-linear-to-r from-blue-500 to-indigo-600 shadow-sm" : "bg-slate-300"}`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-0"}`}
        />
      </button>
    </label>
  );
}
