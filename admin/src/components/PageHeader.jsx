export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-blue" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Admin Module
          </p>
        </div>
        <h1 className="text-[26px] font-black leading-none tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm font-medium text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {action}
        </div>
      )}
    </div>
  );
}
