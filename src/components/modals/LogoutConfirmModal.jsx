import React from 'react';
import { LogOut } from 'lucide-react';

export default function LogoutConfirmModal({ 
  onClose, 
  onLogout // Fungsi handleLogout
}) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-2xl p-6 md:p-8 w-[90%] max-w-sm text-center border-4 border-orange-200 animate-scale-up">
        <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <LogOut size={40} className="text-orange-500" />
        </div>
        <h3 className="text-2xl font-black text-gray-800 mb-2">Mau Keluar?</h3>
        <p className="text-gray-500 mb-8 font-medium">Apakah kamu yakin ingin keluar dari kelas?</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Batal</button>
          <button onClick={onLogout} className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-black uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all">Ya, Keluar</button>
        </div>
      </div>
    </div>
  );
}
