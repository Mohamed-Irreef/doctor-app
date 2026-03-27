import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { DOCTORS } from '../data/mockData';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SlotsPage() {
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0].id);
  const doctor = DOCTORS.find(d => d.id === selectedDoctor);

  const mockSlots = [
    { time: '09:00 AM', status: 'Booked' },
    { time: '09:30 AM', status: 'Available' },
    { time: '10:00 AM', status: 'Booked' },
    { time: '10:30 AM', status: 'Booked' },
    { time: '11:00 AM', status: 'Available' },
    { time: '11:30 AM', status: 'Blocked' },
    { time: '02:00 PM', status: 'Available' },
    { time: '02:30 PM', status: 'Available' },
    { time: '03:00 PM', status: 'Booked' },
    { time: '03:30 PM', status: 'Available' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Slot Management" 
        description="View and manage consultation availability on a per-doctor basis."
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="w-full sm:w-1/3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Doctor</label>
            <select 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              value={selectedDoctor}
              onChange={e => setSelectedDoctor(e.target.value)}
            >
              {DOCTORS.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button className="p-1 hover:bg-slate-200 rounded transition-colors"><ChevronLeft size={20} className="text-slate-600" /></button>
            <div className="flex items-center gap-2 font-medium text-slate-800 text-sm px-2">
              <Calendar size={16} className="text-blue-600" /> Today, Oct 27
            </div>
            <button className="p-1 hover:bg-slate-200 rounded transition-colors"><ChevronRight size={20} className="text-slate-600" /></button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <img src={doctor.image} alt="" className="w-8 h-8 rounded-full object-cover" />
            {doctor.name}'s Schedule
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mockSlots.map((slot, i) => {
              let bg = 'bg-slate-50 border-slate-200';
              let text = 'text-slate-700';
              if (slot.status === 'Booked') {
                bg = 'bg-blue-50 border-blue-200';
                text = 'text-blue-700';
              } else if (slot.status === 'Blocked') {
                bg = 'bg-red-50 border-red-200';
                text = 'text-red-700';
              }

              return (
                <div key={i} className={`border rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer hover:shadow-md ${bg} ${text}`}>
                  <Clock size={18} className="mb-2 opacity-80" />
                  <span className="font-semibold text-sm">{slot.time}</span>
                  <span className="text-xs mt-1 opacity-70 font-medium">{slot.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
