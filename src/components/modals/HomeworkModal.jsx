import React from 'react';
import { X, Edit3, BookOpen, FileText, CheckSquare, Bookmark } from 'lucide-react';

export default function HomeworkModal({ 
  onClose, 
  currentHomeworkEdit, 
  setCurrentHomeworkEdit, 
  onSave // Fungsi handleSaveHomework
}) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] shadow-2xl w-[95%] max-w-sm md:max-w-md overflow-hidden border-4 border-indigo-200 animate-scale-up">
        <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex justify-between items-center">
           <div>
              <h3 className="text-lg font-black text-indigo-600 uppercase tracking-tight flex items-center gap-2"><Edit3 size={18} /> Input PR</h3>
              <p className="text-xs font-bold text-gray-400">{currentHomeworkEdit.day} • {currentHomeworkEdit.subject}</p>
           </div>
           <button onClick={onClose} className="bg-white p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={onSave} className="p-6 space-y-4">
           <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Topik / Bab</label>
              <div className="relative">
                 <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                 <input 
                   value={currentHomeworkEdit.topic} 
                   onChange={(e) => setCurrentHomeworkEdit({...currentHomeworkEdit, topic: e.target.value})}
                   placeholder="Contoh: Pecahan Campuran" 
                   className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-300 outline-none text-sm font-bold transition-all"
                 />
              </div>
           </div>
           <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Halaman Buku</label>
              <div className="relative">
                 <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                 <input 
                   value={currentHomeworkEdit.page} 
                   onChange={(e) => setCurrentHomeworkEdit({...currentHomeworkEdit, page: e.target.value})}
                   placeholder="Contoh: Hal. 45 - 46" 
                   className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-300 outline-none text-sm font-bold transition-all"
                 />
              </div>
           </div>
           <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tugas Tambahan</label>
              <div className="relative">
                 <CheckSquare size={16} className="absolute left-4 top-4 text-gray-300" />
                 <textarea 
                   value={currentHomeworkEdit.task} 
                   onChange={(e) => setCurrentHomeworkEdit({...currentHomeworkEdit, task: e.target.value})}
                   placeholder="Catatan tambahan untuk murid..." 
                   rows={3}
                   className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-300 outline-none text-sm font-bold transition-all resize-none"
                 />
              </div>
           </div>
           <button type="submit" className="w-full bg-indigo-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 mt-2">
              <Bookmark size={18} /> Simpan PR
           </button>
        </form>
      </div>
    </div>
  );
}
