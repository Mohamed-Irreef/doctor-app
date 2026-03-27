import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, trend, trendUp }) {
  return (
    <article className="group panel-card relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-blue via-indigo-500 to-brand-teal opacity-70" />

      <div className="flex flex-col gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${trendUp ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
        >
          <Icon
            size={22}
            className="transition-transform group-hover:scale-110"
          />
        </div>

        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
          <div className="flex items-end justify-between gap-3">
            <h3 className="text-2xl font-black leading-tight text-slate-900">
              {value}
            </h3>
            {trend && (
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${trendUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
              >
                {trendUp ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}{" "}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
