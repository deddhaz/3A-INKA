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
  setDoc,
  query,
  where
} from 'firebase/firestore';
import { 
  User, Star, Heart, Smile, Trash2, Plus, BookOpen, Gamepad2, 
  Utensils, Rocket, Palette, Music, Camera, Upload, X, 
  Lock, Key, School, ArrowRight, CheckCircle, AlertCircle, 
  LayoutGrid, List, Pencil, RotateCcw, LogOut, HeartHandshake,
  MessageSquareQuote, Languages, Sparkles, MessageSquare, Send,
  Sun, Cloud, TreeDeciduous as Tree, Flower, Home, Trophy, Zap, ChevronRight, CornerUpLeft, Medal, Image as ImageIcon, Search, Settings, UserCircle, Type, Crown
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
const SETTINGS_COLLECTION = 'settings';

export default function App() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user'); // 'admin', 'user', 'viewer'
  const [accessCode, setAccessCode] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMobileGrid, setIsMobileGrid] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [thanksMessage, setThanksMessage] = useState({ show: false, name: '' });
  const [starMessage, setStarMessage] = useState({ show: false, name: '' });
  const [restrictedMessage, setRestrictedMessage] = useState({ show: false, text: '' }); 
  
  const [showTestimonyModal, setShowTestimonyModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [testimonyInput, setTestimonyInput] = useState('');
  const [testimonyAuthor, setTestimonyAuthor] = useState(''); 
  const [allTestimonies, setAllTestimonies] = useState([]);
  const [isSavingTestimony, setIsSavingTestimony] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- STATE DATA KELAS & GURU ---
  const [schoolSettings, setSchoolSettings] = useState({
    className: "",
    classDescription: "",
    waliKelas: { name: "", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher", role: "Wali Kelas" },
    asisten: { name: "", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=assistant", role: "Asisten" },
    ketuaKelas: { name: "", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=leader", role: "Ketua Kelas" }
  });

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

  // --- LOGIKA: FORMAT NOMOR ORDINAL ---
  const getOrdinal = (n) => {
    let j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return n + "st";
    if (j === 2 && k !== 12) return n + "nd";
    if (j === 3 && k !== 13) return n + "rd";
    return n + "th";
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
      if (!isAuthenticated) {
        setLoading(false);
        setSettingsLoading(false);
      }
      return;
    }

    setLoading(true);
    setSettingsLoading(true);

    const dataRef = collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME);
    const testimonyRef = collection(db, 'artifacts', appId, 'public', 'data', TESTIMONY_COLLECTION);
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', SETTINGS_COLLECTION, 'class_info');
    
    // Listener Data Teman
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

    // Listener Testimoni
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

    // Listener Data Pengaturan Kelas
    const unsubscribeSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSchoolSettings(prev => ({
          ...prev,
          ...data,
          waliKelas: { ...data.waliKelas, photoUrl: data.waliKelas?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher" },
          asisten: { ...data.asisten, photoUrl: data.asisten?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=assistant" },
          ketuaKelas: { ...data.ketuaKelas, photoUrl: data.ketuaKelas?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=leader" }
        }));
      } else {
        setSchoolSettings({
          className: "Solahudin Al-Ayubi",
          classDescription: "Kelas 6A SD Insan Karima",
          waliKelas: { name: "Ustazah Najwa", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher", role: "Wali Kelas" },
          asisten: { name: "Ustazah Dea", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=assistant", role: "Asisten" },
          ketuaKelas: { name: "Nama Ketua", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=leader", role: "Ketua Kelas" }
        });
      }
      setSettingsLoading(false); 
    });

    return () => {
      unsubscribeData();
      unsubscribeTestimonies();
      unsubscribeSettings();
    };
  }, [user, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const input = accessCode.toLowerCase().trim();
    const userCodes = ["insan karima", "inka", "sd insan karima", "3a"];
    const adminCodes = ["ustazah", "ustadzah", "ustadz", "ustad"]; 
    const viewerCodes = ["tamu", "view", "visitor", "guest"];

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
    } else if (viewerCodes.includes(input)) {
      setIsAuthenticated(true);
      setUserRole('viewer');
      setLoginError(false);
      sessionStorage.setItem('school_auth', 'true');
      sessionStorage.setItem('user_role', 'viewer');
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
    setShowLogoutConfirm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (loginError) setLoginError(false);
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

  const handleTeacherPhotoUpload = (key, e) => {
    processFile(e.target.files[0], 400, (url) => {
      handleUpdateSchoolSettings(key, 'photoUrl', url);
    });
  };

  const handleStar = async (friend) => {
    if (!user) return;
    if (userRole === 'viewer') {
      setRestrictedMessage({ show: true, text: 'Akun tamu tidak bisa memberikan bintang' });
      setTimeout(() => setRestrictedMessage({ show: false, text: '' }), 2500);
      return;
    }
    if (userRole !== 'admin') {
      setRestrictedMessage({ show: true, text: 'Hanya guru yang bisa memberikan bintang' });
      setTimeout(() => setRestrictedMessage({ show: false, text: '' }), 2500);
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
    if (userRole === 'viewer') {
      setRestrictedMessage({ show: true, text: 'Akun tamu tidak bisa berinteraksi' });
      setTimeout(() => setRestrictedMessage({ show: false, text: '' }), 2500);
      return;
    }
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

  const handleConfirmSave = async (e) => {
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

  const handleUpdateSchoolSettings = async (key, field, value) => {
    if (userRole !== 'admin') return;
    
    let updatedData = {};
    if (field) {
        updatedData = {
          ...schoolSettings,
          [key]: { ...schoolSettings[key], [field]: value }
        };
    } else {
        updatedData = {
          ...schoolSettings,
          [key]: value
        };
    }
    
    setSchoolSettings(updatedData);

    try {
      const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', SETTINGS_COLLECTION, 'class_info');
      await setDoc(settingsRef, updatedData);
    } catch (error) {
      console.error("Gagal update pengaturan:", error);
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

  // --- LOADING SCREEN ---
  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-4">
        <div className="animate-bounce text-orange-500 mb-6 drop-shadow-sm">
          <Home size={80} strokeWidth={2.5} />
        </div>
        <div className="bg-orange-500 text-white px-8 py-2.5 rounded-full text-sm font-black shadow-lg shadow-orange-100 uppercase tracking-widest animate-pulse">
          Sabarya...
        </div>
      </div>
    );
  }

  // --- LOGIN PAGE ---
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-sky-200 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
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
                
                {/* School Icon */}
                <div className="bg-white p-3 md:p-4 rounded-full border-4 border-orange-400 shadow-lg group-hover:scale-110 transition-transform duration-500 relative -mt-16 z-10 mb-4">
                  <School size={32} className="text-orange-500" />
                </div>

                <div className="bg-blue-500 text-white px-5 py-1.5 rounded-full text-xs font-black shadow-md z-20 transform -rotate-2">KELASERU APPS</div>
              </div>

              <h2 className="text-2xl font-black text-gray-800 tracking-tight text-center mb-1">Halo Kawan!</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">Ayo Masuk ke Kelasmu</p>
              
              <form onSubmit={handleLogin} className="w-full space-y-4">
                {/* Balon Pop-up Error di atas kolom input */}
                <div className="relative h-6">
                  {loginError && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-scale-up-balloon z-50">
                      <div className="bg-red-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 whitespace-nowrap border-2 border-white">
                        Opps! kode salah ❌
                      </div>
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-red-500 mx-auto -mt-0.5"></div>
                    </div>
                  )}
                </div>
                
                <input 
                  type="password" 
                  value={accessCode} 
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    if (loginError) setLoginError(false);
                  }} 
                  onFocus={() => setLoginError(false)}
                  placeholder="Kode Rahasia..." 
                  className={`w-full px-4 py-3.5 rounded-2xl border-2 ${loginError ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:border-blue-400 text-center font-black tracking-[0.2em] transition-all`} 
                />
                
                <button type="submit" className="w-full bg-orange-400 hover:bg-orange-500 text-white font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(194,120,57)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-wider">
                  Masuk Kelas
                  <ArrowRight size={20} />
                </button>
              </form>
            </div>
          </div>
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
      <button onClick={() => setActiveTab('ranking')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'ranking' ? 'text-orange-500' : 'text-gray-400'}`}>
        <div className={`p-2 rounded-xl transition-all ${activeTab === 'ranking' ? 'bg-orange-50 scale-110' : ''}`}><Trophy size={22} /></div>
        <span className="text-[10px] font-bold uppercase">Peringkat</span>
      </button>
      {userRole !== 'viewer' && (
        <button onClick={() => setActiveTab('form')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'form' ? 'text-pink-500' : 'text-gray-400'}`}>
          <div className={`p-2 rounded-xl transition-all ${activeTab === 'form' ? 'bg-pink-50 scale-110' : ''}`}><Plus size={22} /></div>
          <span className="text-[10px] font-bold uppercase">Tambah</span>
        </button>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-yellow-50 font-sans pb-24 md:pb-10 relative">
      <BottomNav />

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

      {restrictedMessage.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 max-sm px-4 w-full text-center border-4 border-red-300 animate-scale-up">
            <div className="relative mx-auto bg-red-50 w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <div className="animate-bounce"><AlertCircle size={64} className="text-red-500" /></div>
            </div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">Akses Terbatas</h3>
            <p className="text-red-600 font-bold">{restrictedMessage.text}</p>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-sm w-full text-center border-4 border-orange-200 animate-scale-up">
            <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogOut size={40} className="text-orange-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Mau Keluar?</h3>
            <p className="text-gray-500 mb-8 font-medium">Apakah kamu yakin ingin keluar dari kelas?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Batal</button>
              <button onClick={handleLogout} className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-black uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all">Ya, Keluar</button>
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
              {userRole !== 'viewer' ? (
                <form onSubmit={handleSaveTestimony} className="space-y-3">
                  <input required value={testimonyAuthor} onChange={(e) => setTestimonyAuthor(e.target.value)} placeholder="Nama Kamu..." className="w-full px-4 py-2 bg-purple-50 rounded-xl text-sm outline-none border border-purple-100 font-bold" maxLength={20} />
                  <div className="flex gap-2">
                    <input required value={testimonyInput} onChange={(e) => setTestimonyInput(e.target.value)} placeholder="Tulis pesan..." className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-purple-400 transition" maxLength={80} />
                    <button type="submit" disabled={isSavingTestimony || !testimonyInput.trim() || !testimonyAuthor.trim()} className="bg-purple-500 text-white p-2 rounded-full shadow-md hover:bg-purple-600 disabled:opacity-50 transition"><Send size={18} /></button>
                  </div>
                </form>
              ) : (
                <p className="text-center text-xs font-bold text-gray-400 py-2">Hanya siswa & guru yang bisa mengisi testimoni</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-sm px-4 w-full text-center border-4 border-pink-200">
            <div className="bg-pink-50 p-3 rounded-full inline-block mb-4"><CheckCircle size={40} className
