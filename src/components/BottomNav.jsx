import React from 'react';
import { Home, Calendar, UserPlus, CheckSquare } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange }) {
  
  // Fungsi untuk mengecek tab aktif agar warnanya berubah
  const getNavClass = (tabName) => {
    const isActive = activeTab === tabName;
    return `flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ${
      isActive 
        ? 'text-pink-500 scale-110 -translate-y-1' 
        : 'text-gray-400 hover:text-gray-600'
    }`;
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 h-16 bg-white rounded-2xl shadow-2xl border border-gray-100 flex justify-around items-center z-50 animate-slide-up">
      {/* 1. HOME (Gallery Teman) */}
      <button 
        onClick={() => onTabChange('gallery')} 
        className={getNavClass('gallery')}
      >
        <Home size={24} className={activeTab === 'gallery' ? 'fill-current' : ''} />
        <span className="text-[10px] font-bold mt-1">Beranda</span>
      </button>

      {/* 2. JADWAL PELAJARAN */}
      <button 
        onClick={() => onTabChange('lessons')} 
        className={getNavClass('lessons')}
      >
        <Calendar size={24} className={activeTab === 'lessons' ? 'fill-current' : ''} />
        <span className="text-[10px] font-bold mt-1">Jadwal</span>
      </button>

      {/* 3. PIKET (Bonus: Karena ada datanya di App.js) */}
      <button 
        onClick={() => onTabChange('piket')} 
        className={getNavClass('piket')}
      >
        <CheckSquare size={24} className={activeTab === 'piket' ? 'fill-current' : ''} />
        <span className="text-[10px] font-bold mt-1">Piket</span>
      </button>

      {/* 4. PROFILE (Isi Biodata) */}
      <button 
        onClick={() => onTabChange('form')} 
        className={getNavClass('form')}
      >
        <UserPlus size={24} className={activeTab === 'form' ? 'fill-current' : ''} />
        <span className="text-[10px] font-bold mt-1">Profil</span>
      </button>
    </div>
  );
}
