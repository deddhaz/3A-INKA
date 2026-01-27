import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
import { 
  Star, Heart, Smile, Trash2, Plus, BookOpen, Gamepad2, 
  Utensils, Rocket, Camera, Upload, X, 
  Lock, Key, School, ArrowRight, CheckCircle, LayoutGrid, List, Pencil, RotateCcw, LogOut,
  Calendar, Clock, CheckSquare, Download, Share, PlusSquare, Home, UserPlus
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBC-15YvoHfx8CxsP9ddmMSWfw0aGeJRak",
  authDomain: "a-inka.firebaseapp.com",
  projectId: "a-inka",
  storageBucket: "a-inka.firebasestorage.app",
  messagingSenderId: "554090824336",
  appId: "1:554090824336:web:18902f6b1264965f808e15"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const COLLECTION_NAME = 'kelas6_biodata';

// ==========================================
// SUB-KOMPONEN 1: INSTALL PROMPT (PWA)
// ==========================================
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);
    if (window.matchMedia('(display-mode: standalone)').matches) return; 

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    if (isIosDevice) {
      setTimeout(() => setShowPrompt(true), 3000);
    }
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-24 z-[100] animate-bounce">
      <div className="bg-white rounded-2xl shadow-2xl p-4 border-4 border-orange-400 max-w-sm ml-auto relative">
        <button onClick={() => setShowPrompt(false)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><X size={16} /></button>
        <div className="flex items-start gap-4">
          <div className="bg-orange-100 p-3 rounded-xl"><Download className="text-orange-500 w-8 h-8" /></div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Pasang Aplikasi?</h3>
            <p className="text-gray-500 text-sm leading-tight mb-3">Install agar lebih mudah dibuka di HP-mu!</p>
            {isIOS ? (
              <div className="bg-gray-100 p-2 rounded-lg text-[10px] text-gray-600 space-y-1">
                <p>1. Klik Share <Share size={10} className="inline" /></p>
                <p>2. Pilih "Add to Home Screen" <PlusSquare size={10} className="inline" /></p>
              </div>
            ) : (
              <button onClick={handleInstallClick} className="w-full bg-orange-500 text-white font-bold py-2 rounded-xl shadow-md flex items-center justify-center gap-2 text-sm">Install Sekarang</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB-KOMPONEN 2: BOTTOM NAVIGATION
// ==========================================
const BottomNav = ({ activeTab, onTabChange }) => {
  const getNavClass = (tabName) => {
    const isActive = activeTab === tabName;
    return `flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ${isActive ? 'text-pink-500 scale-110 -translate-y-1' : 'text-gray-400'}`;
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 h-16 bg-white rounded-2xl shadow-2xl border border-gray-100 flex justify-around items-center z-50">
      <button onClick={() => onTabChange('gallery')} className={getNavClass('gallery')}>
        <Home size={24} />
        <span className="text-[10px] font-bold mt-1">Beranda</span>
      </button>
      <button onClick={() => onTabChange('lessons')} className={getNavClass('lessons')}>
        <Calendar size={24} />
        <span className="text-[10px] font-bold mt-1">Jadwal</span>
      </button>
      <button onClick={() => onTabChange('piket')} className={getNavClass('piket')}>
        <CheckSquare size={24} />
        <span className="text-[10px] font-bold mt-1">Piket</span>
      </button>
      <button onClick={() => onTabChange('form')} className={getNavClass('form')}>
        <UserPlus size={24} />
        <span className="text-[10px] font-bold mt-1">Profil</span>
      </button>
    </div>
  );
};

// ==========================================
// SUB-KOMPONEN 3: GALLERY
// ==========================================
const Gallery = ({ friends, isMobileGrid, setIsMobileGrid, handleLove, handleEdit, handleDelete, user, userRole, getAvatar, setActiveTab }) => {
  if (friends.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl shadow-lg border-2 border-dashed border-gray-300 mx-auto max-w-md">
        <div className="text-6xl mb-4">😢</div>
        <h3 className="text-xl font-bold text-gray-500">Belum ada teman.</h3>
        <button onClick={() => setActiveTab('form')} className="mt-4 text-pink-500 font-bold hover:underline">Isi biodata sekarang →</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-700">Teman-teman Kelas 6C</h2>
        <button onClick={() => setIsMobileGrid(!isMobileGrid)} className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-600 border border-gray-200">
          {isMobileGrid ? <List size={16} /> : <LayoutGrid size={16} />} {isMobileGrid ? 'List' : 'Grid'}
        </button>
      </div>
      <div className={`grid ${isMobileGrid ? 'grid-cols-2 gap-3' : 'grid-cols-1 gap-4'} md:grid-cols-2 lg:grid-cols-3 md:gap-6`}>
        {friends.map((friend) => {
          const avatarData = getAvatar(friend.avatar);
          const hasPhoto = friend.usePhoto && friend.photoUrl;
          const isLoved = localStorage.getItem(`loved_${friend.id}`);
          const isOwner = user && user.uid === friend.creatorId;
          const canEdit = userRole === 'admin' || isOwner;
          
          return (
            <div key={friend.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border-b-4 border-blue-200 hover:scale-[1.02] transition">
              <div className={`h-20 ${hasPhoto ? 'bg-gray-200' : avatarData.color.split(' ')[0]} relative flex justify-center items-end`}>
                <div className="bg-white p-1 rounded-full shadow-md -mb-8 ring-4 ring-white z-10 overflow-hidden w-16 h-16 flex items-center justify-center">
                   {hasPhoto ? ( <img src={friend.photoUrl} alt={friend.name} className="w-full h-full object-cover rounded-full" /> ) : ( <div className={`w-full h-full rounded-full flex items-center justify-center ${avatarData.color} text-3xl shadow-inner`}>{avatarData.emoji}</div> )}
                </div>
                <button onClick={() => handleLove(friend.id)} className={`absolute top-2 left-2 p-1.5 rounded-full shadow-sm transition flex items-center gap-1 ${isLoved ? 'bg-pink-100 text-pink-600' : 'bg-white/70 text-gray-500 hover:text-pink-500'}`}>
                  <Heart size={16} className={isLoved ? 'fill-current' : ''} />
                  <span className="text-xs font-bold">{friend.loves || 0}</span>
                </button>
                <div className="absolute top-2 right-2 flex gap-1">
                  {canEdit && (<button onClick={() => handleEdit(friend)} className="text-blue-400 bg-white/70 p-1.5 rounded-full hover:bg-white transition shadow-sm"><Pencil size={14} /></button>)}
                  {userRole === 'admin' && (<button onClick={() => handleDelete(friend.id)} className="text-red-300 bg-white/70 p-1.5 rounded-full hover:bg-white transition shadow-sm"><Trash2 size={14} /></button>)}
                </div>
              </div>
              <div className="pt-10 pb-6 px-4 text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-0.5">{friend.name}</h3>
                <p className={`text-blue-500 font-medium text-xs uppercase tracking-wide mb-3 ${isMobileGrid ? 'hidden md:block' : ''}`}>"{friend.nickname || friend.name}"</p>
                <div className={`space-y-2 text-left bg-gray-50 p-3 rounded-xl text-xs ${isMobileGrid ? 'hidden md:block' : ''}`}>
                  <div className="flex items-start gap-2"><Rocket className="text-blue-400" size={14} /><span className="text-gray-600 font-bold min-w-[4rem]">Cita-cita:</span><span className="text-gray-800 flex-1">{friend.dream || '-'}</span></div>
                  <div className="flex items-start gap-2"><Gamepad2 className="text-green-400" size={14} /><span className="text-gray-600 font-bold min-w-[4rem]">Hobi:</span><span className="text-gray-800 flex-1">{friend.hobby || '-'}</span></div>
                </div>
                <div className={`mt-3 relative ${isMobileGrid ? 'hidden md:block' : ''}`}>
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 rounded-full">Pesan</div>
                  <div className="border-2 border-dashed border-yellow-200 rounded-lg p-2 bg-yellow-50 text-gray-700 italic text-xs pt-3">"{friend.message}"</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// SUB-KOMPONEN 4: BIOFORM
// ==========================================
const BioForm = ({ isEditing, handleCancelEdit, handlePreSubmit, formData, setFormData, handleInputChange, handleAvatarSelect, handlePhotoUpload, removePhoto, isSubmitting, avatars }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-4 md:p-8 max-w-2xl mx-auto border-2 border-pink-200 relative animate-slide-up">
      {isEditing && (
         <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-yellow-200"><Pencil size={12} /> Mode Edit</div>
      )}
      <h2 className="text-xl md:text-2xl font-bold text-pink-600 mb-6 text-center">{isEditing ? '✏️ Perbarui Biodatamu' : '✏️ Isi Biodatamu Yuk!'}</h2>
      <form onSubmit={handlePreSubmit} className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
          <label className="block text-gray-700 font-bold mb-3 text-center text-sm">Pilih Foto Profilmu:</label>
          <div className="flex justify-center gap-4 mb-4 text-xs font-bold uppercase tracking-tight">
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePhoto: false }))} className={`px-4 py-2 rounded-xl transition-all ${!formData.usePhoto ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}>Pilih Avatar</button>
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePhoto: true }))} className={`px-4 py-2 rounded-xl transition-all ${formData.usePhoto ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}>Upload Foto</button>
          </div>
          {!formData.usePhoto && (
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(avatars).map(([key, data]) => (
                <button key={key} type="button" onClick={() => handleAvatarSelect(key)} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${formData.avatar === key ? 'ring-4 ring-pink-400 bg-pink-50' : 'bg-white border border-gray-200'}`}>
                  <div className={`${data.color} w-10 h-10 flex items-center justify-center rounded-full mb-1 text-xl`}>{data.emoji}</div>
                  <span className="text-[10px] font-medium text-gray-500">{data.label}</span>
                </button>
              ))}
            </div>
          )}
          {formData.usePhoto && (
            <div className="text-center">
              {!formData.photoUrl ? (
                <div className="border-2 border-dashed border-pink-300 rounded-xl p-8 bg-pink-50 relative">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="flex flex-col items-center text-pink-500"><Upload size={32} /><span className="font-bold text-sm">Klik untuk Upload Foto</span></div>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img src={formData.photoUrl} alt="Preview" className="w-24 h-24 object-cover rounded-full border-4 border-pink-400 shadow-md" />
                  <button type="button" onClick={removePhoto} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-sm"><X size={16} /></button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-gray-700 font-bold mb-1 text-sm">Nama Lengkap</label><input required name="name" value={formData.name} onChange={handleInputChange} placeholder="Bilal Achyar" className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-pink-400 outline-none bg-gray-50 text-sm" /></div>
          <div><label className="block text-gray-700 font-bold mb-1 text-sm">Nama Panggilan</label><input name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder="Bilal" className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-pink-400 outline-none bg-gray-50 text-sm" /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-gray-700 font-bold mb-1 text-sm">Cita-cita</label><input name="dream" value={formData.dream} onChange={handleInputChange} placeholder="Astronaut" className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 outline-none bg-gray-50 text-xs" /></div>
          <div><label className="block text-gray-700 font-bold mb-1 text-sm">Hobi</label><input name="hobby" value={formData.hobby} onChange={handleInputChange} placeholder="Main Bola" className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 outline-none bg-gray-50 text-xs" /></div>
          <div><label className="block text-gray-700 font-bold mb-1 text-sm">Makanan</label><input name="food" value={formData.food} onChange={handleInputChange} placeholder="Nasi Goreng" className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 outline-none bg-gray-50 text-xs" /></div>
        </div>
        <div><label className="block text-gray-700 font-bold mb-1 text-sm">Pesan Untuk Teman</label><textarea required name="message" value={formData.message} onChange={handleInputChange} placeholder="Pesan untuk semua teman..." rows="3" className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 outline-none bg-gray-50 text-sm" /></div>
        <div className="flex gap-2">
          {isEditing && (<button type="button" onClick={handleCancelEdit} className="w-1/3 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2"><RotateCcw size={20} /> Batal</button>)}
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-pink-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 flex items-center justify-center gap-2">{isSubmitting ? 'Menyimpan...' : (isEditing ? 'Perbarui' : 'Simpan Biodata')}</button>
        </div>
      </form>
    </div>
  );
};

// ==========================================
// SUB-KOMPONEN 5: LESSONS
// ==========================================
const Lessons = ({ scheduleData }) => {
  return (
    <div className="animate-slide-up">
      <h2 className="text-2xl font-bold text-center text-orange-600 mb-6 bg-white p-3 rounded-xl shadow-sm border border-orange-100 flex items-center justify-center gap-2">
        <BookOpen size={24} /> Jadwal Pelajaran
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-8">
        {Object.entries(scheduleData).map(([day, subjects]) => (
          <div key={day} className="bg-white rounded-2xl shadow-md overflow-hidden border-2 border-indigo-100">
            <div className="bg-indigo-500 text-white p-3 text-center font-bold text-lg">{day}</div>
            <div className="p-4 space-y-3">
              {subjects.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-xl shadow-sm border border-indigo-100">{item.icon}</div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 text-sm">{item.subject}</div>
                    <div className="text-xs text-indigo-500 flex items-center gap-1 font-medium"><Clock size={10} /> {item.time} WIB</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// SUB-KOMPONEN 6: PIKET
// ==========================================
const Piket = ({ piketData }) => {
  return (
    <div className="animate-slide-up pb-8">
       <h2 className="text-2xl font-bold text-center text-green-600 mb-6 bg-white p-3 rounded-xl shadow-sm border border-green-100 flex items-center justify-center gap-2">
        <CheckSquare size={24} /> Petugas Kebersihan
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(piketData).map(([day, students]) => (
          <div key={day} className="bg-white rounded-2xl shadow-md overflow-hidden border-2 border-green-100">
            <div className="bg-green-500 text-white p-3 text-center font-bold text-lg">{day}</div>
            <div className="p-4">
              <ul className="space-y-2">
                {students.map((student, idx) => (
                  <li key={idx} className="flex items-center gap-2 bg-green-50 p-2 rounded-lg text-green-800 font-medium text-sm">
                     <div className="w-2 h-2 rounded-full bg-green-400"></div>
                     {student}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// KOMPONEN UTAMA: APP
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gallery');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user'); 
  const [accessCode, setAccessCode] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isMobileGrid, setIsMobileGrid] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', nickname: '', dream: '', hobby: '', food: '', message: '',
    avatar: 'super_boy', photoUrl: null, usePhoto: false
  });

  const TEACHER_DATA = {
    waliKelas: { name: "Ustazah Najwa", photoUrl: "https://raw.githubusercontent.com/deddhaz/library/refs/heads/main/ust1.jpeg", role: "Wali Kelas" },
    asisten: { name: "Ustazah Dea", photoUrl: "https://raw.githubusercontent.com/deddhaz/library/refs/heads/main/ust2.jpeg", role: "Asisten Wali Kelas" }
  };

  const SCHEDULE_DATA = {
    Senin: [{ time: '07:00', subject: 'Upacara', icon: '🇮🇩' }, { time: '08:15', subject: 'Matematika', icon: '📐' }],
    Selasa: [{ time: '07:30', subject: 'Olahraga', icon: '⚽' }, { time: '09:30', subject: 'B. Inggris', icon: '🅰️' }],
    Rabu: [{ time: '07:30', subject: 'B. Arab', icon: '🕌' }],
    Kamis: [{ time: '07:30', subject: 'Seni Budaya', icon: '🎨' }],
    Jumat: [{ time: '07:30', subject: 'Kultum', icon: '🤲' }]
  };

  const PIKET_DATA = {
    Senin: ['Ahmad', 'Budi'], Selasa: ['Fauzan', 'Lutfi'], Rabu: ['Rizki', 'Aisyah'], Kamis: ['Yusuf', 'Salma'], Jumat: ['Akbar', 'Tiara']
  };

  const avatars = {
    super_boy: { emoji: '🦸‍♂️', color: 'bg-blue-100', label: 'Boy' },
    super_girl: { emoji: '🦸‍♀️', color: 'bg-pink-100', label: 'Girl' },
    ninja: { emoji: '🥷', color: 'bg-gray-800 text-white', label: 'Ninja' },
    robot: { emoji: '🤖', color: 'bg-red-100', label: 'Robot' },
    spider: { emoji: '🕷️', color: 'bg-red-50', label: 'Spidey' },
    bat: { emoji: '🦇', color: 'bg-gray-200', label: 'Bat' },
    alien: { emoji: '👽', color: 'bg-green-100', label: 'Alien' },
    wizard: { emoji: '🧙‍♂️', color: 'bg-purple-100', label: 'Mage' },
  };

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Auth error:", err));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    const savedAuth = sessionStorage.getItem('school_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      setUserRole(sessionStorage.getItem('user_role') || 'user');
    }
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthenticated) return;
    const unsubscribeData = onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setFriends(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribeData();
  }, [user, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const code = accessCode.toLowerCase().trim();
    if (["ustazah", "ustadz", "guru"].includes(code)) { loginSuccess('admin'); } 
    else if (["inka", "sd insan karima", "6c"].includes(code)) { loginSuccess('user'); } 
    else { setLoginError(true); }
  };

  const loginSuccess = (role) => {
    setIsAuthenticated(true); setUserRole(role);
    sessionStorage.setItem('school_auth', 'true'); sessionStorage.setItem('user_role', role);
  };

  const handleLogout = () => {
    if (window.confirm("Keluar dari aplikasi?")) {
      setIsAuthenticated(false); sessionStorage.clear();
    }
  };

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAvatarSelect = (key) => setFormData(prev => ({ ...prev, avatar: key, usePhoto: false }));
  const handlePhotoUpload = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => setFormData(prev => ({ ...prev, photoUrl: ev.target.result, usePhoto: true }));
    reader.readAsDataURL(e.target.files[0]);
  };
  const removePhoto = () => setFormData(prev => ({ ...prev, photoUrl: null, usePhoto: false }));

  const handleEdit = (friend) => {
    setFormData({ ...friend, photoUrl: friend.photoUrl || null });
    setIsEditing(true); setCurrentEditId(friend.id); setActiveTab('form');
  };

  const handleCancelEdit = () => {
    setFormData({ name: '', nickname: '', dream: '', hobby: '', food: '', message: '', avatar: 'super_boy', photoUrl: null, usePhoto: false });
    setIsEditing(false); setCurrentEditId(null);
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.message) return alert("Isi data dulu!");
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false); setIsSubmitting(true);
    const docData = { ...formData, updatedAt: serverTimestamp() };
    try {
      if (isEditing) await updateDoc(doc(db, COLLECTION_NAME, currentEditId), docData);
      else await addDoc(collection(db, COLLECTION_NAME), { ...docData, loves: 0, createdAt: serverTimestamp(), creatorId: user.uid });
      handleCancelEdit(); setActiveTab('gallery');
    } catch (err) { alert("Gagal menyimpan!"); } finally { setIsSubmitting(false); }
  };

  const handleLove = async (id) => {
    const key = `loved_${id}`;
    if (localStorage.getItem(key)) return alert("Sudah ❤️!");
    await updateDoc(doc(db, COLLECTION_NAME, id), { loves: increment(1) });
    localStorage.setItem(key, 'true');
  };

  const handleDelete = async (id) => { if (window.confirm("Hapus data?")) await deleteDoc(doc(db, COLLECTION_NAME, id)); };

  if (!isAuthenticated) return (
    <div className="h-screen bg-sky-200 flex flex-col items-center justify-center p-4 text-center">
      <InstallPrompt />
      <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-sm border-8 border-orange-200">
        <div className="bg-orange-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg"><Lock className="text-white" size={32} /></div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Buku Kenangan 6C</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="Kode (inka)" className="w-full px-4 py-3 rounded-2xl border-2 text-center font-bold outline-none" />
          {loginError && <p className="text-red-500 text-xs font-bold animate-bounce">Kode salah!</p>}
          <button className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition">Masuk <ArrowRight size={20} /></button>
        </form>
      </div>
    </div>
  );

  if (loading) return <div className="h-screen bg-yellow-50 flex items-center justify-center text-orange-500 font-bold">Menyiapkan Kenangan...</div>;

  return (
    <div className="min-h-screen bg-yellow-50 pb-28 font-sans">
      <InstallPrompt />
      <BottomNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); if (tab !== 'form') handleCancelEdit(); }} />

      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white p-8 rounded-[30px] shadow-2xl max-w-sm w-full text-center border-4 border-pink-100">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Simpan Data?</h3>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 border-2 rounded-2xl font-bold text-gray-400">Cek Lagi</button>
              <button onClick={handleConfirmSave} className="flex-1 py-3 bg-pink-500 text-white rounded-2xl font-bold">Simpan!</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-orange-400 text-white p-6 rounded-b-[40px] shadow-xl text-center mb-8 relative overflow-hidden">
        <button onClick={handleLogout} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/40 transition"><LogOut size={20}/></button>
        <h1 className="text-3xl md:text-5xl font-black mb-1 drop-shadow-lg">🏹 Khalid Bin Walid 🏹</h1>
        <p className="text-orange-100 font-bold mb-6 italic">Buku Kenangan Kelas 6C Insan Karima</p>
        <div className="flex justify-center gap-8">
          {Object.values(TEACHER_DATA).map((t, i) => (
            <div key={i} className="flex flex-col items-center">
              <img src={t.photoUrl} alt={t.name} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white mb-2 shadow-lg object-cover bg-white" />
              <span className="text-xs font-black">{t.name}</span>
              <span className="text-[10px] bg-white/20 px-2 rounded-full">{t.role}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        {activeTab === 'gallery' && <Gallery friends={friends} isMobileGrid={isMobileGrid} setIsMobileGrid={setIsMobileGrid} handleLove={handleLove} handleEdit={handleEdit} handleDelete={handleDelete} user={user} userRole={userRole} getAvatar={(k) => avatars[k]} setActiveTab={setActiveTab} />}
        {activeTab === 'form' && <BioForm isEditing={isEditing} handleCancelEdit={handleCancelEdit} handlePreSubmit={handlePreSubmit} formData={formData} setFormData={setFormData} handleInputChange={handleInputChange} handleAvatarSelect={handleAvatarSelect} handlePhotoUpload={handlePhotoUpload} removePhoto={removePhoto} isSubmitting={isSubmitting} avatars={avatars} />}
        {activeTab === 'lessons' && <Lessons scheduleData={SCHEDULE_DATA} />}
        {activeTab === 'piket' && <Piket piketData={PIKET_DATA} />}
      </main>

      <footer className="text-center mt-12 text-gray-400 text-[10px] pb-10 uppercase tracking-widest">© 2026 Kelas 6C SDI Insan Karima</footer>
    </div>
  );
}
