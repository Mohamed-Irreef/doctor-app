export default function BookingTabs({ activeTab, onChange, counts = {} }) {
  const tabs = [
    { key: "home", label: "Home Collection", count: counts.home || 0 },
    { key: "lab", label: "Lab Visit", count: counts.lab || 0 },
  ];

  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              active
                ? "bg-[#2563EB] text-white shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/20" : "bg-white text-slate-600"}`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
