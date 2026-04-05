const MEDICINE_FILTER_CATEGORIES = [
  "All",
  "Pain Relief",
  "Fever",
  "Antibiotics",
  "Antidiabetic",
  "Cardiac Care",
  "Gastro / Acidity",
  "Vitamins & Supplements",
  "Skin Care",
  "Respiratory",
  "Neurology",
  "Women Care",
  "Men Care",
  "Child Care",
  "Immunity Boosters",
  "General Medicines",
];

const MEDICINE_DB_CATEGORIES = MEDICINE_FILTER_CATEGORIES.filter(
  (item) => item !== "All",
);

const DEFAULT_MEDICINE_CATEGORY = "General Medicines";

function normalizeMedicineCategory(value, { allowAll = false } = {}) {
  const source = allowAll ? MEDICINE_FILTER_CATEGORIES : MEDICINE_DB_CATEGORIES;
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return "";

  return source.find((item) => item.toLowerCase() === raw) || "";
}

module.exports = {
  MEDICINE_FILTER_CATEGORIES,
  MEDICINE_DB_CATEGORIES,
  DEFAULT_MEDICINE_CATEGORY,
  normalizeMedicineCategory,
};
