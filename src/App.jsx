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
  Sun, Cloud, TreeDeciduous as Tree, Flower, Home, Trophy, Zap, ChevronRight, CornerUpLeft, Medal, Image as ImageIcon, Search, Settings, UserCircle, Type, Crown, GraduationCap
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

// COLLECTION NAME tetap sama, tapi appId (ClassId) akan dinamis
const COLLECTION_NAME = 'biodata_siswa';
const TESTIMONY_COLLECTION = 'testimonies';
const SETTINGS_COLLECTION = 'settings';

export default function App() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user'); 
  
  // classId adalah pembeda antar ruang kelas
  const [classId, setClassId] = useState('default_class');
  
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

  const [schoolSettings, setSchoolSettings] = useState({
    className: "Memuat...",
    classDescription: "Silakan tunggu...",
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

  const calculatePTS = (friend) => {
    return (friend.stars || 0) * 5 + (friend.thanks || 0) * 3;
  };

  const getOrdinal = (n) => {
    let j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return n + "st";
    if (j === 2 && k !== 12) return n + "nd";
    if (j === 3 && k !== 13) return n + "rd";
    return n + "th";
  };

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase().trim();
    return friends.filter(f => 
      f.name.toLowerCase().includes(q) || 
      (f.nickname && f.nickname.toLowerCase().includes(q))
    );
  }, [friends, searchQuery]);

  const rankedFriends = useMemo(() => {
    return [...friends].sort((a, b) => calculatePTS(b) - calculatePTS(a));
  }, [friends]);

  // Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    // Check Session
    const sessionAuth = sessionStorage.getItem('school_auth');
    const sessionRole = sessionStorage.getItem('user_role');
    const sessionClass = sessionStorage.getItem('class_id');
    
    if (sessionAuth === 'true' && sessionClass) {
      setIsAuthenticated(true);
      setClassId(sessionClass);
      if (sessionRole) setUserRole(sessionRole);
    }

    return () => unsubscribe();
  }, []);

  // Data Sync (Only when Authenticated)
  useEffect(() => {
    if (!user || !isAuthenticated || !classId) {
      if (!isAuthenticated) {
        setLoading(false);
        setSettingsLoading(false);
      }
      return;
    }

    setLoading(true);
    setSettingsLoading(true);

    // Rule 1: /artifacts/{appId}/public/data/{collectionName}
    // appId di sini kita ganti dengan classId (misal: '3A', '3B')
    const dataRef = collection(db, 'artifacts', classId, 'public', 'data', COLLECTION_NAME);
    const testimonyRef = collection(db, 'artifacts', classId, 'public', 'data', TESTIMONY_COLLECTION);
    const settingsRef = doc(db, 'artifacts', classId, 'public', 'data', SETTINGS_COLLECTION, 'class_info');
    
    const unsubscribeData = onSnapshot(dataRef, (snapshot) => {
        const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        fetched.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        setFriends(fetched);
        setLoading(false);
      }, (err) => setLoading(false)
    );

    const unsubscribeTestimonies = onSnapshot(testimonyRef, (snapshot) => {
        setAllTestimonies(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubscribeSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSchoolSettings(snapshot.data());
      } else {
        setSchoolSettings({
          className: `Kelas ${classId.toUpperCase()}`,
          classDescription: "Deskripsi kelas belum diatur",
          waliKelas: { name: "Belum Diatur", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher", role: "Wali Kelas" },
          asisten: { name: "Belum Diatur", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=assistant", role: "Asisten" },
          ketuaKelas: { name: "Belum Diatur", photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=leader", role: "Ketua Kelas" }
        });
      }
      setSettingsLoading(false); 
    });

    return () => {
      unsubscribeData();
      unsubscribeTestimonies();
      unsubscribeSettings();
    };
  }, [user, isAuthenticated, classId]);

  const handleLogin = (e) => {
    e.preventDefault();
    const input = accessCode.toLowerCase().trim();
    
    if (!input) {
      setLoginError(true);
      return;
    }

    // Logic Sederhana:
    // Jika mengandung kata 'guru-', maka dia Admin kelas tersebut
    // Contoh: 'guru-3a' -> Admin Kelas 3A
    // Jika tidak, dia User biasa
    let role = 'user';
    let targetClass = input;

    if (input.startsWith('guru-')) {
      role = 'admin';
      targetClass = input.replace('guru-', '');
    } else if (input === 'tamu') {
      role = 'viewer';
      targetClass = 'inka_umum';
    }

    setIsAuthenticated(true);
    setUserRole(role);
    setClassId(targetClass);
    setLoginError(false);
    
    sessionStorage.setItem('school_auth', 'true');
    sessionStorage.setItem('user_role', role);
    sessionStorage.setItem('class_id', targetClass);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('user');
    setAccessCode('');
    setClassId('default_class');
    sessionStorage.clear();
    setShowLogoutConfirm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const processFile = (file, maxSize, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h *= maxSize / w; w = maxSize; } } 
        else { if (h > maxSize) { w *= maxSize / h; h = maxSize; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = re.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e) => processFile(e.target.files[0], 400, (url) => setFormData(p => ({ ...p, photoUrl: url, usePhoto: true })));
  const handleBannerUpload = (e) => processFile(e.target.files[0], 800, (url) => setFormData(p => ({ ...p, bannerUrl: url, useBanner: true })));
  const handleTeacherPhotoUpload = (key, e) => processFile(e.target.files[0], 400, (url) => handleUpdateSchoolSettings(key, 'photoUrl', url));

  const handleStar = async (friend) => {
    if (!user || userRole !== 'admin') {
      setRestrictedMessage({ show: true, text: 'Hanya Guru yang bisa memberikan bintang' });
      setTimeout(() => setRestrictedMessage({ show: false, text: '' }), 2000);
      return;
    }
    const docRef = doc(db, 'artifacts', classId, 'public', 'data', COLLECTION_NAME, friend.id);
    const sKey = `starred_${friend.id}`;
    if (localStorage.getItem(sKey)) {
      await updateDoc(docRef, { stars: increment(-1) });
      localStorage.removeItem(sKey);
    } else {
      await updateDoc(docRef, { stars: increment(1) });
      localStorage.setItem(sKey, 'true');
      setStarMessage({ show: true, name: friend.nickname || friend.name });
      setTimeout(() => setStarMessage({ show: false, name: '' }), 2000);
    }
  };

  const handleThankYou = async (friend) => {
    if (!user || userRole === 'viewer') return;
    const docRef = doc(db, 'artifacts', classId, 'public', 'data', COLLECTION_NAME, friend.id);
    const tKey = `thanked_${friend.id}`;
    if (localStorage.getItem(tKey)) {
      await updateDoc(docRef, { thanks: increment(-1) });
      localStorage.removeItem(tKey);
    } else {
      await updateDoc(docRef, { thanks: increment(1) });
      localStorage.setItem(tKey, 'true');
      setThanksMessage({ show: true, name: friend.nickname || friend.name });
      setTimeout(() => setThanksMessage({ show: false, name: '' }), 2000);
    }
  };

  const handleSaveTestimony = async (e) => {
    e.preventDefault();
    if (!user || !selectedFriend || !testimonyInput.trim()) return;
    setIsSavingTestimony(true);
    try {
      const testimonyRef = collection(db, 'artifacts', classId, 'public', 'data', TESTIMONY_COLLECTION);
      await addDoc(testimonyRef, {
        friendId: selectedFriend.id,
        message: testimonyInput.trim(),
        createdAt: serverTimestamp(),
        authorId: user.uid,
        authorName: testimonyAuthor.trim() || "Anonim"
      });
      setTestimonyInput('');
    } catch (e) { console.error(e); } finally { setIsSavingTestimony(false); }
  };

  const handleConfirmSave = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const data = { ...formData, updatedAt: serverTimestamp() };
    try {
      if (isEditing && currentEditId) {
        await updateDoc(doc(db, 'artifacts', classId, 'public', 'data', COLLECTION_NAME, currentEditId), data);
      } else {
        await addDoc(collection(db, 'artifacts', classId, 'public', 'data', COLLECTION_NAME), {
          ...data, stars: 0, thanks: 0, createdAt: serverTimestamp(), creatorId: user.uid
        });
      }
      resetForm();
      setActiveTab('home');
    } catch (e) { alert("Gagal menyimpan."); } finally { setIsSubmitting(false); setShowConfirmModal(false); }
  };

  const handleUpdateSchoolSettings = async (key, field, value) => {
    if (userRole !== 'admin') return;
    const updated = field ? { ...schoolSettings, [key]: { ...schoolSettings[key], [field]: value } } : { ...schoolSettings, [key]: value };
    setSchoolSettings(updated);
    try {
      await setDoc(doc(db, 'artifacts', classId, 'public', 'data', SETTINGS_COLLECTION, 'class_info'), updated);
    } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setFormData({ name: '', nickname: '', dream: '', hobby: '', food: '', message: '', avatar: 'super_boy', photoUrl: null, usePhoto: false, bannerUrl: null, useBanner: false });
    setIsEditing(false);
    setCurrentEditId(null);
  };

  const handleDelete = async (id) => {
    if (userRole !== 'admin') return;
    if (confirm("Hapus data ini?")) {
      await deleteDoc(doc(db, 'artifacts', classId, 'public', 'data', COLLECTION_NAME, id));
    }
  };

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center">
        <div className="animate-bounce text-orange-500 mb-4"><Home size={60} /></div>
        <div className="bg-orange-500 text-white px-6 py-2 rounded-full text-xs font-black uppercase animate-pulse">Memuat Ruang Kelas...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-sky-200 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"><div className="absolute top-10 right-10 text-yellow-400"><Sun size={100} fill="currentColor" /></div></div>
        <div className="relative z-10 w-full max-w-sm">
          <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl p-8 border-4 border-orange-200 text-center">
            <div className="bg-white p-4 rounded-full border-4 border-orange-400 shadow-lg inline-block -mt-20 mb-6"><School size={40} className="text-orange-500" /></div>
            <h2 className="text-2xl font-black text-gray-800 mb-1">Pintu Kelas</h2>
            <p className="text-xs font-bold text-gray-400 uppercase mb-8">Masukkan Kode Kelasmu</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="text" 
                value={accessCode} 
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Contoh: 3A atau guru-3A"
                className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 text-center font-black uppercase focus:border-blue-400 outline-none transition-all"
              />
              <button type="submit" className="w-full bg-orange-400 text-white font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(194,120,57)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase">Masuk <ArrowRight size={20}/></button>
            </form>
            <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase leading-relaxed">Gunakan awalan "guru-" untuk masuk sebagai wali kelas.<br/>(Contoh: guru-3a)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 pb-24 md:pb-10">
      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-20 z-[100] md:hidden shadow-lg">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-400'}`}><Home size={22} /><span className="text-[10px] font-bold">HOME</span></button>
        <button onClick={() => setActiveTab('ranking')} className={`flex flex-col items-center gap-1 ${activeTab === 'ranking' ? 'text-orange-500' : 'text-gray-400'}`}><Trophy size={22} /><span className="text-[10px] font-bold">RANK</span></button>
        <div className="flex flex-col items-center gap-1 text-gray-300 relative">
          <div className="absolute -top-1 bg-gray-400 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black">SOON</div>
          <GraduationCap size={22} /><span className="text-[10px] font-bold">ACTIVITY</span>
        </div>
        {userRole !== 'viewer' && <button onClick={() => setActiveTab('form')} className={`flex flex-col items-center gap-1 ${activeTab === 'form' ? 'text-pink-500' : 'text-gray-400'}`}><Plus size={22} /><span className="text-[10px] font-bold">ADD</span></button>}
      </nav>

      <header className="bg-orange-400 text-white p-8 rounded-b-[50px] shadow-xl text-center relative">
        <div className="absolute top-4 right-4 flex gap-2">
           <button onClick={() => setShowLogoutConfirm(true)} className="bg-white/20 p-2.5 rounded-full hover:bg-white/30 transition-all"><LogOut size={20}/></button>
           {userRole === 'admin' && <button onClick={() => setShowSettingsModal(true)} className="bg-white/20 p-2.5 rounded-full hover:bg-white/30 transition-all"><Settings size={20}/></button>}
        </div>
        <div className="bg-white/20 w-fit mx-auto px-4 py-1 rounded-full text-[10px] font-black mb-4 border border-white/20">KODE: {classId.toUpperCase()}</div>
        <h1 className="text-3xl md:text-5xl font-black mb-2">{schoolSettings.className}</h1>
        <p className="text-orange-100 text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-8 opacity-80">{schoolSettings.classDescription}</p>
        
        <div className="flex justify-center gap-4 md:gap-12 mb-4 overflow-x-auto pb-4 no-scrollbar">
           {[
             { data: schoolSettings.waliKelas, label: 'WALI KELAS', color: 'bg-orange-500' },
             { data: schoolSettings.asisten, label: 'ASISTEN', color: 'bg-blue-500' },
             { data: schoolSettings.ketuaKelas, label: 'KETUA KELAS', color: 'bg-purple-500' }
           ].map((t, i) => (
             <div key={i} className="flex flex-col items-center shrink-0">
                <div className="relative mb-3">
                   <img src={t.data.photoUrl} className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-white shadow-lg object-cover" />
                   <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${t.color} text-white text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-white whitespace-nowrap`}>{t.label}</div>
                </div>
                <span className="text-[10px] md:text-sm font-black">{t.data.name || '...'}</span>
             </div>
           ))}
        </div>

        <div className="hidden md:flex justify-center gap-3 mt-8">
           <button onClick={() => setActiveTab('home')} className={`px-8 py-2.5 rounded-full font-black text-sm transition-all ${activeTab === 'home' ? 'bg-white text-orange-500 shadow-md scale-105' : 'bg-orange-500 text-white'}`}>Home</button>
           <button onClick={() => setActiveTab('ranking')} className={`px-8 py-2.5 rounded-full font-black text-sm transition-all ${activeTab === 'ranking' ? 'bg-white text-orange-500 shadow-md scale-105' : 'bg-orange-500 text-white'}`}>Peringkat</button>
           {userRole !== 'viewer' && <button onClick={() => {resetForm(); setActiveTab('form');}} className={`px-8 py-2.5 rounded-full font-black text-sm transition-all ${activeTab === 'form' ? 'bg-white text-orange-500 shadow-md scale-105' : 'bg-orange-500 text-white'}`}>Tambah Data</button>}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10">
        {activeTab === 'home' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
               <div className="relative flex-1 w-full">
                  <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari teman..."
                    className="w-full pl-14 pr-6 py-4 rounded-[2rem] bg-white shadow-md border-2 border-orange-50 outline-none focus:border-orange-300 font-bold"
                  />
               </div>
               <button onClick={() => setIsMobileGrid(!isMobileGrid)} className="md:hidden w-full py-3 bg-white rounded-2xl shadow-sm text-blue-500 font-black flex items-center justify-center gap-2 border border-blue-50">
                  {isMobileGrid ? <List size={20}/> : <LayoutGrid size={20}/>} {isMobileGrid ? 'Lihat List' : 'Lihat Grid'}
               </button>
            </div>

            <div className={`grid ${isMobileGrid ? 'grid-cols-2 gap-4' : 'grid-cols-1 gap-8'} md:grid-cols-2 lg:grid-cols-4`}>
               {filteredFriends.map(f => {
                 const av = avatars[f.avatar] || avatars.super_boy;
                 const rankIndex = rankedFriends.findIndex(rf => rf.id === f.id);
                 const rankNum = rankIndex + 1;
                 return (
                   <div key={f.id} className="bg-white rounded-[35px] shadow-xl overflow-hidden flex flex-col border-b-8 border-blue-200 hover:-translate-y-2 transition-all duration-300 group">
                      <div className="h-24 md:h-32 relative">
                         <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: f.useBanner && f.bannerUrl ? `url(${f.bannerUrl})` : 'none', backgroundColor: !f.bannerUrl ? '#f3f4f6' : 'transparent' }}>
                            {!f.bannerUrl && <div className="w-full h-full opacity-10 pattern-dots"></div>}
                         </div>
                         <div className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm">
                            <Zap size={14} className="text-yellow-500 fill-current" />
                            <span className="text-[10px] font-black">{calculatePTS(f)} PTS</span>
                         </div>
                         <div className="absolute top-3 right-3 flex gap-2">
                            {(userRole === 'admin' || user?.uid === f.creatorId) && <button onClick={() => {setFormData(f); setIsEditing(true); setCurrentEditId(f.id); setActiveTab('form');}} className="bg-white/90 p-1.5 rounded-full text-blue-500"><Pencil size={14}/></button>}
                            {userRole === 'admin' && <button onClick={() => handleDelete(f.id)} className="bg-white/90 p-1.5 rounded-full text-red-500"><Trash2 size={14}/></button>}
                         </div>
                         <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center">
                            {f.usePhoto && f.photoUrl ? <img src={f.photoUrl} className="w-full h-full object-cover" /> : <span className={`text-4xl ${av.color} w-full h-full flex items-center justify-center`}>{av.emoji}</span>}
                         </div>
                      </div>
                      <div className="pt-10 pb-6 px-6 text-center flex-1 flex flex-col">
                         <h4 className="font-black text-gray-800 text-lg mb-1 truncate">{f.nickname || f.name}</h4>
                         <div className="flex justify-center mb-4"><span className="bg-blue-50 text-blue-600 px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">{getOrdinal(rankNum)} RANK</span></div>
                         <p className="text-xs text-gray-500 italic mb-6 line-clamp-2">"{f.message || 'Semangat belajar!'}"</p>
                         <div className="mt-auto flex justify-center gap-3">
                            <button onClick={() => handleStar(f)} className={`p-2 rounded-full border-2 transition-all ${localStorage.getItem(`starred_${f.id}`) ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-white text-gray-300 border-gray-50'}`}><Star size={18} fill={localStorage.getItem(`starred_${f.id}`) ? 'currentColor' : 'none'} /></button>
                            <button onClick={() => handleThankYou(f)} className={`p-2 rounded-full border-2 transition-all ${localStorage.getItem(`thanked_${f.id}`) ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-300 border-gray-50'}`}><HeartHandshake size={18} /></button>
                            <button onClick={() => {setSelectedFriend(f); setShowTestimonyModal(true);}} className="p-2 rounded-full border-2 border-gray-50 text-purple-400 relative"><MessageSquare size={18} /><span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{allTestimonies.filter(t => t.friendId === f.id).length}</span></button>
                         </div>
                      </div>
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="bg-white rounded-[40px] shadow-xl p-8 md:p-12 mb-10 pattern-elegant border-4 border-orange-50">
             <div className="text-center mb-12">
                <Trophy size={60} className="mx-auto text-orange-500 mb-4" />
                <h2 className="text-3xl font-black text-gray-800 uppercase">Top 15 Siswa</h2>
                <p className="text-gray-400 font-bold text-xs mt-2 uppercase">Peringkat Berdasarkan Total Poin</p>
             </div>
             
             {rankedFriends.length > 0 ? (
               <div className="space-y-4 max-w-4xl mx-auto">
                  {rankedFriends.slice(0, 15).map((f, i) => (
                    <div key={f.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl flex items-center gap-4 border-2 border-orange-50 hover:border-orange-300 transition-all">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${i===0?'bg-yellow-400 text-white':i===1?'bg-gray-300 text-white':i===2?'bg-orange-300 text-white':'bg-gray-100 text-gray-400'}`}>{i+1}</div>
                       <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                          {f.usePhoto && f.photoUrl ? <img src={f.photoUrl} className="w-full h-full object-cover" /> : <div className="bg-gray-50 w-full h-full flex items-center justify-center text-xl">{avatars[f.avatar]?.emoji}</div>}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-800 truncate uppercase tracking-tight">{f.nickname || f.name}</p>
                          <p className="text-[9px] text-gray-400 font-bold italic line-clamp-1">"{f.name}"</p>
                       </div>
                       <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-blue-100">
                          <Zap size={14} className="text-blue-500 fill-current" />
                          <span className="text-sm font-black text-blue-600">{calculatePTS(f)} <span className="opacity-50 text-[10px]">PTS</span></span>
                       </div>
                    </div>
                  ))}
               </div>
             ) : <div className="py-20 text-center text-gray-300 font-black uppercase">Belum ada data peringkat</div>}
          </div>
        )}

        {activeTab === 'form' && userRole !== 'viewer' && (
          <div className="max-w-2xl mx-auto bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border-4 border-pink-100 animate-scale-up">
             <h2 className="text-3xl font-black text-pink-600 mb-8 text-center">{isEditing ? 'UPDATE DATA' : 'ISI BIODATAMU'}</h2>
             <form onSubmit={(e) => {e.preventDefault(); setShowConfirmModal(true);}} className="space-y-8">
                {/* Bagian Banner */}
                <div className="space-y-3">
                   <label className="text-xs font-black uppercase text-purple-400">Banner Kartu</label>
                   <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-gray-100 text-center">
                      <div className="flex gap-2 justify-center mb-4">
                         <button type="button" onClick={() => setFormData(p=>({...p, useBanner:false}))} className={`px-4 py-2 rounded-xl text-[10px] font-black ${!formData.useBanner?'bg-purple-500 text-white':'bg-white text-gray-400'}`}>DEFAULT</button>
                         <button type="button" onClick={() => setFormData(p=>({...p, useBanner:true}))} className={`px-4 py-2 rounded-xl text-[10px] font-black ${formData.useBanner?'bg-purple-500 text-white':'bg-white text-gray-400'}`}>UPLOAD</button>
                      </div>
                      {formData.useBanner ? (
                        <div className="relative group">
                           {formData.bannerUrl ? <img src={formData.bannerUrl} className="w-full h-32 object-cover rounded-2xl border-2 border-purple-100" /> : <div className="border-2 border-dashed border-purple-100 p-8 rounded-2xl relative"><input type="file" onChange={handleBannerUpload} className="absolute inset-0 opacity-0"/><ImageIcon className="mx-auto text-purple-200" size={30}/></div>}
                        </div>
                      ) : <div className="h-32 bg-indigo-50 rounded-2xl flex items-center justify-center pattern-dots opacity-20"><ImageIcon className="text-indigo-400" /></div>}
                   </div>
                </div>

                {/* Identitas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nama Lengkap</label><input required name="name" value={formData.name} onChange={handleInputChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 focus:bg-white border-2 border-transparent focus:border-pink-300 outline-none font-bold transition-all" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nama Panggilan</label><input name="nickname" value={formData.nickname} onChange={handleInputChange} className="w-full px-5 py-4 rounded-2xl bg-gray-50 focus:bg-white border-2 border-transparent focus:border-pink-300 outline-none font-bold transition-all" /></div>
                </div>

                {/* Detail */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {['dream', 'hobby', 'food'].map(key => (
                     <div key={key} className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{key === 'dream' ? 'Cita-cita' : key === 'hobby' ? 'Hobi' : 'Makanan'}</label>
                        <input name={key} value={formData[key]} onChange={handleInputChange} className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-300 outline-none font-bold text-xs" />
                     </div>
                   ))}
                </div>

                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase ml-2">Pesan Untuk Teman</label><textarea required name="message" value={formData.message} onChange={handleInputChange} rows="3" className="w-full px-5 py-4 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-purple-300 outline-none font-bold text-xs resize-none" /></div>

                <div className="flex flex-col gap-3 pt-4">
                   <button type="submit" disabled={isSubmitting} className="w-full bg-pink-500 text-white font-black py-5 rounded-3xl shadow-[0_8px_0_rgb(190,24,93)] active:translate-y-1 active:shadow-none transition-all uppercase">{isSubmitting ? 'MENYIMPAN...' : 'SIMPAN BIODATA'}</button>
                   <button type="button" onClick={() => {resetForm(); setActiveTab('home');}} className="text-gray-400 font-bold text-xs uppercase hover:text-gray-600 transition-all flex items-center justify-center gap-2"><RotateCcw size={14}/> Batalkan</button>
                </div>
             </form>
          </div>
        )}
      </main>

      {/* Footer & Modals - Sama seperti versi sebelumnya namun path-nya sudah dinamis menggunakan classId */}
      <footer className="text-center mt-20 opacity-30 text-[10px] font-black uppercase tracking-[0.3em]">
         KELASERU {classId.toUpperCase()} — SD INSAN KARIMA — 2026
      </footer>

      {/* Modals placeholders: Testimony, Settings, Logout Confirm, dll. */}
      {/* (Kodenya diringkas agar fokus pada fitur Multi-Kelas) */}
      
      {showTestimonyModal && selectedFriend && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white rounded-[35px] w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border-4 border-purple-200">
              <div className="p-4 bg-purple-50 flex justify-between items-center"><h3 className="font-black text-purple-600 uppercase text-sm">Pesan Untuk {selectedFriend.nickname || selectedFriend.name}</h3><button onClick={()=>setShowTestimonyModal(false)}><X/></button></div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                 {allTestimonies.filter(t => t.friendId === selectedFriend.id).map(t => (
                   <div key={t.id} className="bg-gray-50 p-4 rounded-2xl relative"><p className="text-xs italic text-gray-600">"{t.message}"</p><span className="block mt-2 text-[9px] font-black text-purple-400 uppercase">~ {t.authorName}</span></div>
                 ))}
              </div>
              <form onSubmit={handleSaveTestimony} className="p-4 border-t space-y-2">
                 <input required value={testimonyAuthor} onChange={e=>setTestimonyAuthor(e.target.value)} placeholder="Nama Kamu" className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-bold outline-none" />
                 <div className="flex gap-2">
                    <input required value={testimonyInput} onChange={e=>setTestimonyInput(e.target.value)} placeholder="Tulis pesan..." className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-bold outline-none" />
                    <button type="submit" className="bg-purple-500 text-white p-2 rounded-xl"><Send size={16}/></button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] w-full max-w-xl max-h-[90vh] overflow-y-auto p-8 border-4 border-orange-200 shadow-2xl">
              <div className="flex justify-between mb-8"><div><h2 className="text-2xl font-black uppercase">Setting Kelas</h2><p className="text-[10px] font-bold text-gray-400">PENGATURAN RUANG {classId.toUpperCase()}</p></div><button onClick={()=>setShowSettingsModal(false)}><X/></button></div>
              <div className="space-y-6">
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nama Kelas</label><input value={schoolSettings.className} onChange={e=>handleUpdateSchoolSettings('className', null, e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 font-bold border-2 border-transparent focus:border-orange-300 outline-none" /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Deskripsi</label><input value={schoolSettings.classDescription} onChange={e=>handleUpdateSchoolSettings('classDescription', null, e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 font-bold border-2 border-transparent focus:border-orange-300 outline-none" /></div>
                 <hr/>
                 {['waliKelas', 'asisten', 'ketuaKelas'].map(k => (
                   <div key={k} className="p-4 bg-orange-50 rounded-3xl space-y-3">
                      <p className="text-[10px] font-black text-orange-400 uppercase">{k}</p>
                      <div className="flex gap-4 items-center">
                         <div className="relative group w-16 h-16 shrink-0"><img src={schoolSettings[k].photoUrl} className="w-full h-full rounded-full object-cover border-2 border-white"/><input type="file" onChange={e=>handleTeacherPhotoUpload(k, e)} className="absolute inset-0 opacity-0 cursor-pointer" /></div>
                         <input value={schoolSettings[k].name} onChange={e=>handleUpdateSchoolSettings(k, 'name', e.target.value)} placeholder="Nama..." className="flex-1 px-4 py-2 rounded-xl bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-orange-300" />
                      </div>
                   </div>
                 ))}
              </div>
              <button onClick={()=>setShowSettingsModal(false)} className="w-full bg-orange-500 text-white font-black py-4 rounded-2xl mt-8 shadow-lg">SELESAI</button>
           </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white rounded-[35px] p-8 w-full max-w-xs text-center border-4 border-orange-100 shadow-2xl">
              <LogOut size={40} className="mx-auto text-orange-500 mb-4" />
              <h3 className="text-xl font-black mb-2">Mau Keluar?</h3>
              <p className="text-xs text-gray-400 font-bold mb-6">Kamu harus login lagi nanti untuk masuk ke kelas ini.</p>
              <div className="flex gap-2">
                 <button onClick={()=>setShowLogoutConfirm(false)} className="flex-1 py-3 rounded-2xl font-black text-gray-400 uppercase text-[10px] border">Batal</button>
                 <button onClick={handleLogout} className="flex-1 py-3 rounded-2xl bg-orange-500 text-white font-black uppercase text-[10px] shadow-lg">Ya, Keluar</button>
              </div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scale-up { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .pattern-dots { background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px; }
        .pattern-elegant { background-color: #fffbeb; background-image: radial-gradient(#fde68a 0.8px, transparent 0.8px), radial-gradient(#fde68a 0.8px, #fffbeb 0.8px); background-size: 40px 40px; background-position: 0 0, 20px 20px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}

