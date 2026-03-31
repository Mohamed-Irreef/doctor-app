import { Clock3, Droplets, Home, TestTube2 } from "lucide-react";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function PatientTestCard({ test, onBookNow, onOpenDetails }) {
  const originalPrice = toNumber(test?.originalPrice || test?.price);
  const offerPrice = toNumber(test?.price);
  const discount =
    originalPrice > 0
      ? Math.max(
          0,
          Math.round(((originalPrice - offerPrice) / originalPrice) * 100),
        )
      : 0;

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-[16/9] w-full overflow-hidden rounded-t-xl bg-slate-100">
        {test?.testImageUrl ? (
          <img
            src={test.testImageUrl}
            alt={test?.name || "Lab test"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <TestTube2 size={28} />
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-lg font-bold text-slate-900">
            {test?.name}
          </h3>
          <p className="text-xs font-medium text-blue-600">
            {test?.category || "General"}
          </p>
          <p className="line-clamp-2 text-sm text-slate-600">
            {test?.shortDescription}
          </p>
        </div>

        <div className="flex items-end gap-2">
          <p className="text-2xl font-extrabold text-blue-600">
            INR {offerPrice}
          </p>
          <p className="text-sm text-slate-400 line-through">
            INR {originalPrice}
          </p>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
            {discount}% OFF
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
            <Droplets size={12} />
            {test?.fastingRequired ? "Fasting Required" : "No Fasting"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
            <Clock3 size={12} />
            {test?.reportTime || "24 hrs"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
            <Home size={12} />
            {test?.homeCollectionAvailable ? "Home Collection" : "Lab Visit"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onOpenDetails?.(test)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View Details
          </button>
          <button
            type="button"
            onClick={() => onBookNow?.(test)}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Book Now
          </button>
        </div>
      </div>
    </article>
  );
}
