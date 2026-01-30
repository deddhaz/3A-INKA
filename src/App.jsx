import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Sun, Cloud, TreeDeciduous as Tree, Flower, Home, Trophy, Zap, 
  ChevronRight, CornerUpLeft, Medal, Image as ImageIcon, Search, 
  Settings, UserCircle, Type, Crown, Blocks, CalendarDays, Users, BrainCircuit,
  CalendarCheck, Clock, ArrowLeft, FileText, CheckSquare, Edit3, Bookmark,
  TrendingUp, TrendingDown, Minus, GraduationCap, CalendarOff, Flag
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

// --- DATA HARI LIBUR NASIONAL (2026) ---
const HOLIDAYS = {
  "1-1": "Tahun Baru Masehi", "17-2": "Tahun Baru Imlek", "19-3": "Hari Raya Nyepi",
  "20-3": "Idul Fitri 1447H", "1-5": "Hari Buruh", "17-8": "Hari Kemerdekaan RI",
  "25-12": "Hari Raya Natal"
};

// --- FUNGSI IKON PINTAR (SMART ICON) ---
const getSubjectIcon = (subject) => {
  const s = subject.toLowerCase();
  if (s.includes('mtk') || s.includes('matematika')) return <Zap size={22} className="text-blue-500" />;
  if (s.includes('ipa') || s.includes('sains')) return <Rocket size={22} className="text-purple-500" />;
  if (s.includes('agama') || s.includes('pai')) return <BookOpen size={22} className="text-emerald-500" />;
  if (s.includes('olahraga') || s.includes('pjok')) return <Trophy size={22} className="text-orange-500" />;
  if (s.includes('seni') || s.includes('gambar')) return <Palette size={22} className="text-pink-500" />;
  if (s.includes('inggris') || s.includes('bahasa')) return <Languages size={22} className="text-indigo-500" />;
  return <Sparkles size={22} className="text-yellow-500" />;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('user');
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

  // --- JADWAL & PR STATE ---
  const [scheduleData, setScheduleData] = useState({ Senin: '', Selasa: '', Rabu: '', Kamis: '', Jumat: '' });
  const [homeworkData, setHomeworkData] = useState({}); 
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [currentHomeworkEdit, setCurrentHomeworkEdit] = useState(null);

  // --- DATA KELAS ---
  const [schoolSettings, setSchoolSettings] = useState({
    className: "", classDescription: "",
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
    avatar: 'super_boy', photoUrl: null, usePhoto: false, bannerUrl: null, useBanner: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LOGIKA: PERHITUNGAN PTS & RANK ---
  const calculatePTS = (friend) => (friend.stars || 0) * 5 + (friend.thanks || 0) * 3;
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
    return friends.filter(f => f.name.toLowerCase().includes(q) || (f.nickname && f.nickname.toLowerCase().includes(q)));
  }, [friends, searchQuery]);

  const rankedFriends = useMemo(() => [...friends].sort((a, b) => calculatePTS(b) - calculatePTS(a)), [friends]);

  // --- LOGIKA: AUTO SCROLL JADWAL ---
  useEffect(() => {
    if (activeTab === 'schedule') {
      setTimeout(() => {
        const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
        const element = document.getElementById(`mobile-day-${today}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.scrollBy(0, -100); 
        }
      }, 500);
    }
  }, [activeTab]);

  // --- FIREBASE EFFECTS ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else { await signInAnonymously(auth); }
      } catch (e) { console.error(e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
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
      if (!isAuthenticated) { setLoading(false); setSettingsLoading(false); }
      return;
    }
    setLoading(true); setSettingsLoading(true);

    const dataRef = collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME);
    const testimonyRef = collection(db, 'artifacts', appId, 'public', 'data', TESTIMONY_COLLECTION);
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', SETTINGS_COLLECTION, 'class_info');
    const scheduleRef = doc(db, 'artifacts', appId, 'public', 'data', SETTINGS_COLLECTION, 'schedule');

    const unsubData = onSnapshot(dataRef, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setFriends(fetched); setLoading(false);
    });

    const unsubTest = onSnapshot(testimonyRef, (snapshot) => {
      setAllTestimonies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSett = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) setSchoolSettings(prev => ({ ...prev, ...snapshot.data() }));
      setSettingsLoading(false);
    });

    const unsubSch = onSnapshot(scheduleRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setScheduleData({ Senin: data.Senin, Selasa: data.Selasa, Rabu: data.Rabu, Kamis: data.Kamis, Jumat: data.Jumat });
        setHomeworkData(data.homework || {});
      }
    });

    return () => { unsubData(); unsubTest(); unsubSett(); unsubSch(); };
  }, [user, isAuthenticated]);

  // --- HANDLERS (LOGIN, LOGOUT, SAVE) ---
  const handleLogin = (e) => {
    e.preventDefault();
    const input = accessCode.toLowerCase().trim();
    if (["ustazah", "ustadzah", "ustad"].includes(input)) setUserRole('admin');
    else if (["inka", "sd insan karima", "3a"].includes(input)) setUserRole('user');
    else if (["tamu", "view"].includes(input)) setUserRole('viewer');
    else { setLoginError(true); return; }
    setIsAuthenticated(true); setLoginError(false);
    sessionStorage.setItem('school_auth', 'true');
    sessionStorage.setItem('user_role', input.includes('ustad') ? 'admin' : input.includes('tamu') ? 'viewer' : 'user');
  };

  const handleLogout = () => {
    setIsAuthenticated(false); sessionStorage.clear(); setShowLogoutConfirm(false);
  };

  const handleConfirmSave = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const dataToSave = { ...formData, updatedAt: serverTimestamp() };
    try {
      if (isEditing && currentEditId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, currentEditId), dataToSave);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME), { 
          ...dataToSave, stars: 0, thanks: 0, createdAt: serverTimestamp(), creatorId: user.uid 
        });
      }
      resetForm(); setActiveTab('home');
    } catch (e) { alert("Gagal Simpan"); }
    finally { setIsSubmitting(false); setShowConfirmModal(false); }
  };

  const handleSaveScheduleText = async (e) => {
    e.preventDefault();
    try {
      const scheduleRef = doc(db, 'artifacts', appId, 'public', 'data', SETTINGS_COLLECTION, 'schedule');
      await setDoc(scheduleRef, { ...scheduleData, homework: homeworkData });
      setShowScheduleModal(false);
    } catch (e) { alert("Gagal"); }
  };

  const handleSaveHomework = async (e) => {
    e.preventDefault();
    const { day, index, topic, page, task } = currentHomeworkEdit;
    const updated = { ...homeworkData, [`${day}-${index}`]: { topic, page, task } };
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', SETTINGS_COLLECTION, 'schedule'), { homework: updated });
      setHomeworkData(updated); setShowHomeworkModal(false);
    } catch (e) { alert("Gagal"); }
  };

  const resetForm = () => {
    setFormData({ name: '', nickname: '', dream: '', hobby: '', food: '', message: '', avatar: 'super_boy', photoUrl: null, usePhoto: false, bannerUrl: null, useBanner: false });
    setIsEditing(false); setCurrentEditId(null);
  };

  // --- LOADING ---
  if (loading || settingsLoading) return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center">
      <div className="animate-bounce text-orange-500 mb-6"><Home size={80} /></div>
      <div className="bg-orange-500 text-white px-8 py-2 rounded-full font-black animate-pulse uppercase">Sabar ya...</div>
    </div>
  );

  // --- LOGIN PAGE ---
  if (!isAuthenticated) return (
    <div className="h-screen w-full bg-sky-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-10 right-10 text-yellow-400"><Sun size={80} className="fill-current" /></div>
        <div className="absolute bottom-0 w-full h-[25vh] bg-green-500 rounded-t-[100%] scale-x-125 translate-y-10"></div>
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white/90 backdrop-blur-md rounded-[30px] shadow-2xl p-8 border-4 border-orange-200 text-center">
          <div className="bg-white p-4 rounded-full border-4 border-orange-400 shadow-lg inline-block -mt-20 mb-4"><School size={32} className="text-orange-500" /></div>
          <h2 className="text-2xl font-black text-gray-800 mb-6 uppercase">Halo Kawan!</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Kode Rahasia..." 
              className={`w-full px-4 py-4 rounded-2xl border-2 ${loginError ? 'border-red-400' : 'border-gray-200'} text-center font-black tracking-widest outline-none`}
            />
            <button type="submit" className="w-full bg-orange-400 text-white font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(194,120,57)] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2 uppercase transition-all">
              Masuk Kelas <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-yellow-50 font-sans pb-24 md:pb-10 relative">
      {/* Bottom Nav Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-20 z-[100] md:hidden shadow-lg">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'home' ? 'bg-blue-50' : ''}`}><Home size={22} /></div>
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button onClick={() => setActiveTab('activity')} className={`flex flex-col items-center ${activeTab === 'activity' ? 'text-indigo-500' : 'text-gray-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'activity' ? 'bg-indigo-50' : ''}`}><Blocks size={22} /></div>
          <span className="text-[10px] font-bold uppercase">Activity</span>
        </button>
        <button onClick={() => setActiveTab('ranking')} className={`flex flex-col items-center ${activeTab === 'ranking' ? 'text-orange-500' : 'text-gray-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'ranking' ? 'bg-orange-50' : ''}`}><Trophy size={22} /></div>
          <span className="text-[10px] font-bold uppercase">Rank</span>
        </button>
        {userRole !== 'viewer' && (
          <button onClick={() => setActiveTab('form')} className={`flex flex-col items-center ${activeTab === 'form' ? 'text-pink-500' : 'text-gray-400'}`}>
            <div className={`p-2 rounded-xl ${activeTab === 'form' ? 'bg-pink-50' : ''}`}><Plus size={22} /></div>
            <span className="text-[10px] font-bold uppercase">Add</span>
          </button>
        )}
      </nav>

      {/* Header */}
      <header className="bg-gradient-to-br from-orange-400 via-orange-500 to-pink-500 text-white p-8 pb-16 shadow-lg rounded-b-[3rem] text-center relative overflow-hidden">
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          {userRole === 'admin' && <button onClick={() => setShowScheduleModal(true)} className="bg-white/20 p-3 rounded-full backdrop-blur-md"><CalendarDays size={20} /></button>}
          {userRole === 'admin' && <button onClick={() => setShowSettingsModal(true)} className="bg-white/20 p-3 rounded-full backdrop-blur-md"><Settings size={20} /></button>}
          <button onClick={() => setShowLogoutConfirm(true)} className="bg-white/20 p-3 rounded-full backdrop-blur-md"><LogOut size={20} /></button>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-1">{schoolSettings.className || 'Solahudin Al-Ayubi'}</h1>
          <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-6">{schoolSettings.classDescription || 'SD Insan Karima'}</p>
          <div className="flex justify-center gap-4 md:gap-12">
            {[schoolSettings.waliKelas, schoolSettings.asisten, schoolSettings.ketuaKelas].map((p, idx) => p && (
              <div key={idx} className="flex flex-col items-center">
                <img src={p.photoUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg object-cover" alt={p.role} />
                <span className="text-[10px] font-black mt-2 bg-black/20 px-2 py-0.5 rounded-full uppercase">{p.role}</span>
                <span className="font-bold text-xs mt-1 truncate max-w-[80px]">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 mt-8">
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredFriends.map(friend => (
              <div key={friend.id} className="bg-white rounded-3xl shadow-xl overflow-hidden border-b-8 border-blue-200">
                <div className="h-32 bg-gray-100 relative pattern-dots">
                  {friend.useBanner && friend.bannerUrl && <img src={friend.bannerUrl} className="w-full h-full object-cover" />}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
                      {friend.usePhoto && friend.photoUrl ? <img src={friend.photoUrl} className="w-full h-full object-cover" /> : <span className="text-4xl">{avatars[friend.avatar]?.emoji}</span>}
                    </div>
                  </div>
                </div>
                <div className="pt-12 pb-6 px-4 text-center">
                  <h3 className="font-black text-lg text-gray-800 uppercase">{friend.name}</h3>
                  <p className="text-xs text-blue-500 font-bold mb-4">"{friend.nickname}"</p>
                  <div className="bg-purple-50 p-3 rounded-2xl text-xs italic text-gray-600 mb-4">"{friend.message}"</div>
                  <div className="flex justify-center gap-4">
                    <button className="flex items-center gap-1.5 bg-yellow-50 text-yellow-600 px-4 py-2 rounded-full font-black border border-yellow-100"><Star size={18} /> {friend.stars}</button>
                    <button className="flex items-center gap-1.5 bg-green-50 text-green-600 px-4 py-2 rounded-full font-black border border-green-100"><HeartHandshake size={18} /> {friend.thanks}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- MODUL JADWAL PELAJARAN (NEW) --- */}
        {activeTab === 'schedule' && (
          <div className="max-w-6xl mx-auto pb-32 animate-fade-in px-4">
            <div className="flex items-center justify-between mb-10 mt-6">
              <button onClick={() => setActiveTab('activity')} className="p-3 rounded-2xl bg-white shadow-md border border-gray-100 text-gray-400 hover:text-indigo-500 transition-all"><ArrowLeft size={26} /></button>
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-black text-gray-800 uppercase flex items-center gap-3"><CalendarDays className="text-indigo-500" size={32} /> Jadwal Seru</h2>
                <div className="h-1.5 w-16 bg-indigo-500 rounded-full mx-auto mt-1"></div>
              </div>
              <div className="w-12 h-12"></div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid grid-cols-5 gap-6 h-[550px]">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((day) => {
                const isToday = new Date().toLocaleDateString('id-ID', { weekday: 'long' }) === day;
                const subs = scheduleData[day] ? scheduleData[day].split('\n') : [];
                return (
                  <div key={day} className={`relative flex flex-col rounded-[3rem] p-6 border-4 transition-all duration-700 ${isToday ? 'bg-indigo-600 border-indigo-200 shadow-2xl scale-105 z-10' : 'bg-white border-white shadow-xl hover:border-indigo-50'}`}>
                    {isToday && <div className="absolute top-4 right-4 bg-yellow-400 text-indigo-900 text-[10px] font-black px-3 py-1 rounded-full animate-bounce shadow-md">HARI INI</div>}
                    <h3 className={`text-2xl font-black text-center mb-8 ${isToday ? 'text-white' : 'text-gray-400'}`}>{day}</h3>
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                      {subs.map((sub, i) => {
                        const [title, teacher] = sub.split('|');
                        const hw = homeworkData[`${day}-${i}`];
                        return (
                          <div key={i} className={`p-4 rounded-[2rem] border transition-all ${isToday ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex flex-col items-center gap-2">
                              <div className="p-3 bg-white rounded-2xl shadow-sm">{getSubjectIcon(title)}</div>
                              <p className={`font-black text-xs uppercase text-center leading-tight ${isToday ? 'text-white' : 'text-gray-700'}`}>{title}</p>
                            </div>
                            {hw && (hw.topic || hw.task) && <div className="mt-3 bg-orange-500 text-white py-1 rounded-full text-[8px] font-black text-center animate-pulse">ADA PR!</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden space-y-8">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((day) => {
                const isToday = new Date().toLocaleDateString('id-ID', { weekday: 'long' }) === day;
                const subs = scheduleData[day] ? scheduleData[day].split('\n') : [];
                return (
                  <div key={day} id={`mobile-day-${day}`} className={`rounded-[2.5rem] border-4 transition-all ${isToday ? 'border-indigo-500 shadow-2xl' : 'border-gray-100 shadow-sm'}`}>
                    <div className={`px-8 py-5 flex justify-between items-center ${isToday ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <span className="font-black uppercase tracking-widest text-sm">{day}</span>
                      {isToday && <span className="text-[10px] font-black bg-white text-indigo-500 px-3 py-1 rounded-full">HARI INI</span>}
                    </div>
                    <div className="p-6 space-y-4 bg-white">
                      {subs.map((sub, i) => {
                        const [title, teacher] = sub.split('|');
                        const hw = homeworkData[`${day}-${i}`];
                        return (
                          <div key={i}>
                            <div className={`flex items-center gap-4 p-4 rounded-3xl border-2 ${isToday ? 'bg-indigo-50 border-indigo-50' : 'bg-gray-50 border-gray-50'}`}>
                              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">{getSubjectIcon(title)}</div>
                              <div className="flex-1">
                                <h4 className="font-black text-gray-800 text-sm uppercase">{title}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase italic">{teacher || '-'}</p>
                              </div>
                              {userRole === 'admin' && <button onClick={() => { setCurrentHomeworkEdit({ day, index: i, subject: title, ...hw }); setShowHomeworkModal(true); }} className="p-2 bg-indigo-500 text-white rounded-xl"><Edit3 size={16} /></button>}
                            </div>
                            {hw && (hw.topic || hw.task) && (
                              <div className="mt-2 mx-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white p-4 rounded-3xl border-2 border-white animate-soft-pulse">
                                <div className="flex justify-between items-center mb-1 text-[10px] font-black italic"><span>🚀 TANTANGAN PR!</span><span>{hw.page || ''}</span></div>
                                <p className="text-xs font-bold">{hw.topic || hw.task}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Page */}
        {activeTab === 'form' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-[3rem] shadow-xl border-4 border-pink-100">
            <h2 className="text-2xl font-black text-center text-gray-800 mb-8 uppercase tracking-widest">Tambah Data Teman</h2>
            <form onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.keys(avatars).map(key => (
                  <button key={key} type="button" onClick={() => setFormData({...formData, avatar: key})} className={`p-4 rounded-3xl border-4 transition-all flex flex-col items-center gap-2 ${formData.avatar === key ? 'border-pink-400 bg-pink-50 scale-105' : 'border-gray-50 hover:border-gray-100'}`}>
                    <span className="text-4xl">{avatars[key].emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter">{avatars[key].label}</span>
                  </button>
                ))}
              </div>
              <input required placeholder="Nama Lengkap..." value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-pink-300 outline-none font-bold" />
              <input placeholder="Nama Panggilan..." value={formData.nickname} onChange={(e) => setFormData({...formData, nickname: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-pink-300 outline-none font-bold" />
              <textarea placeholder="Pesan untuk teman-teman..." value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} rows={3} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-pink-300 outline-none font-bold resize-none" />
              <button type="submit" disabled={isSubmitting} className="w-full bg-pink-500 text-white font-black py-5 rounded-3xl shadow-[0_8px_0_rgb(190,24,93)] active:shadow-none active:translate-y-2 uppercase tracking-[0.2em] transition-all">Simpan Data</button>
            </form>
          </div>
        )}

        {/* Activity Landing */}
        {activeTab === 'activity' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <button onClick={() => setActiveTab('schedule')} className="bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-blue-200 hover:scale-105 transition-all flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6"><CalendarDays size={40} /></div>
              <h3 className="text-xl font-black text-gray-800 mb-2">JADWAL PELAJARAN</h3>
              <p className="text-xs font-bold text-gray-400 uppercase leading-relaxed">Jangan Sampai Salah Bawa Buku Ya!</p>
            </button>
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-gray-100 opacity-50 flex flex-col items-center text-center grayscale">
              <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mb-6"><Users size={40} /></div>
              <h3 className="text-xl font-black text-gray-400 mb-2 uppercase">Bagi Kelompok</h3>
              <p className="text-[10px] font-black text-gray-300">SEGERA HADIR</p>
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS (Confirm, Logout, Schedule, Homework) --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full text-center border-4 border-pink-200 animate-scale-up">
            <div className="bg-pink-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-pink-500" /></div>
            <h3 className="text-2xl font-black text-gray-800 mb-4">SUDAH YAKIN?</h3>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 font-black text-gray-400 uppercase">Cek Lagi</button>
              <button onClick={handleConfirmSave} className="flex-1 py-4 bg-pink-500 text-white rounded-2xl font-black uppercase shadow-lg shadow-pink-100">Ya, Simpan!</button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full text-center border-4 border-orange-200 animate-scale-up">
            <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><LogOut size={40} className="text-orange-500" /></div>
            <h3 className="text-2xl font-black text-gray-800 mb-4 uppercase">MAU KELUAR?</h3>
            <div className="flex gap-4">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 font-black text-gray-400 uppercase">Batal</button>
              <button onClick={handleLogout} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase shadow-lg">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Schedule Edit Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[500] bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800 uppercase">Edit Jadwal</h2>
              <button onClick={() => setShowScheduleModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSaveScheduleText} className="space-y-4">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(day => (
                <div key={day}>
                  <label className="text-xs font-black uppercase text-gray-400 ml-1">{day}</label>
                  <textarea value={scheduleData[day]} onChange={(e) => setScheduleData({...scheduleData, [day]: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-300 outline-none font-bold" rows={2} placeholder="Pelajaran | Nama Guru" />
                </div>
              ))}
              <button type="submit" className="w-full bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase">Simpan Jadwal</button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Homework Modal */}
      {showHomeworkModal && currentHomeworkEdit && (
        <div className="fixed inset-0 z-[600] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm">
            <h3 className="text-xl font-black mb-4 uppercase text-indigo-500">Input PR: {currentHomeworkEdit.subject}</h3>
            <div className="space-y-4">
              <input placeholder="Topik (Contoh: Perkalian)" value={currentHomeworkEdit.topic} onChange={(e) => setCurrentHomeworkEdit({...currentHomeworkEdit, topic: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
              <input placeholder="Halaman (Contoh: Hal 45)" value={currentHomeworkEdit.page} onChange={(e) => setCurrentHomeworkEdit({...currentHomeworkEdit, page: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
              <textarea placeholder="Tugas Tambahan..." value={currentHomeworkEdit.task} onChange={(e) => setCurrentHomeworkEdit({...currentHomeworkEdit, task: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" rows={3} />
              <button onClick={handleSaveHomework} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase">Simpan PR</button>
              <button onClick={() => setShowHomeworkModal(false)} className="w-full text-gray-400 font-bold">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Tambahkan CSS Khusus */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes soft-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.95; }
        }
        .animate-soft-pulse { animation: soft-pulse 2s infinite ease-in-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
