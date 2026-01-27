import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
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
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// RULE 1: Menggunakan appId dinamis dari environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kelas3-biodata-app';
const COLLECTION_NAME = 'kelas3_biodata';

// --- KOMPONEN INTERNAL PWA ---
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    });

    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
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
        <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
          <School size={24} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">Simpan ke Layar Utama?</p>
          <p className="text-xs text-gray-500">Buka aplikasi lebih cepat!</p>
        </div>
        <button 
          onClick={handleInstallClick}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-600 shadow-md transition"
        >
          Install
        </button>
        <button onClick={() => setIsVisible(false)} className="text-gray-400">
          <X size={18} />
        </button>
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
    // RULE 3: Melakukan Auth terlebih dahulu
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
    if (!user || !isAuthenticated) return;

    // RULE 1: Menggunakan path yang ketat untuk Firestore
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

  const handleAvatarSelect = (avatarKey) => {
    setFormData(prev => ({ ...prev, avatar: avatarKey, usePhoto: false }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Fotonya terlalu besar! Pilih yang di bawah 5MB ya.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; 
        const MAX_HEIGHT = 400; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setFormData(prev => ({ ...prev, photoUrl: dataUrl, usePhoto: true }));
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photoUrl: null, usePhoto: false, avatar: 'super_boy' }));
  };

  const handleEdit = (friend) => {
    setFormData({
      name: friend.name,
      nickname: friend.nickname,
      dream: friend.dream,
      hobby: friend.hobby,
      food: friend.food,
      message: friend.message,
      avatar: friend.avatar,
      photoUrl: friend.photoUrl || null,
      usePhoto: friend.usePhoto || false
    });
    setIsEditing(true);
    setCurrentEditId(friend.id);
    setActiveTab('form');
  };

  const handleCancelEdit = () => {
    setFormData({
      name: '', nickname: '', dream: '', hobby: '', food: '', message: '',
      avatar: 'super_boy', photoUrl: null, usePhoto: false
    });
    setIsEditing(false);
    setCurrentEditId(null);
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
        // Tampilkan pop-up animasi bintang
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

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      alert("Isi nama dan pesan dulu ya!");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (!user) return;
    setShowConfirmModal(false);
    setIsSubmitting(true);
    
    const baseData = {
      name: formData.name,
      nickname: formData.nickname,
      dream: formData.dream,
      hobby: formData.hobby,
      food: formData.food,
      message: formData.message,
      avatar: formData.avatar,
      photoUrl: formData.usePhoto ? formData.photoUrl : null, 
      usePhoto: formData.usePhoto,
    };

    try {
      if (isEditing && currentEditId) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, currentEditId);
        await updateDoc(docRef, {
          ...baseData,
          updatedAt: serverTimestamp()
        });
      } else {
        const dataRef = collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME);
        await addDoc(dataRef, {
          ...baseData,
          stars: 0, 
          thanks: 0,
          createdAt: serverTimestamp(),
          creatorId: user.uid
        });
      }
      handleCancelEdit();
      setActiveTab('gallery');
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Gagal menyimpan. Coba lagi ya!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!user) return;
    if (confirm("Yakin ingin menghapus data ini?")) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, docId);
        await deleteDoc(docRef);
      } catch (error) {
        console.error("Error deleting:", error);
      }
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

  const getAvatar = (key) => avatars[key] || avatars['super_boy'];

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-sky-200 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <InstallPrompt />
        <div className="bg-white rounded-[30px] shadow-2xl p-6 md:p-8 max-w-sm w-full relative z-10 border-4 md:border-8 border-orange-200">
          <div className="flex flex-col items-center">
            <div className="relative mb-6 mt-2 transform scale-90 md:scale-100">
              <div className="flex gap-2 h-24 md:h-32 items-end mb-2">
                 {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`w-3 ${i % 2 === 0 ? 'h-20 md:h-28' : 'h-24 md:h-32'} bg-gray-300 rounded-t-full`}></div>
                 ))}
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-400 p-3 md:p-4 rounded-full border-4 border-white shadow-lg">
                <Lock size={32} className="text-white md:w-10 md:h-10" />
              </div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs md:text-sm font-bold shadow whitespace-nowrap flex items-center gap-2">
                <School size={14} /> SD Insan Karima
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-700 mb-2 text-center">Gerbang Terkunci!</h2>
            <p className="text-sm md:text-base text-gray-500 text-center mb-4 md:mb-6">Masukkan kode kelas untuk masuk.</p>
            <form onSubmit={handleLogin} className="w-full">
              <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Kode Kelas..."
                className={`w-full px-4 py-3 rounded-xl border-2 ${loginError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:outline-none focus:border-blue-400 transition-colors text-base text-center tracking-widest mb-4`}
              />
              <button type="submit" className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2">
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
          <div className="text-xl md:text-2xl font-bold text-orange-500">Membuka Buku Biodata...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 font-sans pb-10 relative">
      <InstallPrompt />

      {/* Pop-up Terima Kasih Elegan */}
      {thanksMessage.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 max-w-sm w-full text-center border-4 border-green-200 relative overflow-hidden animate-scale-up">
            <div className="relative mx-auto bg-green-50 w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-inner">
               <div className="animate-shake-hand text-green-500">
                  <HeartHandshake size={64} className="md:w-20 md:h-20" />
               </div>
               <Heart className="absolute -top-2 right-4 text-pink-400 fill-current animate-ping opacity-75" size={24} />
               <Heart className="absolute bottom-2 -left-2 text-red-400 fill-current animate-pulse" size={20} />
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2">Terima Kasih!</h3>
            <p className="text-gray-500 md:text-lg leading-relaxed">
              Kamu sudah bilang terima kasih ke <br/>
              <span className="text-green-600 font-bold text-xl md:text-2xl">"{thanksMessage.name}"</span>
            </p>
            <div className="mt-6 flex justify-center">
               <div className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                  <CheckCircle size={14} /> Kebaikan Terkirim
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Bintang Elegan */}
      {starMessage.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 max-w-sm w-full text-center border-4 border-yellow-200 relative overflow-hidden animate-scale-up">
            <div className="relative mx-auto bg-yellow-50 w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-inner">
               <div className="animate-spin-slow text-yellow-500">
                  <Star size={64} className="md:w-20 md:h-20 fill-current" />
               </div>
               <Sparkles className="absolute -top-2 right-4 text-orange-400 animate-pulse" size={32} />
               <Sparkles className="absolute bottom-2 -left-2 text-yellow-400 animate-bounce" size={24} />
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2">Bintang Terkirim!</h3>
            <p className="text-gray-500 md:text-lg leading-relaxed">
              Kamu memberikan bintang untuk <br/>
              <span className="text-yellow-600 font-bold text-xl md:text-2xl">"{starMessage.name}"</span>
            </p>
            <div className="mt-6 flex justify-center">
               <div className="bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                  <Star size={14} className="fill-current" /> Apresiasi Berkilau
               </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm w-full text-center border-4 border-pink-200">
            <div className="mx-auto bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={40} className="text-pink-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Sudah Yakin?</h3>
            <p className="text-gray-500 mb-6">Pastikan data yang kamu isi sudah benar ya.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowConfirmModal(false)} className="px-6 py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition">Batal</button>
              <button onClick={handleConfirmSave} className="px-6 py-2 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 shadow-lg">Ya, Simpan!</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-orange-400 text-white p-4 md:p-6 shadow-lg rounded-b-[30px] md:rounded-b-[40px] mb-6 md:mb-8 relative overflow-hidden">
        <button onClick={handleLogout} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition z-50 backdrop-blur-sm">
          <LogOut size={20} />
        </button>
        <div className="max-w-7xl mx-auto text-center relative z-10 pt-2">
          <h1 className="text-2xl md:text-5xl font-extrabold mb-1 md:mb-2 drop-shadow-md">🏹 Khalid Bin Walid 🏹</h1>
          <p className="text-orange-100 text-sm md:text-lg mb-2 uppercase tracking-widest">Kelas 3A Insan Karima</p>
          <div className="flex justify-center gap-6 md:gap-12 mt-2">
             <div className="flex flex-col items-center">
               <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden">
                 <img src={TEACHER_DATA.waliKelas.photoUrl} alt="Wali Kelas" className="w-full h-full object-cover" />
               </div>
               <span className="font-bold text-sm md:text-base mt-2">{TEACHER_DATA.waliKelas.name}</span>
             </div>
             <div className="flex flex-col items-center">
               <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden">
                 <img src={TEACHER_DATA.asisten.photoUrl} alt="Asisten" className="w-full h-full object-cover" />
               </div>
               <span className="font-bold text-sm md:text-base mt-2">{TEACHER_DATA.asisten.name}</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 md:px-4">
        <div className="flex justify-center mb-6 md:mb-8 gap-2 md:gap-4">
          <button onClick={() => { setActiveTab('gallery'); handleCancelEdit(); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm md:text-lg shadow-md transition-all ${
              activeTab === 'gallery' ? 'bg-blue-500 text-white ring-4 ring-blue-200' : 'bg-white text-blue-500'
            }`}>
            <BookOpen size={18} /> Lihat Teman
          </button>
          <button onClick={() => { setActiveTab('form'); handleCancelEdit(); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm md:text-lg shadow-md transition-all ${
              activeTab === 'form' ? 'bg-pink-500 text-white ring-4 ring-pink-200' : 'bg-white text-pink-500'
            }`}>
            <Plus size={18} /> Isi Biodata
          </button>
        </div>

        {activeTab === 'form' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 max-w-2xl mx-auto border-2 border-pink-200">
            <h2 className="text-xl md:text-2xl font-bold text-pink-600 mb-6 text-center">
              {isEditing ? '✏️ Update Biodatamu' : '✏️ Isi Biodatamu Yuk!'}
            </h2>
            <form onSubmit={handlePreSubmit} className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 text-center">
                <label className="block text-gray-700 font-bold mb-3">Foto Profil:</label>
                <div className="flex justify-center gap-4 mb-4">
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePhoto: false }))}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${!formData.usePhoto ? 'bg-pink-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>Avatar</button>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePhoto: true }))}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${formData.usePhoto ? 'bg-pink-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>Upload</button>
                </div>
                {!formData.usePhoto ? (
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(avatars).map(([key, data]) => (
                      <button key={key} type="button" onClick={() => handleAvatarSelect(key)}
                        className={`p-2 rounded-xl border-2 transition-all ${formData.avatar === key ? 'border-pink-400 bg-pink-50 scale-105' : 'border-gray-100 bg-white'}`}>
                        <div className={`${data.color} w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full mx-auto mb-1 text-xl`}>{data.emoji}</div>
                        <span className="text-[10px] text-gray-500">{data.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="relative inline-block group">
                    {formData.photoUrl ? (
                      <div className="relative">
                        <img src={formData.photoUrl} alt="Preview" className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-full border-4 border-pink-400" />
                        <button type="button" onClick={removePhoto} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-pink-300 rounded-xl p-8 bg-pink-50 cursor-pointer relative">
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Upload size={32} className="text-pink-500 mx-auto mb-2" />
                        <span className="text-pink-500 font-bold text-sm">Klik untuk Upload</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="Nama Lengkap" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 outline-none" />
                <input name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder="Nama Panggilan" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="dream" value={formData.dream} onChange={handleInputChange} placeholder="Cita-cita" className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-400 outline-none" />
                <input name="hobby" value={formData.hobby} onChange={handleInputChange} placeholder="Hobi" className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-400 outline-none" />
                <input name="food" value={formData.food} onChange={handleInputChange} placeholder="Makanan Favorit" className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 outline-none" />
              </div>
              <textarea required name="message" value={formData.message} onChange={handleInputChange} placeholder="Pesan untuk semua teman..." rows="3" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none" />
              <div className="flex gap-2">
                {isEditing && <button type="button" onClick={handleCancelEdit} className="w-1/3 bg-gray-200 font-bold py-3 rounded-xl">Batal</button>}
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-pink-500 text-white font-bold py-3 rounded-xl shadow-lg">
                  {isSubmitting ? 'Menyimpan...' : (isEditing ? 'Update Biodata' : 'Simpan Biodata')}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-6">
            {friends.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl shadow-lg border-2 border-dashed border-gray-300 mx-auto max-w-md">
                <div className="text-4xl mb-4">😢</div>
                <h3 className="text-lg font-bold text-gray-500">Belum ada teman. Yuk isi biodata!</h3>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg md:text-2xl font-bold text-gray-700 uppercase tracking-widest"><List className="inline-block text-blue-500 mr-2" /> Daftar Teman</h3>
                   <button onClick={() => setIsMobileGrid(!isMobileGrid)} className="md:hidden bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm">
                      {isMobileGrid ? <List size={16} /> : <LayoutGrid size={16} />}
                   </button>
                </div>
                
                <div className={`grid ${isMobileGrid ? 'grid-cols-2 gap-3' : 'grid-cols-1 gap-4'} md:grid-cols-2 lg:grid-cols-3 md:gap-6`}>
                  {friends.map((friend) => {
                    const avatarData = getAvatar(friend.avatar);
                    const hasPhoto = friend.usePhoto && friend.photoUrl;
                    const isStarred = localStorage.getItem(`starred_${friend.id}`);
                    const isThanked = localStorage.getItem(`thanked_${friend.id}`);
                    const canEdit = userRole === 'admin' || (user && user.uid === friend.creatorId);
                    
                    return (
                      <div key={friend.id} className="bg-white rounded-3xl shadow-lg border-b-8 border-blue-200 flex flex-col hover:border-blue-400 transition-all overflow-hidden">
                        <div className={`h-24 md:h-32 ${hasPhoto ? 'bg-gray-100' : avatarData.color.split(' ')[0]} relative flex justify-center items-end`}>
                          <div className="bg-white p-1 rounded-full shadow-md -mb-8 md:-mb-10 ring-4 ring-white w-16 h-16 md:w-24 md:h-24 overflow-hidden flex items-center justify-center">
                             {hasPhoto ? ( <img src={friend.photoUrl} alt={friend.name} className="w-full h-full object-cover rounded-full" /> ) : ( <div className={`${avatarData.color} w-full h-full rounded-full flex items-center justify-center text-3xl md:text-5xl`}>{avatarData.emoji}</div> )}
                          </div>
                          <div className="absolute top-2 left-2 flex gap-2">
                            <button onClick={() => handleStar(friend)} className={`p-2 rounded-full shadow-lg transition flex items-center gap-1.5 ${isStarred ? 'bg-yellow-400 text-white scale-110' : 'bg-white/90 text-gray-400 hover:text-yellow-500'}`}>
                              <Star size={14} className={isStarred ? 'fill-current' : ''} />
                              <span className="text-[10px] font-bold">{friend.stars || 0}</span>
                            </button>
                            <button onClick={() => handleThankYou(friend)} className={`p-2 rounded-full shadow-lg transition flex items-center gap-1.5 ${isThanked ? 'bg-green-500 text-white scale-110' : 'bg-white/90 text-gray-400 hover:text-green-500'}`}>
                              <HeartHandshake size={14} />
                              <span className="text-[10px] font-bold">{friend.thanks || 0}</span>
                            </button>
                          </div>
                          <div className="absolute top-2 right-2 flex flex-col gap-2">
                            {canEdit && <button onClick={() => handleEdit(friend)} className="bg-white/90 p-2 rounded-full shadow text-blue-500"><Pencil size={16} /></button>}
                            {userRole === 'admin' && <button onClick={() => handleDelete(friend.id)} className="bg-white/90 p-2 rounded-full shadow text-red-500"><Trash2 size={16} /></button>}
                          </div>
                        </div>

                        <div className="pt-10 md:pt-14 pb-4 px-4 md:px-6 text-center flex-1">
                          <h3 className="text-xl md:text-2xl font-bold text-gray-800">{friend.name}</h3>
                          <p className="text-blue-500 font-bold text-xs md:text-sm mb-4 uppercase">"{friend.nickname || friend.name}"</p>
                          <div className={`space-y-2 text-left bg-gray-50 p-3 rounded-xl text-xs md:text-sm mb-4 ${isMobileGrid ? 'hidden md:block' : ''}`}>
                             <p><Rocket size={14} className="inline mr-2 text-blue-400" /> <span className="font-bold">Cita:</span> {friend.dream || '-'}</p>
                             <p><Gamepad2 size={14} className="inline mr-2 text-green-400" /> <span className="font-bold">Hobi:</span> {friend.hobby || '-'}</p>
                             <p><Utensils size={14} className="inline mr-2 text-orange-400" /> <span className="font-bold">Makan:</span> {friend.food || '-'}</p>
                          </div>
                          <div className="mt-auto border-2 border-dashed border-yellow-200 rounded-lg p-3 bg-yellow-50 text-gray-700 italic text-xs md:text-sm leading-relaxed">"{friend.message}"</div>
                          <button onClick={() => handleThankYou(friend)} className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition-all border ${isThanked ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 border-green-200'}`}>
                             <MessageSquareQuote size={14} /> {isThanked ? 'Sudah Bilang Terima Kasih!' : 'Bilang Terima Kasih!'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center mt-12 mb-8 px-4 opacity-50 text-xs">
        © 2026 Kelas 3A SDI Insan Karima - Dibuat oleh Bilal dan Abinya
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes shake-hand { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-shake-hand { animation: shake-hand 0.6s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        body { -webkit-tap-highlight-color: transparent; }
      `}} />
    </div>
  );
}
