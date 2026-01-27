import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
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
  User, Star, Heart, Smile, Trash2, Plus, BookOpen, Gamepad2, 
  Utensils, Rocket, Palette, Music, Camera, Upload, X, 
  Lock, Key, School, ArrowRight, CheckCircle, AlertCircle, 
  LayoutGrid, List, Pencil, RotateCcw, LogOut, HeartHandshake,
  MessageSquareQuote, Languages, Sparkles
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyBC-15YvoHfx8CxsP9ddmMSWfw0aGeJRak",
  authDomain: "a-inka.firebaseapp.com",
  projectId: "a-inka",
  storageBucket: "a-inka.firebasestorage.app",
  messagingSenderId: "554090824336",
  appId: "1:554090824336:web:18902f6b1264965f808e15"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'kelas3_biodata_app';
const COLLECTION_NAME = 'kelas3_biodata';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] bg-white rounded-2xl shadow-2xl p-4 border-2 border-orange-400 animate-bounce md:max-w-xs md:left-auto md:right-10">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-xl text-orange-600"><School size={24} /></div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">Simpan ke Layar Utama?</p>
          <p className="text-xs text-gray-500">Buka aplikasi lebih cepat!</p>
        </div>
        <button onClick={handleInstallClick} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md">Install</button>
        <button onClick={() => setIsVisible(false)} className="text-gray-400"><X size={18} /></button>
      </div>
    </div>
  );
};

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
  const [thanksMessage, setThanksMessage] = useState({ show: false, name: '' });
  const [starMessage, setStarMessage] = useState({ show: false, name: '' });
  
  const TEACHER_DATA = {
    waliKelas: {
      name: "Ustazah Najwa",
      photoUrl: "https://raw.githubusercontent.com/deddhaz/library/refs/heads/main/ust1.jpeg", 
      role: "Wali Kelas"
    },
    asisten: {
      name: "Ustazah Dea",
      photoUrl: "https://raw.githubusercontent.com/deddhaz/library/refs/heads/main/ust2.jpeg", 
      role: "Asisten Wali Kelas"
    }
  };

  const [formData, setFormData] = useState({
    name: '', nickname: '', dream: '', hobby: '', food: '', message: '',
    avatar: 'super_boy', photoUrl: null, usePhoto: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    const sessionAuth = sessionStorage.getItem('school_auth');
    const sessionRole = sessionStorage.getItem('user_role');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
      if (sessionRole) setUserRole(sessionRole);
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthenticated) {
      if (!isAuthenticated) setLoading(false);
      return;
    }

    setLoading(true);
    const dataRef = collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME);
    
    const unsubscribeData = onSnapshot(dataRef, 
      (snapshot) => {
        const fetchedFriends = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        fetchedFriends.sort((a, b) => {
          const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
          const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setFriends(fetchedFriends);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeData();
  }, [user, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const input = accessCode.toLowerCase().trim();
    const userCodes = ["insan karima", "inka", "sd insan karima", "3a"];
    const adminCodes = ["ustazah", "ustadzah", "ustadz", "ustad"]; 

    if (adminCodes.includes(input)) {
      setIsAuthenticated(true);
      setUserRole('admin'); 
      setLoginError(false);
      sessionStorage.setItem('school_auth', 'true');
      sessionStorage.setItem('user_role', 'admin');
    } else if (userCodes.includes(input)) {
      setIsAuthenticated(true);
      setUserRole('user'); 
      setLoginError(false);
      sessionStorage.setItem('school_auth', 'true');
      sessionStorage.setItem('user_role', 'user');
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('user');
    setAccessCode('');
    sessionStorage.removeItem('school_auth');
    sessionStorage.removeItem('user_role');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Wah, fotonya terlalu besar! Cari yang lebih kecil ya.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (re) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 400; 
        let width = img.width, height = img.height;
        if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } } 
        else { if (height > MAX) { width *= MAX / height; height = MAX; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        setFormData(prev => ({ ...prev, photoUrl: canvas.toDataURL('image/jpeg', 0.7), usePhoto: true }));
      };
      img.src = re.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleStar = async (friend) => {
    if (!user) return;
    const storageKey = `starred_${friend.id}`;
    const isAlreadyStarred = localStorage.getItem(storageKey);

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, friend.id);
      if (isAlreadyStarred) {
        await updateDoc(docRef, { stars: increment(-1) });
        localStorage.removeItem(storageKey);
      } else {
        await updateDoc(docRef, { stars: increment(1) });
        localStorage.setItem(storageKey, 'true');
        setStarMessage({ show: true, name: friend.nickname || friend.name });
        setTimeout(() => setStarMessage({ show: false, name: '' }), 2500);
      }
    } catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  const handleThankYou = async (friend) => {
    if (!user) return;
    const storageKey = `thanked_${friend.id}`;
    const isAlreadyThanked = localStorage.getItem(storageKey);

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, friend.id);
      if (isAlreadyThanked) {
        await updateDoc(docRef, { thanks: increment(-1) });
        localStorage.removeItem(storageKey);
      } else {
        await updateDoc(docRef, { thanks: increment(1) });
        localStorage.setItem(storageKey, 'true');
        setThanksMessage({ show: true, name: friend.nickname || friend.name });
        setTimeout(() => setThanksMessage({ show: false, name: '' }), 2500);
      }
    } catch (error) {
      console.error("Error toggling thanks:", error);
    }
  };

  const handleConfirmSave = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const dataToSave = {
      ...formData,
      updatedAt: serverTimestamp(),
    };

    try {
      if (isEditing && currentEditId) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, currentEditId);
        await updateDoc(docRef, dataToSave);
      } else {
        const dataRef = collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME);
        await addDoc(dataRef, {
          ...dataToSave,
          stars: 0, thanks: 0,
          createdAt: serverTimestamp(),
          creatorId: user.uid
        });
      }
      setFormData({ name: '', nickname: '', dream: '', hobby: '', food: '', message: '', avatar: 'super_boy', photoUrl: null, usePhoto: false });
      setIsEditing(false);
      setCurrentEditId(null);
      setActiveTab('gallery');
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Gagal menyimpan.");
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!user || userRole !== 'admin') return;
    if (confirm("Yakin ingin menghapus data ini?")) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, docId));
      } catch (error) { console.error("Error deleting:", error); }
    }
  };

  const avatars = {
    super_boy: { emoji: '🦸‍♂️', color: 'bg-blue-100', label: 'Super Boy' },
    super_girl: { emoji: '🦸‍♀️', color: 'bg-pink-100', label: 'Super Girl' },
    ninja: { emoji: '🥷', color: 'bg-gray-800 text-white', label: 'Ninja' },
    robot: { emoji: '🤖', color: 'bg-red-100', label: 'Cyborg' },
    spider: { emoji: '🕷️', color: 'bg-red-50', label: 'Spidey' },
    bat: { emoji: '🦇', color: 'bg-gray-200', label: 'Bat Hero' },
    alien: { emoji: '👽', color: 'bg-green-100', label: 'Alien' },
    wizard: { emoji: '🧙‍♂️', color: 'bg-purple-100', label: 'Penyihir' },
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-sky-200 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <InstallPrompt />
        <div className="bg-white rounded-[30px] shadow-2xl p-6 md:p-8 max-sm:w-full max-w-sm w-full relative z-10 border-4 md:border-8 border-orange-200">
          <div className="flex flex-col items-center">
            <div className="relative mb-6 mt-2 transform scale-90 md:scale-100">
              <div className="flex gap-2 h-24 md:h-32 items-end mb-2">
                 {[1,2,3,4,5].map(i => <div key={i} className={`w-3 ${i % 2 === 0 ? 'h-20 md:h-28' : 'h-24 md:h-32'} bg-gray-300 rounded-t-full`}></div>)}
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-400 p-3 md:p-4 rounded-full border-4 border-white shadow-lg">
                <Lock size={32} className="text-white" />
              </div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md whitespace-nowrap">SD Insan Karima</div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-700 mb-2">Gerbang Terkunci!</h2>
            <form onSubmit={handleLogin} className="w-full">
              <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Kode Kelas..." className={`w-full px-4 py-3 rounded-xl border-2 ${loginError ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:border-blue-400 text-center tracking-widest mb-4 transition-all`} />
              <button type="submit" className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base">
                Buka Gerbang <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="flex flex-col items-center animate-pulse">
          <div className="w-16 h-16 border-8 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
          <div className="text-xl font-bold text-orange-500">Membuka Buku Biodata...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 font-sans pb-10 relative">
      <InstallPrompt />

      {thanksMessage.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 max-w-sm w-full text-center border-4 border-green-200 relative overflow-hidden animate-scale-up">
            <div className="relative mx-auto bg-green-50 w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-inner">
               <div className="animate-shake-hand"><HeartHandshake size={64} className="text-green-500 md:w-20 md:h-20" /></div>
               <Heart className="absolute -top-2 right-4 text-pink-400 fill-current animate-ping opacity-75" size={24} />
               <Heart className="absolute bottom-2 -left-2 text-red-400 fill-current animate-pulse" size={20} />
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2">Terima Kasih!</h3>
            <p className="text-gray-500 md:text-lg leading-relaxed">Kamu sudah bilang terima kasih ke <br/><span className="text-green-600 font-bold text-xl md:text-2xl">"{thanksMessage.name}"</span></p>
          </div>
        </div>
      )}

      {starMessage.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 max-w-sm w-full text-center border-4 border-yellow-300 relative overflow-hidden animate-scale-up">
            <div className="relative mx-auto bg-yellow-50 w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-inner">
               <div className="animate-spin-slow">
                 <Star size={64} className="text-yellow-500 fill-current md:w-20 md:h-20" />
               </div>
               <Sparkles className="absolute -top-2 right-4 text-orange-400 animate-pulse" size={32} />
               <Sparkles className="absolute bottom-2 -left-2 text-yellow-300 animate-bounce" size={24} />
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2">Bintang Terkirim!</h3>
            <p className="text-gray-500 md:text-lg leading-relaxed">Kamu memberikan Bintang untuk <br/><span className="text-yellow-600 font-bold text-xl md:text-2xl">"{starMessage.name}"</span></p>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-sm:w-full max-w-sm w-full text-center border-4 border-pink-200">
            <CheckCircle size={40} className="text-pink-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Sudah Yakin?</h3>
            <p className="text-gray-500 mb-6">Pastikan datanya sudah benar ya.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowConfirmModal(false)} className="px-6 py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-400 transition">Cek Lagi</button>
              <button onClick={handleConfirmSave} className="px-6 py-2 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 shadow-lg transform active:scale-95 transition">Ya, Simpan!</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-orange-400 text-white p-6 shadow-lg rounded-b-[40px] mb-8 relative text-center">
        <button onClick={handleLogout} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full"><LogOut size={20} /></button>
        <h1 className="text-2xl md:text-5xl font-extrabold mb-1 drop-shadow-md">🏹 Khalid Bin Walid 🏹</h1>
        <p className="text-orange-100 text-sm font-bold uppercase tracking-widest mb-4">Kelas 3A Insan Karima</p>
        <div className="flex justify-center gap-8">
           {Object.values(TEACHER_DATA).map(t => (
             <div key={t.name} className="flex flex-col items-center">
               <img src={t.photoUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-md object-cover mb-2" alt={t.name} />
               <span className="font-bold text-xs md:text-sm">{t.name}</span>
             </div>
           ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center mb-8 gap-4">
          <button onClick={() => { setActiveTab('gallery'); setIsEditing(false); }} className={`px-6 py-3 rounded-full font-bold shadow-md transition-all ${activeTab === 'gallery' ? 'bg-blue-500 text-white ring-4 ring-blue-100' : 'bg-white text-blue-500'}`}><BookOpen size={18} className="inline mr-2" /> Lihat Teman</button>
          <button onClick={() => { setActiveTab('form'); setIsEditing(false); }} className={`px-6 py-3 rounded-full font-bold shadow-md transition-all ${activeTab === 'form' ? 'bg-pink-500 text-white ring-4 ring-pink-100' : 'bg-white text-pink-500'}`}><Plus size={18} className="inline mr-2" /> Isi Biodata</button>
        </div>

        {activeTab === 'form' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 max-w-2xl mx-auto border-2 border-pink-100">
            <h2 className="text-xl md:text-2xl font-bold text-pink-600 mb-6 text-center">{isEditing ? '✏️ Update Biodatamu' : '✏️ Isi Biodatamu Yuk!'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }} className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 text-center">
                <label className="block text-gray-700 font-bold mb-3">Pilih Foto Profil:</label>
                <div className="flex justify-center gap-3 mb-4">
                  <button type="button" onClick={() => setFormData(p => ({ ...p, usePhoto: false }))} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!formData.usePhoto ? 'bg-pink-500 text-white' : 'bg-white border text-gray-400'}`}>Avatar</button>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, usePhoto: true }))} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.usePhoto ? 'bg-pink-500 text-white' : 'bg-white border text-gray-400'}`}>Upload Foto</button>
                </div>
                {!formData.usePhoto ? (
                  <div className="grid grid-cols-4 gap-3">
                    {Object.entries(avatars).map(([key, data]) => (
                      <button key={key} type="button" onClick={() => setFormData(p => ({ ...p, avatar: key }))} className={`p-2 rounded-xl border-4 transition-all ${formData.avatar === key ? 'border-pink-400 bg-pink-50 scale-105' : 'border-transparent bg-white shadow-sm'}`}>
                        <div className={`${data.color} w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full mx-auto text-xl mb-1`}>{data.emoji}</div>
                        <span className="hidden md:block text-[10px] text-gray-400 font-bold">{data.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="relative inline-block">
                    {formData.photoUrl ? (
                      <div className="relative"><img src={formData.photoUrl} className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-full border-4 border-pink-400 shadow-lg" /><button type="button" onClick={() => setFormData(p => ({ ...p, photoUrl: null }))} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full"><X size={14} /></button></div>
                    ) : (
                      <div className="border-2 border-dashed border-pink-200 rounded-2xl p-8 bg-pink-50 cursor-pointer relative"><input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Upload size={32} className="text-pink-500 mx-auto" />
                        <p className="text-pink-500 font-bold text-xs mt-1">Upload Foto</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="Nama Lengkap" className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-pink-400" />
                <input name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder="Nama Panggilan" className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-pink-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="dream" value={formData.dream} onChange={handleInputChange} placeholder="Cita-cita" className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 outline-none focus:border-blue-300" />
                <input name="hobby" value={formData.hobby} onChange={handleInputChange} placeholder="Hobi" className="w-full px-4 py-3 rounded-xl border-2 border-green-100 outline-none focus:border-green-300" />
                <input name="food" value={formData.food} onChange={handleInputChange} placeholder="Makanan Favorit" className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 outline-none focus:border-orange-400" />
              </div>
              
              <div className="space-y-2">
                <label className="block text-gray-700 font-bold">Pesan Untuk Teman:</label>
                <textarea required name="message" value={formData.message} onChange={handleInputChange} placeholder="Pesan untuk teman-teman..." rows="3" className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 outline-none focus:border-purple-400" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-pink-500 text-white font-bold py-4 rounded-2xl shadow-xl transition-all hover:bg-pink-600 active:scale-95">{isSubmitting ? 'Menyimpan...' : 'Simpan Biodata'}</button>
            </form>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-700 flex items-center gap-2 uppercase tracking-widest"><List className="text-blue-500" /> Galeri Teman 3A</h3>
              <button 
                onClick={() => setIsMobileGrid(!isMobileGrid)} 
                className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm text-sm font-bold text-blue-500 border-2 border-blue-100"
              >
                {isMobileGrid ? <List size={18} /> : <LayoutGrid size={18} />}
                {isMobileGrid ? 'List' : 'Grid'}
              </button>
            </div>
            
            <div className={`grid ${isMobileGrid ? 'grid-cols-2 gap-3' : 'grid-cols-1 gap-4'} md:grid-cols-2 lg:grid-cols-3 md:gap-6`}>
              {friends.map(friend => {
                const av = avatars[friend.avatar] || avatars.super_boy;
                const pic = friend.usePhoto && friend.photoUrl;
                const isS = localStorage.getItem(`starred_${friend.id}`);
                const isT = localStorage.getItem(`thanked_${friend.id}`);
                const owner = user && user.uid === friend.creatorId;

                return (
                  <div key={friend.id} className={`bg-white shadow-lg overflow-hidden border-b-8 border-blue-200 flex flex-col hover:border-blue-400 transition-all ${isMobileGrid ? 'rounded-2xl' : 'rounded-[40px]'}`}>
                    {/* Header kartu dengan ukuran kondisional untuk mode grid */}
                    <div className={`${isMobileGrid ? 'h-20' : 'h-24'} md:h-32 ${pic ? 'bg-gray-100' : av.color.split(' ')[0]} relative flex justify-center items-end`}>
                      {/* Container foto profil dengan ukuran diperkecil 50% di mode grid */}
                      <div className={`bg-white p-1 rounded-full shadow-md ring-4 ring-white z-10 overflow-hidden flex items-center justify-center ${isMobileGrid ? 'w-12 h-12 -mb-6' : 'w-16 h-16 -mb-8'} md:w-28 md:h-28 md:-mb-12 transition-all`}>
                         {pic ? <img src={friend.photoUrl} className="w-full h-full object-cover rounded-full" /> : <div className={`${av.color} w-full h-full rounded-full flex items-center justify-center text-xl ${isMobileGrid ? 'text-xl' : 'text-3xl'} md:text-5xl`}>{av.emoji}</div>}
                      </div>
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        <button onClick={() => handleStar(friend)} className={`p-1.5 rounded-full shadow-md transition flex items-center gap-1 ${isS ? 'bg-yellow-400 text-white scale-110' : 'bg-white/90 text-gray-400 hover:text-yellow-500'}`}><Star size={12} className={isS ? 'fill-current' : ''} /><span className="text-[9px] font-bold">{friend.stars || 0}</span></button>
                        <button onClick={() => handleThankYou(friend)} className={`p-1.5 rounded-full shadow-md transition flex items-center gap-1 ${isT ? 'bg-green-500 text-white scale-110' : 'bg-white/90 text-gray-400 hover:text-green-500'}`}><HeartHandshake size={12} /><span className="text-[9px] font-bold">{friend.thanks || 0}</span></button>
                      </div>
                      <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                         {(owner || userRole === 'admin') && <button onClick={() => { setFormData(friend); setIsEditing(true); setCurrentEditId(friend.id); setActiveTab('form'); }} className="bg-white/90 p-1.5 rounded-full text-blue-500 shadow hover:bg-blue-500 hover:text-white transition"><Pencil size={14} /></button>}
                         {userRole === 'admin' && <button onClick={() => handleDelete(friend.id)} className="bg-white/90 p-1.5 rounded-full text-red-500 shadow hover:bg-red-500 hover:text-white transition"><Trash2 size={14} /></button>}
                      </div>
                    </div>
                    
                    {/* Bagian Body Kartu dengan padding kondisional */}
                    <div className={`${isMobileGrid ? 'pt-8 pb-5' : 'pt-12 pb-6'} md:pt-16 px-4 text-center flex-1 flex flex-col items-center justify-center transition-all`}>
                       {isMobileGrid ? (
                         /* TAMPILAN GRID: Ringkas & Cantik */
                         <div className="flex flex-col items-center w-full space-y-2">
                           <h4 className="text-sm md:text-xl font-bold text-gray-800 truncate w-full px-2">
                             {friend.nickname || friend.name}
                           </h4>
                           <div className="flex justify-center gap-3">
                              <Rocket size={16} className={friend.dream ? "text-blue-400" : "text-gray-200"} />
                              <Gamepad2 size={16} className={friend.hobby ? "text-green-400" : "text-gray-200"} />
                              <Utensils size={16} className={friend.food ? "text-orange-400" : "text-gray-200"} />
                           </div>
                         </div>
                       ) : (
                         /* TAMPILAN LIST: Full Detail */
                         <>
                           <h4 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">{friend.name}</h4>
                           <p className="text-blue-500 font-bold text-xs uppercase mb-4 tracking-widest">"{friend.nickname || friend.name}"</p>
                           <div className="space-y-1.5 text-left bg-gray-50 p-4 rounded-3xl text-xs md:text-sm mb-4 w-full">
                              <p><Rocket size={14} className="inline mr-2 text-blue-400" /> <b>Cita:</b> {friend.dream || '-'}</p>
                              <p><Gamepad2 size={14} className="inline mr-2 text-green-400" /> <b>Hobi:</b> {friend.hobby || '-'}</p>
                              <p><Utensils size={14} className="inline mr-2 text-orange-400" /> <b>Makan:</b> {friend.food || '-'}</p>
                           </div>
                           
                           <div className="mt-auto relative w-full mb-3">
                             <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200 z-10 whitespace-nowrap">Pesan Untuk Teman</div>
                             <div className="border-2 border-dashed border-yellow-200 rounded-2xl p-4 bg-yellow-50 text-gray-600 italic text-xs md:text-sm pt-4 leading-relaxed">"{friend.message}"</div>
                           </div>
                           
                           <button onClick={() => handleThankYou(friend)} className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-all border ${isT ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 border-green-200'}`}><MessageSquareQuote size={14} /> {isT ? 'Sudah Bilang Terima Kasih!' : 'Bilang Terima Kasih!'}</button>
                         </>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center mt-12 mb-8 opacity-50 text-[10px] md:text-xs tracking-widest uppercase">© 2026 Khalid Bin Walid 3A - SD Insan Karima</footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes shake-hand { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-shake-hand { animation: shake-hand 0.6s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        body { -webkit-tap-highlight-color: transparent; }
      `}} />
    </div>
  );
}
