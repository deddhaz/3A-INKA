import React, { useState, useEffect, useMemo } from 'react';
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
  increment,
  query,
  where
} from 'firebase/firestore';
import { 
  User, Star, Heart, Smile, Trash2, Plus, BookOpen, Gamepad2, 
  Utensils, Rocket, Palette, Music, Camera, Upload, X, 
  Lock, Key, School, ArrowRight, CheckCircle, AlertCircle, 
  LayoutGrid, List, Pencil, RotateCcw, LogOut, HeartHandshake,
  MessageSquareQuote, Languages, Sparkles, MessageSquare, Send,
  Sun, Cloud, TreeDeciduous as Tree, Flower, Home, Trophy, Zap, ChevronRight, CornerUpLeft, Medal, Image as ImageIcon, Search
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
const TESTIMONY_COLLECTION = 'testimonies';

// --- KOMPONEN HELPER ---

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
    <div className="fixed bottom-24 left-4 right-4 z-[100] bg-white rounded-2xl shadow-2xl p-4 border-2 border-orange-400 animate-bounce md:max-w-xs md:left-auto md:right-10 md:bottom-10">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-xl text-orange-600"><School size={24} /></div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">Simpan ke HP?</p>
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
  const [activeTab, setActiveTab] = useState('home'); 
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
  const [restrictedMessage, setRestrictedMessage] = useState(false); // Pop-up untuk non-admin
  
  const [showTestimonyModal, setShowTestimonyModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [testimonyInput, setTestimonyInput] = useState('');
  const [testimonyAuthor, setTestimonyAuthor] = useState(''); 
  const [allTestimonies, setAllTestimonies] = useState([]);
  const [isSavingTestimony, setIsSavingTestimony] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

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

  const [formData, setFormData] = useState({
    name: '', nickname: '', dream: '', hobby: '', food: '', message: '',
    avatar: 'super_boy', photoUrl: null, usePhoto: false,
    bannerUrl: null, useBanner: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LOGIKA: PERHITUNGAN PTS ---
  const calculatePTS = (friend) => {
    return (friend.stars || 0) * 5 + (friend.thanks || 0) * 3;
  };

  // --- LOGIKA: FILTER PENCARIAN ---
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const query = searchQuery.toLowerCase().trim();
    return friends.filter(f => 
      f.name.toLowerCase().includes(query) || 
      (f.nickname && f.nickname.toLowerCase().includes(query))
    );
  }, [friends, searchQuery]);

  // --- LOGIKA: PERINGKAT ---
  const rankedFriends = useMemo(() => {
    return [...friends].sort((a, b) => calculatePTS(b) - calculatePTS(a));
  }, [friends]);

  // --- LOGIKA: AKTIVITAS TERBARU ---
  const recentActivities = useMemo(() => {
    return [...allTestimonies]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 15);
  }, [allTestimonies]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Gagal autentikasi:", error);
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
    const testimonyRef = collection(db, 'artifacts', appId, 'public', 'data', TESTIMONY_COLLECTION);
    
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
        console.error("Gagal mengambil data:", error);
        setLoading(false);
      }
    );

    const unsubscribeTestimonies = onSnapshot(testimonyRef, 
      (snapshot) => {
        const fetchedTestimonies = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllTestimonies(fetchedTestimonies);
      },
      (error) => console.error("Gagal mengambil testimoni:", error)
    );

    return () => {
      unsubscribeData();
      unsubscribeTestimonies();
    };
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

  const processFile = (file, maxSize, callback) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Wah, filenya terlalu besar! Sila pilih file yang lebih kecil.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (re) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } } 
        else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = re.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e) => {
    processFile(e.target.files[0], 400, (url) => {
      setFormData(prev => ({ ...prev, photoUrl: url, usePhoto: true }));
    });
  };

  const handleBannerUpload = (e) => {
    processFile(e.target.files[0], 800, (url) => {
      setFormData(prev => ({ ...prev, bannerUrl: url, useBanner: true }));
    });
  };

  // --- UPDATE: Hanya Admin/Guru yang boleh memberi bintang ---
  const handleStar = async (friend) => {
    if (!user) return;

    // Cek apakah guru
    if (userRole !== 'admin') {
      setRestrictedMessage(true);
      setTimeout(() => setRestrictedMessage(false), 2500);
      return;
    }
    
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
      console.error("Gagal mengubah status bintang:", error);
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
      console.error("Gagal mengubah status terima kasih:", error);
    }
  };

  const handleSaveTestimony = async (e) => {
    e.preventDefault();
    if (!user || !selectedFriend || !testimonyInput.trim() || !testimonyAuthor.trim()) return;
    
    setIsSavingTestimony(true);
    try {
      const testimonyRef = collection(db, 'artifacts', appId, 'public', 'data', TESTIMONY_COLLECTION);
      await addDoc(testimonyRef, {
        friendId: selectedFriend.id,
        message: testimonyInput.trim(),
        createdAt: serverTimestamp(),
        authorId: user.uid,
        authorName: testimonyAuthor.trim()
      });
      setTestimonyInput('');
    } catch (error) {
      console.error("Gagal menyimpan testimoni:", error);
    } finally {
      setIsSavingTestimony(false);
    }
  };

  const handleDeleteTestimony = async (testimonyId) => {
    if (!user || userRole !== 'admin') return;
    try {
      const testimonyDocRef = doc(db, 'artifacts', appId, 'public', 'data', TESTIMONY_COLLECTION, testimonyId);
      await deleteDoc(testimonyDocRef);
    } catch (error) {
      console.error("Gagal menghapus testimoni:", error);
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
      resetForm();
      setActiveTab('home');
    } catch (error) {
      console.error("Gagal menyimpan dokumen: ", error);
      alert("Gagal menyimpan.");
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', nickname: '', dream: '', hobby: '', food: '', message: '', 
      avatar: 'super_boy', photoUrl: null, usePhoto: false,
      bannerUrl: null, useBanner: false
    });
    setIsEditing(false);
    setCurrentEditId(null);
  };

  const handleDelete = async (docId) => {
    if (!user || userRole !== 'admin') return;
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, docId));
      } catch (error) { console.error("Gagal menghapus:", error); }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-sky-200 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <InstallPrompt />
        <div className="absolute inset-0 z-0">
          <div className="absolute top-10 right-10 md:top-20 md:right-20 animate-pulse text-yellow-400"><Sun size={80} className="fill-current" /></div>
          <div className="absolute top-10 left-[10%] animate-float-slow opacity-60 text-white"><Cloud size={64} className="fill-current" /></div>
          <div className="absolute top-40 left-[40%] animate-float opacity-40 text-white"><Cloud size={80} className="fill-current" /></div>
          <div className="absolute bottom-0 w-full h-[25vh] bg-green-500 rounded-t-[100%] scale-x-125 transform translate-y-10"></div>
          <div className="absolute bottom-[18vh] left-[5%] md:left-[15%] text-green-700 hidden sm:block"><Tree size={120} className="fill-current opacity-80" /></div>
        </div>

        <div className="relative z-10 w-full max-w-sm px-4">
          <div className="bg-white/90 backdrop-blur-md rounded-[30px] shadow-2xl p-6 md:p-8 relative border-4 border-orange-200 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-orange-400"></div>
            <div className="flex flex-col items-center">
              <div className="relative mb-6 mt-2 flex flex-col items-center">
                <div className="flex gap-4 md:gap-6 items-end mb-1">
                   <div className="w-4 h-24 md:h-32 bg-orange-300 rounded-t-full shadow-inner relative">
                      <div className="absolute -top-1 -left-1 w-6 h-6 bg-orange-400 rounded-full border-2 border-white"></div>
                   </div>
                   <div className="w-4 h-24 md:h-32 bg-orange-300 rounded-t-full shadow-inner relative">
                      <div className="absolute -top-1 -left-1 w-6 h-6 bg-orange-400 rounded-full border-2 border-white"></div>
                   </div>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-3 md:p-4 rounded-full border-4 border-orange-400 shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <School size={32} className="text-orange-500" />
                </div>
                <div className="bg-blue-500 text-white px-5 py-1.5 rounded-full text-xs font-black shadow-md z-20 transform -rotate-2">SD INSAN KARIMA</div>
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight text-center mb-1">Assalamualaikum!</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">Masuk ke Kelas 6A</p>
              <form onSubmit={handleLogin} className="w-full space-y-4">
                <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Kode Kelas..." className={`w-full px-4 py-3.5 rounded-2xl border-2 ${loginError ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:border-blue-400 text-center font-black tracking-[0.2em] transition-all`} />
                <button type="submit" className="w-full bg-orange-400 hover:bg-orange-500 text-white font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(194,120,57)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-wider">Buka Gerbang <ArrowRight size={20} /></button>
              </form>
            </div>
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
          <div className="text-xl font-bold text-orange-500">Sabar ya...</div>
        </div>
      </div>
    );
  }

  // --- SUB-KOMPONEN NAVIGASI ---
  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-20 px-4 z-[100] md:hidden shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
      <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-400'}`}>
        <div className={`p-2 rounded-xl transition-all ${activeTab === 'home' ? 'bg-blue-50 scale-110' : ''}`}><Home size={22} /></div>
        <span className="text-[10px] font-bold uppercase">Home</span>
      </button>
      <button onClick={() => setActiveTab('activity')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'activity' ? 'text-purple-500' : 'text-gray-400'}`}>
        <div className={`p-2 rounded-xl transition-all ${activeTab === 'activity' ? 'bg-purple-50 scale-110' : ''}`}><Zap size={22} /></div>
        <span className="text-[10px] font-bold uppercase">Aktivitas</span>
      </button>
      <button onClick={() => setActiveTab('ranking')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'ranking' ? 'text-orange-500' : 'text-gray-400'}`}>
        <div className={`p-2 rounded-xl transition-all ${activeTab === 'ranking' ? 'bg-orange-50 scale-110' : ''}`}><Trophy size={22} /></div>
        <span className="text-[10px] font-bold uppercase">Peringkat</span>
      </button>
      <button onClick={() => setActiveTab('form')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'form' ? 'text-pink-500' : 'text-gray-400'}`}>
        <div className={`p-2 rounded-xl transition-all ${activeTab === 'form' ? 'bg-pink-50 scale-110' : ''}`}><Plus size={22} /></div>
        <span className="text-[10px] font-bold uppercase">Tambah</span>
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-yellow-50 font-sans pb-24 md:pb-10 relative">
      <InstallPrompt />
      <BottomNav />

      {/* Popups (Star, Thanks, Testimony, Confirm, Restricted) */}
      {thanksMessage.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 max-w-sm w-full text-center border-4 border-green-200 animate-scale-up">
            <div className="relative mx-auto bg-green-50 w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-inner"><div className="animate-shake-hand"><HeartHandshake size={64} className="text-green-500" /></div></div>
            <h3 className="text-2xl font-extrabold text-gray-800 mb-2">Terima Kasih!</h3>
            <p className="text-gray-500">Kamu sudah bilang terima kasih ke <br/><span className="text-green-600 font-bold text-xl">"{thanksMessage.name}"</span></p>
          </div>
        </div>
      )}

      {starMessage.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 max-w-sm w-full text-center border-4 border-yellow-300 animate-scale-up">
            <div className="relative mx-auto bg-yellow-50 w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-inner"><div className="animate-spin-slow"><Star size={64} className="text-yellow-500 fill-current" /></div></div>
            <h3 className="text-2xl font-extrabold text-gray-800 mb-2">Bintang Terkirim!</h3>
            <p className="text-gray-500">Kamu memberikan Bintang untuk <br/><span className="text-yellow-600 font-bold text-xl">"{starMessage.name}"</span></p>
          </div>
        </div>
      )}

      {/* Pop-up Pesan Dibatasi (Hanya Guru) */}
      {restrictedMessage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 max-w-sm w-full text-center border-4 border-red-300 animate-scale-up">
            <div className="relative mx-auto bg-red-50 w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <div className="animate-bounce"><AlertCircle size={64} className="text-red-500" /></div>
            </div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">Akses Terbatas</h3>
            <p className="text-red-600 font-bold">Hanya guru yang bisa memberikan bintang</p>
          </div>
        </div>
      )}

      {/* Input Search Overlay untuk Mobile */}
      {showSearchInput && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-md md:hidden flex items-start justify-center pt-20 px-4 animate-fade-in">
          <div className="w-full max-w-md animate-scale-up">
            <div className="relative">
              <input 
                autoFocus
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari teman..."
                className="w-full px-6 py-4 rounded-full bg-white text-gray-800 shadow-2xl border-4 border-orange-200 outline-none pr-12 font-bold"
              />
              <button onClick={() => {setSearchQuery(''); setShowSearchInput(false);}} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 bg-gray-100 p-1 rounded-full">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showTestimonyModal && selectedFriend && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col border-4 border-purple-200">
            <div className="p-4 border-b flex justify-between items-center bg-purple-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded-full w-10 h-10 overflow-hidden shadow-sm">
                  {selectedFriend.usePhoto && selectedFriend.photoUrl ? <img src={selectedFriend.photoUrl} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full rounded-full flex items-center justify-center text-xl bg-purple-100">{avatars[selectedFriend.avatar]?.emoji || '🦸‍♂️'}</div>}
                </div>
                <h3 className="font-bold text-gray-800">{selectedFriend.nickname || selectedFriend.name}</h3>
              </div>
              <button onClick={() => setShowTestimonyModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {allTestimonies.filter(t => t.friendId === selectedFriend.id).length === 0 ? (
                <div className="text-center py-10 opacity-40"><MessageSquare size={40} className="mx-auto mb-2" /><p className="text-sm">Belum ada testimoni.</p></div>
              ) : (
                allTestimonies.filter(t => t.friendId === selectedFriend.id).map(t => (
                  <div key={t.id} className="bg-white p-3 rounded-2xl shadow-sm border border-purple-50 animate-fade-in group">
                    <p className="text-sm text-gray-700 italic">"{t.message}"</p>
                    <div className="flex justify-between items-center mt-2">
                       <span className="text-[10px] text-purple-600 font-extrabold uppercase">~ {t.authorName}</span>
                       {userRole === 'admin' && <button onClick={() => handleDeleteTestimony(t.id)} className="text-red-300 hover:text-red-500 transition"><Trash2 size={12} /></button>}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t bg-white rounded-b-2xl">
              <form onSubmit={handleSaveTestimony} className="space-y-3">
                <input required value={testimonyAuthor} onChange={(e) => setTestimonyAuthor(e.target.value)} placeholder="Nama Kamu..." className="w-full px-4 py-2 bg-purple-50 rounded-xl text-sm outline-none border border-purple-100 font-bold" maxLength={20} />
                <div className="flex gap-2">
                  <input required value={testimonyInput} onChange={(e) => setTestimonyInput(e.target.value)} placeholder="Tulis pesan..." className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-purple-400 transition" maxLength={80} />
                  <button type="submit" disabled={isSavingTestimony || !testimonyInput.trim() || !testimonyAuthor.trim()} className="bg-purple-500 text-white p-2 rounded-full shadow-md hover:bg-purple-600 disabled:opacity-50 transition"><Send size={18} /></button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-sm px-4 w-full text-center border-4 border-pink-200">
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

      {/* HEADER */}
      <header className="bg-orange-400 text-white p-6 shadow-lg rounded-b-[40px] mb-8 relative text-center">
        <button onClick={handleLogout} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
          <LogOut size={20} />
        </button>

        <h1 className="text-2xl md:text-5xl font-extrabold mb-1 drop-shadow-md">Solahudin Al-Ayubi</h1>
        <p className="text-orange-100 text-sm font-bold uppercase tracking-widest mb-4">Kelas 6A SD Insan Karima</p>
        <div className="flex justify-center gap-8 mb-4">
           {Object.values(TEACHER_DATA).map(t => (
             <div key={t.name} className="flex flex-col items-center">
               <img src={t.photoUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-md object-cover mb-2" alt={t.name} />
               <span className="font-bold text-xs md:text-sm">{t.name}</span>
             </div>
           ))}
        </div>

        {/* Desktop Nav Tabs */}
        <div className="hidden md:flex justify-center gap-2 mt-6">
          <button onClick={() => setActiveTab('home')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'home' ? 'bg-white text-orange-500 shadow-md' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>Home</button>
          <button onClick={() => setActiveTab('activity')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'activity' ? 'bg-white text-orange-500 shadow-md' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>Aktivitas</button>
          <button onClick={() => setActiveTab('ranking')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'ranking' ? 'bg-white text-orange-500 shadow-md' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>Peringkat</button>
          <button onClick={() => { setActiveTab('form'); resetForm(); }} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'form' ? 'bg-white text-orange-500 shadow-md' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>Tambah Biodata</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        
        {/* TAB: UTAMA (Galeri) */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Desktop Search Bar (Berbentuk kolom lengkap, terpusat di bawah header) */}
            <div className="hidden md:flex justify-center mb-10">
              <div className="relative w-full max-w-2xl group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-400 group-focus-within:text-orange-500 transition-colors">
                  <Search size={24} />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama teman atau nama panggilan..."
                  className="w-full pl-16 pr-8 py-5 rounded-[2rem] bg-white shadow-lg border-2 border-orange-100 outline-none focus:border-orange-400 transition-all font-bold text-lg text-gray-700"
                />
                {searchQuery && (
                   <button 
                     onClick={() => setSearchQuery('')}
                     className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-100 p-1.5 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                   >
                     <X size={20} />
                   </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mb-6 px-1">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {searchQuery ? `Hasil pencarian untuk "${searchQuery}"` : 'Galeri Biodata'}
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile Search Icon (Tanpa teks, di samping tombol Grid/List) */}
                <button 
                  onClick={() => setShowSearchInput(true)}
                  className="md:hidden p-2.5 bg-white rounded-xl shadow-sm text-orange-500 border-2 border-orange-100 active:scale-95 transition-all"
                >
                  <Search size={18} />
                </button>

                <button onClick={() => setIsMobileGrid(!isMobileGrid)} className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm text-sm font-bold text-blue-500 border-2 border-blue-100 transition-all active:scale-95">
                  {isMobileGrid ? <List size={18} /> : <LayoutGrid size={18} />}
                  {isMobileGrid ? 'List' : 'Grid'}
                </button>
              </div>
            </div>
            
            <div className={`grid ${isMobileGrid ? 'grid-cols-2 gap-3 pb-8' : 'grid-cols-1 gap-8 pb-10'} md:grid-cols-2 lg:grid-cols-4 md:gap-8 md:pb-12`}>
              {filteredFriends.length === 0 ? (
                <div className="col-span-full py-20 text-center opacity-40">
                  <AlertCircle size={48} className="mx-auto mb-2 text-gray-400" />
                  <p className="font-bold">{searchQuery ? 'Teman tidak ditemukan.' : 'Belum ada data teman.'}</p>
                </div>
              ) : (
                filteredFriends.map(friend => {
                  const av = avatars[friend.avatar] || avatars.super_boy;
                  const pic = friend.usePhoto && friend.photoUrl;
                  const banner = friend.useBanner && friend.bannerUrl;
                  const isS = localStorage.getItem(`starred_${friend.id}`);
                  const isT = localStorage.getItem(`thanked_${friend.id}`);
                  const owner = user && user.uid === friend.creatorId;
                  const testimonyCount = allTestimonies.filter(t => t.friendId === friend.id).length;
                  const totalPTS = calculatePTS(friend);

                  return (
                    <div key={friend.id} className={`bg-white shadow-lg border-b-8 border-blue-200 flex flex-col hover:border-blue-400 transition-all ${isMobileGrid ? 'rounded-2xl' : 'rounded-3xl'}`}>
                      {/* Banner Section */}
                      <div className={`${isMobileGrid ? 'h-24' : 'h-32 md:h-44'} relative`}>
                        <div className={`absolute inset-0 w-full h-full overflow-hidden ${isMobileGrid ? 'rounded-t-2xl' : 'rounded-t-3xl'}`}>
                           <div 
                             className={`absolute inset-0 w-full h-full transition-all duration-700 ${banner ? '' : (pic ? 'bg-gray-100' : av.color.split(' ')[0])} ${!banner && !pic ? 'pattern-dots' : ''}`}
                             style={banner ? { backgroundImage: `url(${friend.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                           />
                           <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pointer-events-none z-10">
                           <h4 className={`font-black text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight ${isMobileGrid ? 'text-xs mt-1' : 'text-xl md:text-2xl mt-2'}`}>
                             {isMobileGrid ? (friend.nickname || friend.name) : friend.name}
                           </h4>
                        </div>

                        <div className="absolute top-2 left-2 bg-white/90 px-2.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 z-20 border-2 border-yellow-200 backdrop-blur-sm">
                          <Medal size={16} className="text-yellow-600 fill-yellow-50" />
                          <span className="text-xs font-black text-yellow-700">{totalPTS} <span className="text-[9px] font-normal">PTS</span></span>
                        </div>

                        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20">
                           {(owner || userRole === 'admin') && <button onClick={() => { setFormData(friend); setIsEditing(true); setCurrentEditId(friend.id); setActiveTab('form'); }} className="bg-white/90 p-1.5 rounded-full text-blue-500 shadow-md hover:bg-blue-500 hover:text-white transition backdrop-blur-sm"><Pencil size={14} /></button>}
                           {userRole === 'admin' && <button onClick={() => handleDelete(friend.id)} className="bg-white/90 p-1.5 rounded-full text-red-500 shadow-md hover:bg-red-500 hover:text-white transition backdrop-blur-sm"><Trash2 size={14} /></button>}
                        </div>

                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30">
                          <div className={`bg-white p-1 rounded-full shadow-xl ring-4 ring-white overflow-hidden flex items-center justify-center ${isMobileGrid ? 'w-14 h-14' : 'w-20 h-20 md:w-28 md:h-28'} transition-all`}>
                             {pic ? <img src={friend.photoUrl} className="w-full h-full object-cover rounded-full" /> : <div className={`${av.color} w-full h-full rounded-full flex items-center justify-center text-xl ${isMobileGrid ? 'text-2xl' : 'text-3xl md:text-5xl'}`}>{av.emoji}</div>}
                          </div>
                        </div>
                      </div>

                      <div className={`${isMobileGrid ? 'pt-10 pb-4' : 'pt-16 pb-6'} px-4 text-center flex-1 flex flex-col items-center`}>
                         {!isMobileGrid && (
                           <p className="text-blue-500 font-black text-[10px] md:text-xs uppercase mb-4 tracking-[0.2em] opacity-80 mt-1">
                             "{friend.nickname || friend.name}"
                           </p>
                         )}

                         {isMobileGrid ? (
                            <div className="flex justify-center gap-4 mt-1">
                               <Rocket size={16} className={friend.dream ? "text-blue-400" : "text-gray-100"} />
                               <Gamepad2 size={16} className={friend.hobby ? "text-green-400" : "text-gray-100"} />
                               <Utensils size={16} className={friend.food ? "text-orange-400" : "text-gray-100"} />
                            </div>
                         ) : (
                            <div className="space-y-2 text-left bg-gray-50/80 p-5 rounded-[2rem] text-xs md:text-sm mb-4 w-full border border-gray-100 shadow-inner">
                               <p className="flex items-center gap-3"><Rocket size={16} className="text-blue-400 shrink-0" /> <span><b>Cita-cita:</b> {friend.dream || '-'}</span></p>
                               <p className="flex items-center gap-3"><Gamepad2 size={16} className="text-green-400 shrink-0" /> <span><b>Hobi:</b> {friend.hobby || '-'}</span></p>
                               <p className="flex items-center gap-3"><Utensils size={16} className="text-orange-400 shrink-0" /> <span><b>Makanan:</b> {friend.food || '-'}</span></p>
                            </div>
                         )}

                         <div className={`flex justify-center items-center w-full mt-auto ${isMobileGrid ? 'gap-2 pt-4' : 'gap-4 pt-6'}`}>
                           <button 
                             onClick={() => handleStar(friend)} 
                             className={`flex items-center justify-center gap-1.5 rounded-full border-2 transition-all ${isMobileGrid ? 'px-2 py-1' : 'px-4 py-2'} ${isS ? 'bg-yellow-400 text-white border-yellow-400 shadow-md scale-105' : 'bg-white text-gray-400 border-gray-100 hover:text-yellow-500 hover:border-yellow-100'} ${userRole !== 'admin' ? 'cursor-not-allowed' : ''}`}
                           >
                             <Star size={isMobileGrid ? 14 : 18} className={isS ? 'fill-current' : ''} />
                             <span className="text-xs font-black">{friend.stars || 0}</span>
                           </button>
                           <button onClick={() => handleThankYou(friend)} className={`flex items-center justify-center gap-1.5 rounded-full border-2 transition-all ${isMobileGrid ? 'px-2 py-1' : 'px-4 py-2'} ${isT ? 'bg-green-500 text-white border-green-500 shadow-md scale-105' : 'bg-white text-gray-400 border-gray-100 hover:text-green-500 hover:border-green-100'}`}><HeartHandshake size={isMobileGrid ? 14 : 18} /><span className="text-xs font-black">{friend.thanks || 0}</span></button>
                           <button onClick={() => { setSelectedFriend(friend); setShowTestimonyModal(true); }} className={`flex items-center justify-center gap-1.5 rounded-full bg-purple-500 text-white shadow-md transition-all active:scale-95 ${isMobileGrid ? 'px-2 py-1' : 'px-4 py-2 hover:bg-purple-600'}`}><MessageSquare size={isMobileGrid ? 14 : 18} /><span className="text-xs font-black">{testimonyCount}</span></button>
                         </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB: AKTIVITAS */}
        {activeTab === 'activity' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10">
             <div className="text-center mb-8">
                <div className="bg-purple-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-purple-600 shadow-lg"><Zap size={32} /></div>
                <h3 className="text-2xl font-black text-gray-800">Aktivitas Terbaru</h3>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1 text-center">Update Terbaru Dari Teman-teman</p>
             </div>
             
             <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-200"><p className="text-gray-400 font-bold italic">Belum ada aktivitas terbaru...</p></div>
                ) : (
                  recentActivities.map(act => {
                    const targetFriend = friends.find(f => f.id === act.friendId);
                    return (
                      <div key={act.id} className="bg-white p-5 rounded-[2rem] shadow-sm border-l-8 border-purple-400 flex items-start gap-4 hover:shadow-md transition-all">
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center border-2 border-white shadow-sm">
                          {targetFriend?.usePhoto && targetFriend?.photoUrl ? <img src={targetFriend.photoUrl} className="w-full h-full object-cover" /> : <div className="text-2xl">{avatars[targetFriend?.avatar]?.emoji || '🦸‍♂️'}</div>}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-black text-gray-800 text-sm">{act.authorName} <span className="font-normal text-gray-400 mx-1 text-[10px]">memberi testimoni kepada</span> {targetFriend?.name || 'Teman'}</h4>
                            <span className="text-[9px] text-gray-300 font-bold uppercase shrink-0 ml-2">{new Date(act.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-gray-600 italic text-sm mt-2 bg-purple-50/50 p-3 rounded-2xl border border-purple-100/50">"{act.message}"</p>
                        </div>
                      </div>
                    );
                  })
                )}
             </div>
          </div>
        )}

        {/* TAB: PERINGKAT */}
        {activeTab === 'ranking' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10">
             <div className="text-center mb-8">
                <div className="bg-orange-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-orange-600 shadow-lg"><Trophy size={32} /></div>
                <h3 className="text-2xl font-black text-gray-800 text-center">Peringkat PTS</h3>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1 text-center">Peringkat Berdasarkan Total Poin Tertinggi</p>
             </div>

             <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border-2 border-orange-100">
                {rankedFriends.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 italic font-bold">Data belum tersedia...</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {rankedFriends.slice(0, 15).map((friend, index) => {
                      const totalPTS = calculatePTS(friend);
                      return (
                        <div key={friend.id} className="flex items-center p-5 hover:bg-orange-50/50 transition-colors group">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black mr-4 ${index === 0 ? 'bg-yellow-400 text-white shadow-yellow-200 shadow-lg' : index === 1 ? 'bg-gray-300 text-white shadow-gray-200 shadow-lg' : index === 2 ? 'bg-orange-300 text-white shadow-orange-200 shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                            {index + 1}
                          </div>
                          <div className="w-14 h-14 rounded-full overflow-hidden mr-4 border-2 border-white shadow-md shrink-0">
                            {friend.usePhoto && friend.photoUrl ? <img src={friend.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-2xl">{avatars[friend.avatar]?.emoji}</div>}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-gray-800 group-hover:text-orange-600 transition-colors">{friend.name}</h4>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-1.5 bg-yellow-50 px-4 py-1.5 rounded-full border-2 border-yellow-200 shrink-0 shadow-sm">
                              <Medal size={16} className="text-yellow-600 fill-yellow-200" />
                              <span className="font-black text-yellow-700">{totalPTS} <span className="text-[10px] font-normal uppercase">PTS</span></span>
                            </div>
                            <div className="flex gap-2.5 text-[10px] font-black text-gray-300 px-1">
                               <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-current" /> {friend.stars || 0}</span>
                               <span className="flex items-center gap-1"><HeartHandshake size={11} className="text-green-500" /> {friend.thanks || 0}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
             </div>
          </div>
        )}

        {/* TAB: FORM */}
        {activeTab === 'form' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 md:p-10 max-w-2xl mx-auto border-2 border-pink-100 animate-scale-up relative mb-10">
            <h2 className="text-xl md:text-3xl font-black text-pink-600 mb-8 text-center drop-shadow-sm">{isEditing ? '✏️ Update Biodata' : '✏️ Yuk Isi Biodatamu!'}</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }} className="space-y-8">
              
              {/* Opsi Banner */}
              <div className="space-y-3">
                 <label className="text-[11px] font-black uppercase text-purple-400 ml-1 tracking-widest">Desain Banner Kartu:</label>
                 <div className="bg-gray-50 p-5 rounded-[2rem] border-2 border-gray-100 text-center">
                    <div className="flex justify-center gap-3 mb-5">
                      <button type="button" onClick={() => setFormData(p => ({ ...p, useBanner: false }))} className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${!formData.useBanner ? 'bg-purple-500 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>Motif Kelas</button>
                      <button type="button" onClick={() => setFormData(p => ({ ...p, useBanner: true }))} className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${formData.useBanner ? 'bg-purple-500 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>Upload Banner</button>
                    </div>

                    {!formData.useBanner ? (
                      <div className="p-10 rounded-2xl bg-indigo-100 pattern-dots flex items-center justify-center border-2 border-indigo-200">
                         <span className="bg-white/80 px-4 py-1.5 rounded-full text-[10px] font-black text-indigo-500 uppercase">Motif Khalid Bin Walid Aktif</span>
                      </div>
                    ) : (
                      <div className="relative">
                        {formData.bannerUrl ? (
                           <div className="relative group">
                              <img src={formData.bannerUrl} className="w-full h-32 object-cover rounded-2xl border-2 border-purple-200 shadow-md" />
                              <button type="button" onClick={() => setFormData(p => ({ ...p, bannerUrl: null }))} className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110"><X size={16} /></button>
                           </div>
                        ) : (
                          <div className="border-2 border-dashed border-purple-200 rounded-2xl p-8 bg-purple-50/50 cursor-pointer relative hover:bg-purple-100 transition-colors">
                             <input type="file" accept="image/*" onChange={handleBannerUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                             <ImageIcon size={32} className="text-purple-400 mx-auto" />
                             <p className="text-purple-500 font-black text-[10px] mt-2 uppercase">Klik Untuk Pilih Gambar Banner</p>
                          </div>
                        )}
                      </div>
                    )}
                 </div>
              </div>

              {/* Opsi Foto Profil / Avatar */}
              <div className="space-y-3">
                 <label className="text-[11px] font-black uppercase text-pink-400 ml-1 tracking-widest">Foto / Avatar Profil:</label>
                 <div className="bg-gray-50 p-5 rounded-[2rem] border-2 border-gray-100 text-center">
                  <div className="flex justify-center gap-3 mb-5">
                    <button type="button" onClick={() => setFormData(p => ({ ...p, usePhoto: false }))} className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${!formData.usePhoto ? 'bg-pink-500 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>Pakai Avatar</button>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, usePhoto: true }))} className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${formData.usePhoto ? 'bg-pink-500 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>Upload Foto</button>
                  </div>
                  
                  {!formData.usePhoto ? (
                    <div className="grid grid-cols-4 gap-3 max-w-full mx-auto">
                      {Object.entries(avatars).map(([key, data]) => (
                        <button 
                          key={key} 
                          type="button" 
                          onClick={() => setFormData(p => ({ ...p, avatar: key }))} 
                          className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all ${formData.avatar === key ? 'border-pink-400 bg-pink-50 ring-2 ring-pink-100 ring-offset-1' : 'border-transparent bg-white shadow-sm'}`}
                        >
                          <div className={`${data.color} w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full text-xl md:text-2xl shadow-inner`}>
                            {data.emoji}
                          </div>
                          <span className="hidden md:block text-[9px] text-gray-400 font-black mt-1 uppercase truncate w-full text-center">{data.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="relative inline-block mt-2">
                      {formData.photoUrl ? (
                        <div className="relative"><img src={formData.photoUrl} className="w-28 h-28 md:w-36 md:h-36 object-cover rounded-full border-4 border-pink-400 shadow-xl" /><button type="button" onClick={() => setFormData(p => ({ ...p, photoUrl: null }))} className="absolute -top-1 -right-1 bg-red-500 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110"><X size={16} /></button></div>
                      ) : (
                        <div className="border-2 border-dashed border-pink-200 rounded-3xl p-10 bg-pink-50 cursor-pointer transition-all hover:bg-pink-100 hover:border-pink-300 group relative">
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <Upload size={40} className="text-pink-400 mx-auto group-hover:scale-110 transition-transform" />
                          <p className="text-pink-500 font-black text-[10px] mt-2 uppercase tracking-widest text-center">Klik Untuk Ambil Foto</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Data Biodata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Nama Lengkap</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="Ketik nama lengkap..." className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 outline-none focus:border-pink-400 font-bold transition-all shadow-sm" />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Nama Panggilan</label>
                  <input name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder="Nama panggilan..." className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 outline-none focus:border-pink-400 font-bold transition-all shadow-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-blue-400 ml-1 tracking-widest">Cita-cita</label>
                  <input name="dream" value={formData.dream} onChange={handleInputChange} placeholder="Ingin jadi apa?" className="w-full px-5 py-3.5 rounded-2xl border-2 border-blue-50 outline-none focus:border-blue-400 transition-all shadow-sm" />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-green-400 ml-1 tracking-widest">Hobi</label>
                  <input name="hobby" value={formData.hobby} onChange={handleInputChange} placeholder="Suka ngapain?" className="w-full px-5 py-3.5 rounded-2xl border-2 border-green-50 outline-none focus:border-green-400 transition-all shadow-sm" />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-orange-400 ml-1 tracking-widest">Makanan Favorit</label>
                  <input name="food" value={formData.food} onChange={handleInputChange} placeholder="Makan paling enak?" className="w-full px-5 py-3.5 rounded-2xl border-2 border-orange-50 outline-none focus:border-orange-400 transition-all shadow-sm" />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase text-purple-400 ml-1 tracking-widest">Pesan Untuk Teman-teman:</label>
                <textarea required name="message" value={formData.message} onChange={handleInputChange} placeholder="Tuliskan kata-kata semangat untuk teman-teman..." rows="3" className="w-full px-6 py-5 rounded-3xl border-2 border-gray-100 outline-none focus:border-purple-400 transition-all shadow-sm resize-none" />
              </div>

              <div className="flex flex-col gap-4 pt-6">
                <button type="submit" disabled={isSubmitting} className="w-full bg-pink-500 text-white font-black py-5 rounded-3xl shadow-[0_8px_0_rgb(190,24,93)] active:shadow-none active:translate-y-1 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 group text-lg">
                  {isSubmitting ? 'Menyimpan...' : isEditing ? 'Update Biodata' : 'Simpan Biodata'}
                  <CheckCircle size={24} className="group-hover:scale-110 transition-transform" />
                </button>
                
                <button type="button" onClick={() => { resetForm(); setActiveTab('home'); }} className="w-full bg-white text-gray-400 border-2 border-gray-100 font-black py-4 rounded-3xl transition-all hover:bg-gray-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                  <CornerUpLeft size={18} /> Batal & Kembali
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <footer className="text-center mt-12 mb-28 opacity-50 text-[10px] md:text-xs tracking-widest uppercase font-black px-4 leading-relaxed">
        Kelas 6A — SD Insan Karima<br/>
        Dibuat oleh Hiro dan Abinya — 2026
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes shake-hand { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-shake-hand { animation: shake-hand 0.6s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        
        .pattern-dots {
          background-image: radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 15px 15px;
        }

        body { -webkit-tap-highlight-color: transparent; scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
      `}} />
    </div>
  );
}
