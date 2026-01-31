import React from 'react';
import { X, CalendarDays, CheckCircle } from 'lucide-react';

export default function ScheduleModal({ 
  onClose, 
  scheduleData, 
  setScheduleData, 
  onSave // Fungsi handleSaveScheduleText
}) {
  return (
    <div className="fixed inset-0 z-[450] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-[95%] md:w-full max-w-lg overflow-y-auto border-4 border-blue-200 p-5 md:p-8 animate-scale-up max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-500 shadow-inner"><CalendarDays size={24} /></div>
              <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">Atur Jadwal</h2>
           </div>
           <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
        </div>
        
        <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800">
          <p className="font-bold mb-1">💡 Tips Format Guru Mapel:</p>
          <p>Gunakan tanda garis tegak <b>"|"</b> untuk memisahkan nama pelajaran dan nama guru.</p>
          <p className="mt-1 opacity-70 italic">Contoh: Matematika | Pak Budi</p>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(day => (
            <div key={day} className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-500 ml-1 block">{day}</label>
              <textarea 
                value={scheduleData[day] || ''} 
                onChange={(e) => setScheduleData({...scheduleData, [day]: e.target.value})}
                placeholder={`Pelajaran hari ${day}... \nContoh: MTK | Pak Budi`}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-400 outline-none text-sm font-bold bg-gray-50 focus:bg-white transition-all resize-none"
                rows={3}
              />
            </div>
          ))}
          <button type="submit" className="w-full mt-4 py-4 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <CheckCircle size={20} /> Simpan Jadwal
          </button>
        </form>
      </div>
    </div>
  );
}
