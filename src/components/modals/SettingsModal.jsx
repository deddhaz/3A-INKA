import React from 'react';
import { X, Settings, Type, School, Camera } from 'lucide-react';

export default function SettingsModal({ 
  onClose, 
  settings, 
  onUpdateSettings, // Fungsi handleUpdateSchoolSettings
  onUploadPhoto     // Fungsi handleTeacherPhotoUpload
}) {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-[95%] md:w-full max-w-xl h-[85vh] md:max-h-[90vh] overflow-y-auto border-4 border-orange-200 p-5 md:p-10 animate-scale-up">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-2xl text-orange-500 shadow-inner"><Settings size={24} /></div>
            <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">Pengaturan Kelas</h2>
          </div>
          <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
        </div>

        <div className="space-y-10">
          {/* Identitas Kelas */}
          <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-gray-100 relative">
            <div className="absolute -top-3 left-6 bg-gray-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-md">Identitas Kelas</div>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Nama Kelas:</label>
                <div className="relative">
                  <Type size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    value={settings.className} 
                    onChange={(e) => onUpdateSettings('className', null, e.target.value)}
                    placeholder="Contoh: Solahudin Al-Ayubi" 
                    className="w-full pl-11 pr-5 py-3 rounded-2xl border-2 border-white focus:border-orange-300 outline-none text-sm font-bold shadow-sm transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Deskripsi Kelas:</label>
                <div className="relative">
                  <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    value={settings.classDescription} 
                    onChange={(e) => onUpdateSettings('classDescription', null, e.target.value)}
                    placeholder="Contoh: Kelas 6A SD Insan Karima" 
                    className="w-full pl-11 pr-5 py-3 rounded-2xl border-2 border-white focus:border-orange-300 outline-none text-sm font-bold shadow-sm transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Profil Wali Kelas */}
          <div className="bg-orange-50/50 p-6 rounded-[2.5rem] border-2 border-orange-100 relative">
            <div className="absolute -top-3 left-6 bg-orange-400 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-md">Profil Wali Kelas</div>
            <div className="flex flex-col md:flex-row gap-6 items-center mt-2">
                <div className="relative group shrink-0">
                   <img src={settings.waliKelas.photoUrl} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" alt="Wali Kelas" />
                   <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Camera size={20} />
                      <input type="file" accept="image/*" onChange={(e) => onUploadPhoto('waliKelas', e)} className="hidden" />
                   </label>
                </div>
                <div className="flex-1 w-full space-y-3">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-orange-400 ml-1">Nama Wali Kelas:</label>
                      <input 
                        value={settings.waliKelas.name} 
                        onChange={(e) => onUpdateSettings('waliKelas', 'name', e.target.value)}
                        placeholder="Nama Wali Kelas..." 
                        className="w-full px-5 py-3 rounded-2xl border-2 border-white focus:border-orange-300 outline-none text-sm font-bold shadow-sm transition-all"
                      />
                   </div>
                </div>
            </div>
          </div>

          {/* Profil Asisten */}
          <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border-2 border-blue-100 relative">
            <div className="absolute -top-3 left-6 bg-blue-400 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-md">Profil Asisten</div>
            <div className="flex flex-col md:flex-row gap-6 items-center mt-2">
                <div className="relative group shrink-0">
                   <img src={settings.asisten.photoUrl} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" alt="Asisten" />
                   <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Camera size={20} />
                      <input type="file" accept="image/*" onChange={(e) => onUploadPhoto('asisten', e)} className="hidden" />
                   </label>
                </div>
                <div className="flex-1 w-full space-y-3">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-blue-400 ml-1">Nama Asisten:</label>
                      <input 
                        value={settings.asisten.name} 
                        onChange={(e) => onUpdateSettings('asisten', 'name', e.target.value)}
                        placeholder="Nama Asisten..." 
                        className="w-full px-5 py-3 rounded-2xl border-2 border-white focus:border-blue-300 outline-none text-sm font-bold shadow-sm transition-all"
                      />
                   </div>
                </div>
            </div>
          </div>

          {/* Profil Ketua Kelas */}
          <div className="bg-purple-50/50 p-6 rounded-[2.5rem] border-2 border-purple-100 relative">
            <div className="absolute -top-3 left-6 bg-purple-400 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-md">Profil Ketua Kelas</div>
            <div className="flex flex-col md:flex-row gap-6 items-center mt-2">
                <div className="relative group shrink-0">
                   <img src={settings.ketuaKelas?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=leader"} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" alt="Ketua Kelas" />
                   <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Camera size={20} />
                      <input type="file" accept="image/*" onChange={(e) => onUploadPhoto('ketuaKelas', e)} className="hidden" />
                   </label>
                </div>
                <div className="flex-1 w-full space-y-3">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-purple-400 ml-1">Nama Ketua Kelas:</label>
                      <input 
                        value={settings.ketuaKelas?.name || ""} 
                        onChange={(e) => onUpdateSettings('ketuaKelas', 'name', e.target.value)}
                        placeholder="Nama Ketua Kelas..." 
                        className="w-full px-5 py-3 rounded-2xl border-2 border-white focus:border-purple-300 outline-none text-sm font-bold shadow-sm transition-all"
                      />
                   </div>
                </div>
            </div>
          </div>
        </div>

        <div className="mt-10 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 text-center">
           <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed italic">
             💡 Perubahan informasi identitas kelas, guru, dan ketua kelas akan langsung terupdate untuk semua siswa.
           </p>
        </div>

        <button onClick={onClose} className="w-full mt-8 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-orange-600 active:scale-[0.98] transition-all">Selesai</button>
      </div>
    </div>
  );
}
