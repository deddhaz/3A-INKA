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
  MessageSquareQuote, Languages
} from 'lucide-react';

// --- CONFIGURATION ---
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
const appId = "kelas3_biodata_app";
const COLLECTION_NAME = 'kelas3_biodata';

// --- INTERNAL PWA COMPONENT ---
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
        await signInAnonymously(auth);
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

    const dataRef = collection(db, COLLECTION_NAME);
    
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
    if(window.confirm("Yakin ingin keluar dari gerbang sekolah?")) {
      setIsAuthenticated(false);
      setUserRole('user');
      setAccessCode('');
      sessionStorage.removeItem('school_auth');
      sessionStorage.removeItem('user_role');
    }
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
      alert("Wah, fotonya terlalu besar! Cari yang lebih kecil ya (di bawah 5MB).");
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

  const handleLove = async (id) => {
    const storageKey = `loved_${id}`;
    if (localStorage.getItem(storageKey)) {
      alert("Kamu sudah memberikan Love ❤️ untuk teman ini!");
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { loves: increment(1) });
      localStorage.setItem(storageKey, 'true');
    } catch (error) {
      console.error("Error giving love:", error);
    }
  };

  const handleThankYou = async (friend) => {
    const storageKey = `thanked_${friend.id}`;
    if (localStorage.getItem(storageKey)) {
      alert(`Kamu sudah bilang terima kasih ke ${friend.nickname || friend.name}! 😊`);
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, friend.id);
      await updateDoc(docRef, { thanks: increment(1) });
      localStorage.setItem(storageKey, 'true');
      
      setThanksMessage({ show: true, name: friend.nickname || friend.name });
      setTimeout(() => setThanksMessage({ show: false, name: '' }), 3000);
    } catch (error) {
      console.error("Error saying thanks:", error);
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
        const docRef = doc(db, COLLECTION_NAME, currentEditId);
        await updateDoc(docRef, {
          ...baseData,
          updatedAt: serverTimestamp()
        });
        alert("Biodata berhasil diperbarui!");
      } else {
        const dataRef = collection(db, COLLECTION_NAME);
        await addDoc(dataRef, {
          ...baseData,
          loves: 0, 
          thanks: 0,
          createdAt: serverTimestamp(),
          creatorId: user.uid
        });
        alert("Hore! Biodata berhasil disimpan.");
      }
      
      handleCancelEdit();
      setActiveTab('gallery');
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Yah, gagal menyimpan. Coba lagi ya!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm("Apakah ustadz / ustadzah yakin ingin menghapus data ini?")) {
      try {
        const docRef = doc(db, COLLECTION_NAME, docId);
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

  const getAvatar = (key) => { return avatars[key] || avatars['super_boy']; };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-sky-200 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <InstallPrompt />

        <div className="absolute top-10 left-10 text-white/40"><Smile size={80} /></div>
        <div className="absolute top-20 right-20 text-white/30"><Star size={60} /></div>
        <div className="absolute bottom-10 left-1/4 text-white/40"><Heart size={100} /></div>

        <div className="bg-white rounded-[30px] shadow-2xl p-6 md:p-8 max-w-sm w-full relative z-10 border-4 md:border-8 border-orange-200">
          <div className="flex flex-col items-center">
            
            <div className="relative mb-6 mt-2 transform scale-90 md:scale-100">
              <div className="flex gap-2 h-24 md:h-32 items-end mb-2">
                 <div className="w-3 h-24 md:h-32 bg-gray-300 rounded-t-full"></div>
                 <div className="w-3 h-20 md:h-28 bg-gray-300 rounded-t-full"></div>
                 <div className="w-3 h-24 md:h-32 bg-gray-300 rounded-t-full"></div>
                 <div className="w-3 h-20 md:h-28 bg-gray-300 rounded-t-full"></div>
                 <div className="w-3 h-24 md:h-32 bg-gray-300 rounded-t-full"></div>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-400 p-3 md:p-4 rounded-full border-4 border-white shadow-lg">
                <Lock size={32} className="text-white md:w-10 md:h-10" />
              </div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs md:text-sm font-bold shadow whitespace-nowrap flex items-center gap-2">
                <School size={14} />
                SD Insan Karima
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-gray-700 mb-2 text-center">Gerbang Terkunci!</h2>
            <p className="text-sm md:text-base text-gray-500 text-center mb-4 md:mb-6">Masukkan kode kelas untuk masuk.</p>
            
            <form onSubmit={handleLogin} className="w-full">
              <div className="relative mb-3 md:mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={18} className="text-gray-400" />
                </div>
                <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Kode Kelas..."
                  className={`w-full pl-9 pr-4 py-2.5 md:py-3 rounded-xl border-2 ${loginError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:outline-none focus:border-blue-400 transition-colors text-base md:text-lg text-center tracking-widest`}
                />
              </div>
              {loginError && (
                <div className="text-red-500 text-xs md:text-sm font-bold text-center mb-3 animate-pulse">
                  Ups! Kodenya belum pas. Tanya Abi atau Ustadzah ya!
                </div>
              )}
              <button type="submit" className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-2.5 md:py-3 rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base">
                Buka Gerbang <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
        
        <div className="absolute -bottom-10 w-full h-20 bg-green-400 rounded-t-[50%] scale-150"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-8 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
          <div className="text-xl md:text-2xl font-bold text-orange-500 animate-bounce">Menyiapkan Ruang Kelas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 font-sans pb-10 relative">
      <InstallPrompt />

      {/* Thank You Toast */}
      {thanksMessage.show && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce border-2 border-white">
          <HeartHandshake size={24} />
          <span className="font-bold">Kamu sudah bilang terima kasih ke {thanksMessage.name}!</span>
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
              <button onClick={() => setShowConfirmModal(false)} className="px-6 py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition">
                Cek Lagi
              </button>
              <button onClick={handleConfirmSave} className="px-6 py-2 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 shadow-lg transform active:scale-95 transition">
                {isEditing ? 'Ya, Update!' : 'Ya, Simpan!'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-orange-400 text-white p-4 md:p-6 shadow-lg rounded-b-[30px] md:rounded-b-[40px] mb-6 md:mb-8 relative overflow-hidden">
        <button onClick={handleLogout} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition z-50 backdrop-blur-sm">
          <LogOut size={20} />
        </button>

        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <Star className="absolute top-2 left-10" size={40} />
          <Heart className="absolute bottom-2 right-10" size={30} />
          <Smile className="absolute top-10 right-20" size={25} />
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10 pt-2">
          <h1 className="text-2xl md:text-5xl font-extrabold mb-1 md:mb-2 drop-shadow-md">🏹 Khalid Bin Walid 🏹</h1>
          <p className="text-orange-100 text-sm md:text-lg mb-2">Kelas 3A Insan Karima</p>
          {userRole === 'admin' && (
            <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold border border-white/40 mb-4">
              Mode Guru / Admin
            </span>
          )}

          <div className="flex justify-center gap-6 md:gap-12 mt-2">
             <div className="flex flex-col items-center group">
               <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden transform group-hover:scale-105 transition">
                 <img src={TEACHER_DATA.waliKelas.photoUrl} alt={TEACHER_DATA.waliKelas.name} className="w-full h-full object-cover" />
               </div>
               <span className="font-bold text-sm md:text-base mt-2 drop-shadow-sm">{TEACHER_DATA.waliKelas.name}</span>
               <span className="text-[10px] md:text-xs text-orange-100 bg-white/10 px-2 rounded-full">{TEACHER_DATA.waliKelas.role}</span>
             </div>
             
             <div className="flex flex-col items-center group">
               <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden transform group-hover:scale-105 transition">
                 <img src={TEACHER_DATA.asisten.photoUrl} alt={TEACHER_DATA.asisten.name} className="w-full h-full object-cover" />
               </div>
               <span className="font-bold text-sm md:text-base mt-2 drop-shadow-sm">{TEACHER_DATA.asisten.name}</span>
               <span className="text-[10px] md:text-xs text-orange-100 bg-white/10 px-2 rounded-full">{TEACHER_DATA.asisten.role}</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 md:px-4">
        <div className="flex justify-center mb-6 md:mb-8 gap-2 md:gap-4">
          <button onClick={() => { setActiveTab('gallery'); handleCancelEdit(); }}
            className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full font-bold text-sm md:text-lg transition-all transform hover:scale-105 shadow-md ${
              activeTab === 'gallery' ? 'bg-blue-500 text-white ring-2 md:ring-4 ring-blue-200' : 'bg-white text-blue-500 hover:bg-blue-50'
            }`}>
            <BookOpen size={18} className="md:w-6 md:h-6" /> <span>Lihat Teman</span>
          </button>
          <button onClick={() => { setActiveTab('form'); handleCancelEdit(); }}
            className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full font-bold text-sm md:text-lg transition-all transform hover:scale-105 shadow-md ${
              activeTab === 'form' ? 'bg-pink-500 text-white ring-2 md:ring-4 ring-pink-200' : 'bg-white text-pink-500 hover:bg-pink-50'
            }`}>
            <Plus size={18} className="md:w-6 md:h-6" /> <span>Isi Biodata</span>
          </button>
        </div>

        {activeTab === 'form' && (
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-8 max-w-2xl mx-auto border-2 md:border-4 border-pink-200 relative">
            {isEditing && (
               <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-yellow-200">
                 <Pencil size={12} /> Mode Edit
               </div>
            )}

            <h2 className="text-xl md:text-2xl font-bold text-pink-600 mb-4 md:mb-6 text-center">
              {isEditing ? '✏️ Update Biodatamu' : '✏️ Isi Biodatamu Yuk!'}
            </h2>
            
            <form onSubmit={handlePreSubmit} className="space-y-4 md:space-y-6">
              <div className="bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-gray-100">
                <label className="block text-gray-700 font-bold mb-3 text-center text-sm md:text-base">Pilih Foto Profilmu:</label>
                <div className="flex justify-center gap-2 md:gap-4 mb-4">
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePhoto: false }))}
                    className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl text-sm md:text-base transition-all ${!formData.usePhoto ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}>
                    <Smile size={16} className="md:w-5 md:h-5" /> Pilih Avatarmu
                  </button>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePhoto: true }))}
                    className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl text-sm md:text-base transition-all ${formData.usePhoto ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}>
                    <Camera size={16} className="md:w-5 md:h-5" /> Upload Foto
                  </button>
                </div>
                {!formData.usePhoto && (
                  <div className="grid grid-cols-4 gap-2 md:gap-3">
                    {Object.entries(avatars).map(([key, data]) => (
                      <button key={key} type="button" onClick={() => handleAvatarSelect(key)}
                        className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-xl transition-all ${formData.avatar === key ? 'ring-2 md:ring-4 ring-pink-400 bg-pink-50 transform scale-105' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}>
                        <div className={`${data.color} w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full mb-1 text-xl md:text-2xl`}>{data.emoji}</div>
                        <span className="text-[10px] md:text-xs font-medium text-gray-500">{data.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {formData.usePhoto && (
                  <div className="text-center">
                    {!formData.photoUrl ? (
                      <div className="border-2 border-dashed border-pink-300 rounded-xl p-6 md:p-8 bg-pink-50 hover:bg-pink-100 transition-colors cursor-pointer relative">
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="flex flex-col items-center text-pink-500">
                          <Upload size={32} className="mb-2 md:w-10 md:h-10" />
                          <span className="font-bold text-sm md:text-base">Klik untuk Upload Foto</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative inline-block">
                        <img src={formData.photoUrl} alt="Preview" className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-full border-4 border-pink-400 shadow-md" />
                        <button type="button" onClick={removePhoto} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"><X size={16} /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 md:mb-2 text-sm md:text-base">Nama Lengkap</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="Contoh: Bilal Achyar" className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none bg-gray-50 text-sm md:text-lg" />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1 md:mb-2 text-sm md:text-base">Nama Panggilan</label>
                  <input name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder="Contoh: Bilal" className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none bg-gray-50 text-sm md:text-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 md:mb-2 text-sm md:text-base">Cita-cita</label>
                  <input name="dream" value={formData.dream} onChange={handleInputChange} placeholder="Astronaut" className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border-2 border-blue-400 focus:outline-none bg-gray-50 text-sm md:text-base" />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1 md:mb-2 text-sm md:text-base">Hobi</label>
                  <input name="hobby" value={formData.hobby} onChange={handleInputChange} placeholder="Main Bola" className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border-2 border-green-400 focus:outline-none bg-gray-50 text-sm md:text-base" />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1 md:mb-2 text-sm md:text-base">Makanan Favorit</label>
                  <input name="food" value={formData.food} onChange={handleInputChange} placeholder="Nasi Goreng" className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border-2 border-orange-400 focus:outline-none bg-gray-50 text-sm md:text-base" />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1 md:mb-2 text-sm md:text-base">Pesan Untuk Teman</label>
                <textarea required name="message" value={formData.message} onChange={handleInputChange} placeholder="Pesan untuk semua teman-teman..." rows="3" className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none bg-gray-50 text-sm md:text-lg" />
              </div>
              
              <div className="flex gap-2 mt-4">
                {isEditing && (
                  <button type="button" onClick={handleCancelEdit} className="w-1/3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 md:py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                    <RotateCcw size={20} /> Batal
                  </button>
                )}
                <button type="submit" disabled={isSubmitting} className={`flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 md:py-4 rounded-xl text-lg md:text-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2 ${isEditing ? 'w-2/3' : 'w-full'}`}>
                  {isSubmitting ? 'Menyimpan...' : (isEditing ? 'Update Biodata' : 'Simpan Biodata')}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-8">
            {/* Class Stats / Summary */}
            <div className="bg-white/50 border-2 border-orange-100 rounded-3xl p-4 md:p-6 flex flex-wrap justify-center gap-4 md:gap-8 text-center">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-orange-500">{friends.length}</p>
                <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest">Teman Terdaftar</p>
              </div>
              <div className="w-px h-10 bg-orange-100 hidden md:block"></div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-pink-500">{friends.reduce((acc, f) => acc + (f.loves || 0), 0)}</p>
                <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest">Love Disebarkan</p>
              </div>
              <div className="w-px h-10 bg-orange-100 hidden md:block"></div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-green-500">{friends.reduce((acc, f) => acc + (f.thanks || 0), 0)}</p>
                <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest">Terima Kasih</p>
              </div>
            </div>

            {friends.length === 0 ? (
              <div className="text-center py-10 md:py-20 bg-white rounded-3xl shadow-lg border-2 border-dashed border-gray-300 mx-auto max-w-md">
                <div className="text-4xl md:text-6xl mb-4">😢</div>
                <h3 className="text-lg md:text-xl font-bold text-gray-500">Belum ada teman.</h3>
                <p className="text-sm md:text-base text-gray-400 px-4">Jadilah yang pertama mengisi biodata!</p>
                <button onClick={() => setActiveTab('form')} className="mt-4 md:mt-6 text-pink-500 font-bold hover:underline">Isi biodata sekarang →</button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg md:text-2xl font-bold text-gray-700 flex items-center gap-2">
                     <List className="text-blue-500" /> Galeri Teman 3A
                   </h3>
                   <div className="md:hidden">
                    <button onClick={() => setIsMobileGrid(!isMobileGrid)} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-600 border border-gray-200">
                      {isMobileGrid ? <List size={16} /> : <LayoutGrid size={16} />}
                      {isMobileGrid ? 'List' : 'Grid'}
                    </button>
                  </div>
                </div>
                
                <div className={`grid ${isMobileGrid ? 'grid-cols-2 gap-3' : 'grid-cols-1 gap-4'} md:grid-cols-2 lg:grid-cols-3 md:gap-6`}>
                  {friends.map((friend) => {
                    const avatarData = getAvatar(friend.avatar);
                    const hasPhoto = friend.usePhoto && friend.photoUrl;
                    const isLoved = localStorage.getItem(`loved_${friend.id}`);
                    const isThanked = localStorage.getItem(`thanked_${friend.id}`);
                    const isOwner = user && user.uid === friend.creatorId;
                    const canEdit = userRole === 'admin' || isOwner;
                    
                    return (
                      <div key={friend.id} className="bg-white rounded-2xl md:rounded-3xl shadow-lg overflow-hidden transform transition-all hover:translate-y-[-4px] border-b-4 md:border-b-8 border-blue-200 flex flex-col">
                        <div className={`h-24 md:h-32 ${hasPhoto ? 'bg-gray-200' : avatarData.color.split(' ')[0]} relative flex justify-center items-end`}>
                          <div className="bg-white p-1 rounded-full shadow-md -mb-8 md:-mb-10 ring-4 ring-white z-10 overflow-hidden w-16 h-16 md:w-24 md:h-24 flex items-center justify-center">
                             {hasPhoto ? ( <img src={friend.photoUrl} alt={friend.name} className="w-full h-full object-cover rounded-full" /> ) : ( <div className={`w-full h-full rounded-full flex items-center justify-center ${avatarData.color} text-3xl md:text-5xl shadow-inner`}>{avatarData.emoji}</div> )}
                          </div>
                          
                          {/* Interaction Buttons (Loves/Thanks) - FIXED TO FLEX ROW */}
                          <div className="absolute top-2 left-2 flex flex-row gap-2">
                            <button 
                              onClick={() => handleLove(friend.id)}
                              className={`p-2 rounded-full shadow-lg transition flex items-center gap-1.5 ${isLoved ? 'bg-pink-500 text-white' : 'bg-white/90 text-gray-500 hover:bg-pink-100 hover:text-pink-600'}`}
                              title="Kirim Love"
                            >
                              <Heart size={14} className={`${isLoved ? 'fill-current' : ''} md:w-4 md:h-4`} />
                              <span className="text-[10px] md:text-xs font-bold">{friend.loves || 0}</span>
                            </button>

                            <button 
                              onClick={() => handleThankYou(friend)}
                              className={`p-2 rounded-full shadow-lg transition flex items-center gap-1.5 ${isThanked ? 'bg-green-500 text-white' : 'bg-white/90 text-gray-500 hover:bg-green-100 hover:text-green-600'}`}
                              title="Say Thank You"
                            >
                              <HeartHandshake size={14} className="md:w-4 md:h-4" />
                              <span className="text-[10px] md:text-xs font-bold">{friend.thanks || 0}</span>
                            </button>
                          </div>
                          
                          <div className="absolute top-2 right-2 flex flex-col gap-2">
                            {canEdit && (
                              <button onClick={() => handleEdit(friend)} className="bg-white/90 hover:bg-white text-blue-500 p-2 rounded-full shadow-lg transition" title="Edit Biodata">
                                <Pencil size={16} />
                              </button>
                            )}
                            {userRole === 'admin' && (
                              <button onClick={() => handleDelete(friend.id)} className="bg-white/90 hover:bg-red-500 hover:text-white text-red-400 p-2 rounded-full shadow-lg transition" title="Hapus (Admin)">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="pt-10 md:pt-14 pb-4 px-4 md:pb-6 md:px-6 text-center flex-1 flex flex-col">
                          <h3 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">{friend.name}</h3>
                          <p className="text-blue-500 font-bold text-xs md:text-sm uppercase tracking-widest mb-4">
                            "{friend.nickname || friend.name}"
                          </p>
                          
                          <div className={`space-y-2 md:space-y-3 text-left bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl text-xs md:text-sm mb-4 ${isMobileGrid ? 'hidden md:block' : ''}`}>
                            <div className="flex items-start gap-2">
                              <Rocket className="text-blue-400 mt-0.5 shrink-0" size={14} />
                              <span className="text-gray-500 font-bold w-16 md:w-20 shrink-0">Cita-cita:</span>
                              <span className="text-gray-800 font-medium">{friend.dream || '-'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Gamepad2 className="text-green-400 mt-0.5 shrink-0" size={14} />
                              <span className="text-gray-500 font-bold w-16 md:w-20 shrink-0">Hobi:</span>
                              <span className="text-gray-800 font-medium">{friend.hobby || '-'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Utensils className="text-orange-400 mt-0.5 shrink-0" size={14} />
                              <span className="text-gray-500 font-bold w-16 md:w-20 shrink-0">Makan:</span>
                              <span className="text-gray-800 font-medium">{friend.food || '-'}</span>
                            </div>
                          </div>

                          {/* Simplified Mobile View for Grid */}
                          <div className={`${isMobileGrid ? 'grid md:hidden' : 'hidden'} grid-cols-1 gap-1 text-[10px] mb-2`}>
                             <div className="flex gap-1 items-center bg-blue-50 px-2 py-0.5 rounded text-blue-700">
                                <Rocket size={10} /> <span className="truncate">{friend.dream || '-'}</span>
                             </div>
                             <div className="flex gap-1 items-center bg-green-50 px-2 py-0.5 rounded text-green-700">
                                <Gamepad2 size={10} /> <span className="truncate">{friend.hobby || '-'}</span>
                             </div>
                          </div>

                          <div className={`mt-auto relative group ${isMobileGrid ? 'hidden md:block' : ''}`}>
                            <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200">
                              Pesan Teman
                            </div>
                            <div className="border-2 border-dashed border-yellow-200 rounded-lg md:rounded-xl p-3 md:p-4 bg-yellow-50 text-gray-700 italic text-xs md:text-sm pt-4 leading-relaxed">
                              "{friend.message}"
                            </div>
                            
                            {/* Say Thank You Button at bottom of message */}
                            <button 
                              onClick={() => handleThankYou(friend)}
                              className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-green-100 hover:bg-green-500 hover:text-white text-green-700 rounded-lg font-bold text-xs transition-all shadow-sm border border-green-200"
                            >
                              <MessageSquareQuote size={14} /> Bilang Terima Kasih!
                            </button>
                          </div>
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

      <footer className="text-center mt-12 mb-8 px-4">
        <div className="flex justify-center gap-4 mb-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
             <div className="bg-pink-100 p-2 rounded-full text-pink-500"><Heart size={16} className="fill-current" /></div>
             <p className="text-xs text-gray-500 font-bold">Sebarkan Kasih Sayang</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
             <div className="bg-green-100 p-2 rounded-full text-green-500"><HeartHandshake size={16} /></div>
             <p className="text-xs text-gray-500 font-bold">Budaya Terima Kasih</p>
          </div>
        </div>
        <p className="text-gray-400 text-xs md:text-sm">© 2026 Kelas 3A SDI Insan Karima - Dibuat oleh Bilal dan Abinya</p>
      </footer>

      {/* Styles for PWA look */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        body {
          -webkit-tap-highlight-color: transparent;
        }
        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #fffbeb;
        }
        ::-webkit-scrollbar-thumb {
          background: #fed7aa;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #fdba74;
        }
      `}} />
    </div>
  );
}
