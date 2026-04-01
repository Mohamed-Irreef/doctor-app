import { memo } from "react";

const STYLE_MAP = {
  pending: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
  approved: "bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]",
  rejected: "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]",
  packing: "bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]",
  shipping: "bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]",
  delivered: "bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]",
};

function label(status) {
  const value = String(status || "pending").toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function StatusBadge({ status }) {
  const key = String(status || "pending").toLowerCase();
  const style = STYLE_MAP[key] || STYLE_MAP.pending;

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${style}`}
    >
      {label(key)}
    </span>
  );
}

export default memo(StatusBadge);
