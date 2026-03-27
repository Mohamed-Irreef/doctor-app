import Button from '../components/Button';
import Input from '../components/Input';
import { Save, Settings, Shield, Bell, CreditCard, Stethoscope } from 'lucide-react';

export default function SettingsPage() {
  const handleSave = (e) => {
    e.preventDefault();
    alert('System settings updated successfully.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader 
        title="System Settings" 
        description="Global platform configurations and business rules."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-3 bg-blue-50 text-blue-700 font-bold border border-blue-100">
            <Settings size={18} /> General
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 font-bold">
            <CreditCard size={18} /> Commissions
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 font-bold">
            <Stethoscope size={18} /> Approvals
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 font-bold">
            <Bell size={18} /> Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 font-bold">
            <Shield size={18} /> Security
          </Button>
        </div>

        <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          <form className="p-6 md:p-8" onSubmit={handleSave}>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 pb-4 border-b border-slate-100">Commission Rules</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <Input 
                label="Consultation Commission (%)" 
                type="number" 
                defaultValue={15} 
                placeholder="15"
              />
              <Input 
                label="Pharmacy Markup (%)" 
                type="number" 
                defaultValue={20} 
                placeholder="20"
              />
            </div>

            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 pb-4 border-b border-slate-100 mt-10">Application Settings</h3>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-800">Auto-Approve Doctors</p>
                  <p className="text-sm text-slate-500 mt-0.5">Allow verified hospital doctors instantly</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
              </label>

              <label className="flex items-center justify-between p-4 border border-blue-200 rounded-xl bg-blue-50 cursor-pointer">
                <div>
                  <p className="font-semibold text-blue-900">SMS Notifications</p>
                  <p className="text-sm text-blue-700 mt-0.5">Send OTP and appointment alerts via SMS</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
              </label>

              <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50 cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-800">Maintenance Mode</p>
                  <p className="text-sm text-slate-500 mt-0.5">Display maintenance screen to patients and doctors</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded text-red-600 focus:ring-red-500" />
              </label>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="ghost" className="px-8 font-bold">Discard</Button>
              <Button type="submit" className="px-8 gap-2">
                <Save size={18} /> Save System Settings
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
