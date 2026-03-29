import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { getAdminDoctors, getAdminSlots } from "../services/api";

export default function SlotsPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    const loadDoctors = async () => {
      const response = await getAdminDoctors();
      if (response.data) {
        setDoctors(response.data);
        if (response.data.length) {
          setSelectedDoctor(response.data[0]._id || response.data[0].id);
        }
      }
    };
    loadDoctors();
  }, []);

  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedDoctor) return;
      const response = await getAdminSlots({ doctorId: selectedDoctor });
      if (response.data) setSlots(response.data);
    };
    loadSlots();
  }, [selectedDoctor]);

  const doctor = useMemo(
    () => doctors.find((d) => (d.id || d._id) === selectedDoctor),
    [doctors, selectedDoctor],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Slot Management"
        description="View and manage consultation availability on a per-doctor basis."
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Doctor
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              {doctors.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  {d.name} ({d.profile?.specialization || "Doctor"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button className="p-1 hover:bg-slate-200 rounded transition-colors">
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-2 font-medium text-slate-800 text-sm px-2">
              <Calendar size={16} className="text-blue-600" /> Today, Oct 27
            </div>
            <button className="p-1 hover:bg-slate-200 rounded transition-colors">
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <img
              src={doctor?.image}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
            {doctor?.name}'s Schedule
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {slots.map((slot, i) => {
              let bg = "bg-slate-50 border-slate-200";
              let text = "text-slate-700";
              if (slot.status === "booked") {
                bg = "bg-blue-50 border-blue-200";
                text = "text-blue-700";
              } else if (slot.status === "blocked") {
                bg = "bg-red-50 border-red-200";
                text = "text-red-700";
              }

              return (
                <div
                  key={i}
                  className={`border rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:shadow-md ${bg} ${text}`}
                >
                  <Clock size={18} className="mb-2 opacity-80" />
                  <span className="font-semibold text-sm">
                    {slot.startTime}
                  </span>
                  <span className="text-xs mt-1 opacity-70 font-medium">
                    {String(slot.status).charAt(0).toUpperCase() +
                      String(slot.status).slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
