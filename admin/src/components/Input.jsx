export default function Input({ label, error, className = "", ...props }) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <input
        className={`
          w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-800
          placeholder:font-normal placeholder:text-slate-400
          focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10
          transition-all duration-200
          ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/5" : ""}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
