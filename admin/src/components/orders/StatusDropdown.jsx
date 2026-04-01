export default function StatusDropdown({ value, options, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option.replace(/[_-]+/g, " ")}
        </option>
      ))}
    </select>
  );
}
