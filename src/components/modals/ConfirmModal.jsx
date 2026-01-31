import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function ConfirmModal({ 
  onClose, 
  onConfirm // Fungsi handleConfirmSave
}) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-[90%] max-w-sm text-center border-4 border-pink-200">
        <div className="bg-pink-50 p-3 rounded-full inline-block mb-4">
          <CheckCircle size={40} className="text-pink-500 mx-auto" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Sudah Yakin?</h3>
        <p className="text-gray-500 mb-6">Pastikan datanya sudah benar ya.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-6 py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-400 transition">Cek Lagi</button>
          <button onClick={onConfirm} className="px-6 py-2 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 shadow-lg transform active:scale-95 transition">Ya, Simpan!</button>
        </div>
      </div>
    </div>
  );
}
