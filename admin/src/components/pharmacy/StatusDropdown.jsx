import { memo } from "react";

const OPTIONS = ["pending", "packing", "shipping", "delivered"];

function StatusDropdown({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#2563EB] disabled:cursor-not-allowed disabled:bg-slate-100"
    >
      {OPTIONS.map((item) => (
        <option key={item} value={item}>
          {item.charAt(0).toUpperCase() + item.slice(1)}
        </option>
      ))}
    </select>
  );
}

export default memo(StatusDropdown);
