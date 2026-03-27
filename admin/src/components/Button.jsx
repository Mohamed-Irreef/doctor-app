export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

  const variants = {
    primary:
      "bg-gradient-to-r from-brand-blue to-indigo-600 text-white shadow-lg shadow-blue-200/70 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-200",
    secondary:
      "bg-gradient-to-r from-brand-teal to-teal-600 text-white shadow-lg shadow-teal-200/70 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-200",
    outline: "border border-blue-300 text-blue-700 bg-white hover:bg-blue-50",
    danger:
      "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-200/60 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-200",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing
        </span>
      ) : (
        children
      )}
    </button>
  );
}
