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
  Sun, Cloud, TreeDeciduous as Tree, Flower, Home, Trophy, Zap, ChevronRight, CornerUpLeft, Medal, Image as ImageIcon, Search, Settings, UserCircle, Type, Crown, Calendar
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
const LOG_COLLECTION = 'activity_log';

export default function App() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true); 
  const [activeTab, setActiveTab] = useState('home'); 
  const [rankFilter, setRankFilter] = useState('hari'); // 'hari', 'minggu', 'bulan', 'semua'
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

  // --- LOGIKA: WAKTU ---
  const getTimeRanges = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const dayOfWeek = now.getDay(); 
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToMonday).getTime();
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    return { startOfToday, startOfWeek, startOfMonth };
  };

  // --- LOGIKA: PERHITUNGAN PTS FILTERED ---
  const calculateFilteredPTS = (friendId, filter) => {
    const { startOfToday, startOfWeek, startOfMonth } = getTimeRanges();
    
    let filtered = activities.filter(log => log.friendId === friendId);
    
    if (filter === 'hari') {
      filtered = filtered.filter(log => (log.createdAt?.seconds * 1000) >= startOfToday);
    } else if (filter === 'minggu') {
      filtered = filtered.filter(log => (log.createdAt?.seconds * 1000) >= startOfWeek);
    } else if (filter === 'bulan') {
      filtered = filtered.filter(log => (log.createdAt?.seconds * 1000) >= startOfMonth);
    }
    // 'semua' tidak perlu filter waktu tambahan

    const stars = filtered.filter(log => log.type === 'star').length;
    const thanks = filtered.filter(log => log.type === 'thanks').length;
    
    return (stars * 5) + (thanks * 3);
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
    return [...friends]
      .map(f => ({ ...f, currentPTS: calculateFilteredPTS(f.id, rankFilter) }))
      .sort((a, b) => b.currentPTS - a.currentPTS);
  }, [friends, activities, rankFilter]);

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
    const logRef = collection(db, 'artifacts', appId, 'public', 'data', LOG_COLLECTION);
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', SETTINGS_COLLECTION, 'class_info');
    
    const unsubscribeData = onSnapshot(dataRef, (snapshot) => {
      setFriends(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubscribeLogs = onSnapshot(logRef, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeTestimonies = onSnapshot(testimonyRef, (snapshot) => {
      setAllTestimonies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSchoolSettings(prev => ({ ...prev, ...snapshot.data() }));
      }
      setSettingsLoading(false); 
    });

    return () => {
      unsubscribeData();
      unsubscribeLogs();
      unsubscribeTestimonies();
      unsubscribeSettings();
    };
  }, [user, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const input = accessCode.toLowerCase().trim();
    const userCodes = ["insan karima", "inka", "3a"];
    const adminCodes = ["ustazah", "ustadzah"]; 

    if (adminCodes.includes(input)) {
      setIsAuthenticated(true);
      setUserRole('admin'); 
      sessionStorage.setItem('school_auth', 'true');
      sessionStorage.setItem('user_role', 'admin');
    } else if (userCodes.includes(input)) {
      setIsAuthenticated(true);
      setUserRole('user'); 
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
    setShowLogoutConfirm(false);
  };

  const handleStar = async (friend) => {
    if (!user || userRole !== 'admin') {
      setRestrictedMessage({ show: true, text: 'Hanya guru yang bisa memberikan bintang' });
      setTimeout(() => setRestrictedMessage({ show: false, text: '' }), 2500);
      return;
    }
    
    try {
      const logRef = collection(db, 'artifacts', appId, 'public', 'data', LOG_COLLECTION);
      await addDoc(logRef, {
        friendId: friend.id,
        type: 'star',
        createdAt: serverTimestamp(),
        authorId: user.uid
      });
      
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, friend.id);
      await updateDoc(docRef, { stars: increment(1) });
      
      setStarMessage({ show: true, name: friend.nickname || friend.name });
      setTimeout(() => setStarMessage({ show: false, name: '' }), 2500);
    } catch (error) {
      console.error("Gagal memberikan bintang:", error);
    }
  };

  const handleThankYou = async (friend) => {
    if (!user) return;
    const storageKey = `thanked_${friend.id}_${new Date().toDateString()}`;
    if (localStorage.getItem(storageKey)) {
        setRestrictedMessage({ show: true, text: 'Kamu sudah berterima kasih hari ini!' });
        setTimeout(() => setRestrictedMessage({ show: false, text: '' }), 2500);
        return;
    }

    try {
      const logRef = collection(db, 'artifacts', appId, 'public', 'data', LOG_COLLECTION);
      await addDoc(logRef, {
        friendId: friend.id,
        type: 'thanks',
        createdAt: serverTimestamp(),
        authorId: user.uid
      });
      
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, friend.id);
      await updateDoc(docRef, { thanks: increment(1) });
      
      localStorage.setItem(storageKey, 'true');
      setThanksMessage({ show: true, name: friend.nickname || friend.name });
      setTimeout(() => setThanksMessage({ show: false, name: '' }), 2500);
    } catch (error) {
      console.error("Gagal berterima kasih:", error);
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
      setShowTestimonyModal(false);
    } catch (error) { console.error("Gagal menyimpan testimoni:", error); } 
    finally { setIsSavingTestimony(false); }
  };

  const handleConfirmSave = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      if (isEditing && currentEditId) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, currentEditId);
        await updateDoc(docRef, { ...formData, updatedAt: serverTimestamp() });
      } else {
        const dataRef = collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME);
        await addDoc(dataRef, { ...formData, stars: 0, thanks: 0, createdAt: serverTimestamp(), creatorId: user.uid });
      }
      resetForm();
      setActiveTab('home');
    } catch (error) { console.error("Gagal menyimpan:", error); } 
    finally { setIsSubmitting(false); setShowConfirmModal(false); }
  };

  const handleUpdateSchoolSettings = async (key, field, value) => {
    if (userRole !== 'admin') return;
    let updatedData = field ? { ...schoolSettings, [key]: { ...schoolSettings[key], [field]: value } } : { ...schoolSettings, [key]: value };
    setSchoolSettings(updatedData);
    try {
      const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', SETTINGS_COLLECTION, 'class_info');
      await setDoc(settingsRef, updatedData);
    } catch (error) { console.error("Gagal update:", error); }
  };

  const resetForm = () => {
    setFormData({ name: '', nickname: '', dream: '', hobby: '', food: '', message: '', avatar: 'super_boy', photoUrl: null, usePhoto: false, bannerUrl: null, useBanner: false });
    setIsEditing(false);
    setCurrentEditId(null);
  };

  const handleDelete = async (docId) => {
    if (!user || userRole !== 'admin') return;
    if (confirm("Hapus data teman ini?")) {
      try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, docId)); } 
      catch (error) { console.error("Gagal menghapus:", error); }
    }
  };

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

      {/* MODALS & MESSAGES */}
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
            <div className="relative mx-auto bg-red-50 w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-inner"><div className="animate-bounce"><AlertCircle size={64} className="text-red-500" /></div></div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">Pemberitahuan</h3>
            <p className="text-red-600 font-bold px-4">{restrictedMessage.text}</p>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-sm w-full text-center border-4 border-orange-200 animate-scale-up">
            <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><LogOut size={40} className="text-orange-500" /></div>
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
              <form onSubmit={handleSaveTestimony} className="space-y-3">
                <input required value={testimonyAuthor} onChange={(e) => setTestimonyAuthor(e.target.value)} placeholder="Nama Kamu..." className="w-full px-4 py-2 bg-purple-50 rounded-xl text-sm outline-none border border-purple-100 font-bold" maxLength={20} />
                <div className="flex gap-2">
                  <input required value={testimonyInput} onChange={(e) => setTestimonyInput(e.target.value)} placeholder="Tulis pesan..." className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-purple-400 transition" maxLength={80} />
                  <button type="submit" disabled={isSavingTestimony} className="bg-purple-500 text-white p-2 rounded-full shadow-md hover:bg-purple-600 transition"><Send size={18} /></button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-orange-400 text-white p-6 shadow-lg rounded-b-[40px] mb-8 relative text-center">
        <div className="absolute top-4 right-4 flex flex-col md:flex-row gap-3 z-50">
          <button onClick={() => setShowLogoutConfirm(true)} className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all border border-white/20"><LogOut size={22} /></button>
          {userRole === 'admin' && <button onClick={() => setShowSettingsModal(true)} className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all border border-white/20"><Settings size={22} /></button>}
        </div>
        <h1 className="text-2xl md:text-5xl font-extrabold mb-1 drop-shadow-md">{schoolSettings.className || 'Kelas Kita'}</h1>
        <p className="text-orange-100 text-[10px] md:text-sm font-bold uppercase tracking-widest mb-4">{schoolSettings.classDescription}</p>
        
        <div className="flex justify-center flex-wrap gap-4 md:gap-10 mb-4 px-2">
           {['waliKelas', 'asisten', 'ketuaKelas'].map((roleKey) => (
             <div key={roleKey} className="flex flex-col items-center">
                <div className="relative mb-2">
                  <img src={schoolSettings[roleKey]?.photoUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-md object-cover" alt={roleKey} />
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-white text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm whitespace-nowrap uppercase ${roleKey === 'waliKelas' ? 'bg-orange-500' : roleKey === 'asisten' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                    {roleKey === 'waliKelas' ? 'Wali Kelas' : roleKey === 'asisten' ? 'Asisten' : 'Ketua Kelas'}
                  </div>
                </div>
                <span className="font-bold text-[10px] md:text-sm mt-1">{schoolSettings[roleKey]?.name}</span>
             </div>
           ))}
        </div>

        <div className="hidden md:flex justify-center gap-2 mt-6">
          <button onClick={() => setActiveTab('home')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'home' ? 'bg-white text-orange-500 shadow-md' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>Home</button>
          <button onClick={() => setActiveTab('ranking')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'ranking' ? 'bg-white text-orange-500 shadow-md' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>Peringkat</button>
          {userRole !== 'viewer' && <button onClick={() => { setActiveTab('form'); resetForm(); }} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'form' ? 'bg-white text-orange-500 shadow-md' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>Tambah Biodata</button>}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4">
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="hidden md:flex justify-center mb-10">
              <div className="relative w-full max-w-2xl group">
                <Search size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama teman atau nama panggilan..." className="w-full pl-16 pr-8 py-5 rounded-[2rem] bg-white shadow-lg border-2 border-orange-100 outline-none focus:border-orange-400 transition-all font-bold text-lg text-gray-700" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="md:hidden flex flex-1 items-center bg-white rounded-xl shadow-sm border-2 border-orange-100 px-3 py-1.5 focus-within:border-orange-400 transition-all">
                  <Search size={18} className="text-orange-500 shrink-0" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari teman..." className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-700 ml-2" />
                </div>
                <button onClick={() => setIsMobileGrid(!isMobileGrid)} className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm text-sm font-bold text-blue-500 border-2 border-blue-100 shrink-0">
                  {isMobileGrid ? <List size={18} /> : <LayoutGrid size={18} />}
                  {isMobileGrid ? 'List' : 'Grid'}
                </button>
              </div>
            </div>
            
            <div className={`grid ${isMobileGrid ? 'grid-cols-2 gap-3 pb-8' : 'grid-cols-1 gap-8 pb-10'} md:grid-cols-2 lg:grid-cols-4 md:gap-8 md:pb-12`}>
              {filteredFriends.length === 0 ? (
                <div className="col-span-full py-20 text-center opacity-40"><AlertCircle size={48} className="mx-auto mb-2 text-gray-400" /><p className="font-bold">Data teman tidak ditemukan.</p></div>
              ) : (
                filteredFriends.map(friend => {
                  const av = avatars[friend.avatar] || avatars.super_boy;
                  const rankIndex = rankedFriends.findIndex(f => f.id === friend.id);
                  const rankNum = rankIndex + 1;
                  const ptsHariIni = calculateFilteredPTS(friend.id, 'hari');
                  const testimonyCount = allTestimonies.filter(t => t.friendId === friend.id).length;
                  const owner = user && user.uid === friend.creatorId;

                  return (
                    <div key={friend.id} className={`bg-white shadow-lg border-b-8 border-blue-200 flex flex-col hover:border-blue-400 transition-all ${isMobileGrid ? 'rounded-2xl' : 'rounded-3xl'}`}>
                      <div className={`${isMobileGrid ? 'h-24' : 'h-32 md:h-44'} relative`}>
                        <div className={`absolute inset-0 w-full h-full overflow-hidden ${isMobileGrid ? 'rounded-t-2xl' : 'rounded-t-3xl'}`}>
                           <div className={`absolute inset-0 w-full h-full transition-all duration-700 ${friend.useBanner ? '' : (friend.usePhoto ? 'bg-gray-100' : av.color)} ${!friend.useBanner && !friend.usePhoto ? 'pattern-dots' : ''}`} style={friend.useBanner ? { backgroundImage: `url(${friend.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} />
                           <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-2 z-10">
                           <h4 className={`font-black text-white text-center leading-tight [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)] ${isMobileGrid ? 'text-xs mt-1' : 'text-xl md:text-2xl mt-2'} flex items-center justify-center gap-2`}>
                             {friend.nickname || friend.name}
                             {(rankNum <= 3) && <Crown size={15} className={`fill-current ${rankNum === 1 ? 'text-yellow-300' : rankNum === 2 ? 'text-gray-200' : 'text-orange-300'}`} />}
                           </h4>
                        </div>
                        <div className="absolute top-2 left-2 bg-white/90 px-2.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 z-20 border-2 border-yellow-200 backdrop-blur-sm group">
                          <Zap size={16} className="text-yellow-500 fill-current animate-pulse" />
                          <span className="text-xs font-black text-yellow-700">{ptsHariIni} <span className="text-[9px] font-normal">PTS HARI INI</span></span>
                        </div>
                        {(owner || userRole === 'admin') && (
                          <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20">
                             <button onClick={() => { setFormData(friend); setIsEditing(true); setCurrentEditId(friend.id); setActiveTab('form'); }} className="bg-white/90 p-1.5 rounded-full text-blue-500 shadow-md hover:bg-blue-500 hover:text-white transition-all"><Pencil size={14} /></button>
                             {userRole === 'admin' && <button onClick={() => handleDelete(friend.id)} className="bg-white/90 p-1.5 rounded-full text-red-500 shadow-md hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14} /></button>}
                          </div>
                        )}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30">
                          <div className={`bg-white p-1 rounded-full shadow-xl ring-4 ring-white overflow-hidden flex items-center justify-center ${isMobileGrid ? 'w-14 h-14' : 'w-20 h-20 md:w-28 md:h-28'}`}>
                             {friend.usePhoto && friend.photoUrl ? <img src={friend.photoUrl} className="w-full h-full object-cover rounded-full" /> : <div className={`${av.color} w-full h-full rounded-full flex items-center justify-center text-xl ${isMobileGrid ? 'text-2xl' : 'text-3xl md:text-5xl'}`}>{av.emoji}</div>}
                          </div>
                        </div>
                      </div>

                      <div className={`${isMobileGrid ? 'pt-10 pb-4' : 'pt-16 pb-6'} px-4 text-center flex-1 flex flex-col items-center`}>
                         {!isMobileGrid && <p className="text-blue-500 font-black text-[10px] md:text-xs uppercase mb-4 tracking-[0.2em] mt-1 italic">"{friend.name}"</p>}
                         <div className={`w-full bg-purple-50 p-3 rounded-2xl mb-4 border border-purple-100 relative ${isMobileGrid ? 'mt-2' : ''}`}>
                            <MessageSquareQuote size={12} className="text-purple-300 absolute -top-1.5 -left-1.5 bg-white rounded-full p-0.5 shadow-sm" />
                            <p className={`text-gray-600 italic font-medium leading-relaxed ${isMobileGrid ? 'text-[10px] line-clamp-2' : 'text-xs'}`}>"{friend.message || 'Semangat terus ya teman-teman!'}"</p>
                         </div>
                         {!isMobileGrid && (
                            <div className="space-y-2 text-left bg-gray-50/80 p-5 rounded-[2rem] text-xs md:text-sm mb-4 w-full border border-gray-100 shadow-inner">
                               <p className="flex items-center gap-3"><Rocket size={16} className="text-blue-400 shrink-0" /> <span><b>Cita-cita:</b> {friend.dream || '-'}</span></p>
                               <p className="flex items-center gap-3"><Gamepad2 size={16} className="text-green-400 shrink-0" /> <span><b>Hobi:</b> {friend.hobby || '-'}</span></p>
                               <p className="flex items-center gap-3"><Utensils size={16} className="text-orange-400 shrink-0" /> <span><b>Makanan:</b> {friend.food || '-'}</span></p>
                            </div>
                         )}
                         <div className={`flex justify-center items-center w-full mt-auto ${isMobileGrid ? 'gap-2 pt-4' : 'gap-4 pt-6'}`}>
                           <button onClick={() => handleStar(friend)} className={`flex items-center justify-center gap-1.5 rounded-full border-2 transition-all px-4 py-2 ${userRole === 'admin' ? 'bg-white text-yellow-500 border-yellow-100 hover:bg-yellow-50' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}`}>
                             <Star size={isMobileGrid ? 14 : 18} className="fill-current" />
                             <span className="text-xs font-black">{friend.stars || 0}</span>
                           </button>
                           <button onClick={() => handleThankYou(friend)} className={`flex items-center justify-center gap-1.5 rounded-full border-2 transition-all px-4 py-2 bg-white text-green-500 border-green-100 hover:bg-green-50 shadow-sm`}><HeartHandshake size={isMobileGrid ? 14 : 18} /><span className="text-xs font-black">{friend.thanks || 0}</span></button>
                           <button onClick={() => { setSelectedFriend(friend); setShowTestimonyModal(true); }} className={`flex items-center justify-center gap-1.5 rounded-full border-2 transition-all px-4 py-2 bg-white text-purple-500 border-purple-100 hover:bg-purple-50 shadow-sm`}><MessageSquare size={isMobileGrid ? 14 : 18} /><span className="text-xs font-black">{testimonyCount}</span></button>
                         </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="min-h-[80vh] pattern-elegant py-10 rounded-[3rem] shadow-inner mb-10 overflow-hidden">
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in px-4">
                <div className="text-center mb-8">
                  <div className="bg-orange-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-orange-600 shadow-lg border-2 border-white"><Trophy size={32} /></div>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-800 text-center uppercase tracking-tight">Peringkat Kelas</h3>
                  <p className="text-gray-500 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mt-2 text-center opacity-70">Siswa Teladan dengan Poin Tertinggi</p>

                  <div className="mt-8 flex justify-center gap-2 md:gap-4 overflow-x-auto py-2 no-scrollbar">
                    {[
                      { id: 'hari', label: 'Hari Ini', icon: Sun },
                      { id: 'minggu', label: 'Minggu Ini', icon: Calendar },
                      { id: 'bulan', label: 'Bulan Ini', icon: Sparkles },
                      { id: 'semua', label: 'Semua Waktu', icon: Trophy }
                    ].map((tab) => (
                      <button 
                        key={tab.id}
                        onClick={() => setRankFilter(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all shadow-sm shrink-0 border-2 ${rankFilter === tab.id ? 'bg-orange-500 text-white border-orange-400 scale-105 shadow-orange-200' : 'bg-white text-gray-400 border-white hover:border-orange-200'}`}
                      >
                        <tab.icon size={16} />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-12">
                  {rankedFriends.length > 0 ? (
                    <>
                      <div className="flex items-end justify-center gap-2 md:gap-8 mb-16 pt-12 md:pt-20">
                        {/* Juara 2 */}
                        {rankedFriends[1] && (
                          <div className="flex flex-col items-center w-1/3 md:w-64">
                            <div className="relative mb-3 md:mb-6">
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-gray-300 z-20"><Crown size={28} className="fill-current" /></div>
                              <div className="w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-gray-300 shadow-lg bg-white ring-4 ring-gray-50">
                                {rankedFriends[1].usePhoto && rankedFriends[1].photoUrl ? <img src={rankedFriends[1].photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl md:text-5xl">{avatars[rankedFriends[1].avatar]?.emoji}</div>}
                              </div>
                              <div className="absolute -top-2 -right-1 md:-top-3 md:-right-3 bg-gray-300 text-white w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-[10px] md:text-lg border-2 border-white shadow-sm">2</div>
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm p-3 md:p-6 rounded-t-3xl border-t-4 border-x-4 border-gray-200 w-full text-center flex flex-col items-center">
                              <p className="text-[10px] md:text-sm font-black text-gray-800 text-center truncate w-full mb-1 uppercase tracking-tight">{rankedFriends[1].nickname || rankedFriends[1].name}</p>
                              <div className="bg-gray-100 px-3 py-1 rounded-full text-[9px] md:text-xs font-black text-gray-500 shadow-inner flex items-center gap-1">
                                 <Zap size={10} className="fill-current" />
                                 {rankedFriends[1].currentPTS} <span className="text-[8px] opacity-60">PTS</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Juara 1 */}
                        {rankedFriends[0] && (
                          <div className="flex flex-col items-center w-2/5 md:w-80 z-10">
                            <div className="relative mb-4 md:mb-8">
                              <div className="absolute -top-10 md:-top-16 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce"><Crown size={40} className="md:w-16 md:h-16 fill-current" /></div>
                              <div className="w-24 h-24 md:w-44 md:h-44 rounded-full overflow-hidden border-4 md:border-8 border-yellow-400 shadow-2xl bg-white ring-4 md:ring-8 ring-yellow-50">
                                {rankedFriends[0].usePhoto && rankedFriends[0].photoUrl ? <img src={rankedFriends[0].photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl md:text-7xl">{avatars[rankedFriends[0].avatar]?.emoji}</div>}
                              </div>
                              <div className="absolute -top-2 -right-1 md:-top-4 md:-right-4 bg-yellow-400 text-white w-8 h-8 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-sm md:text-2xl border-2 border-white shadow-md">1</div>
                            </div>
                            <div className="bg-white p-4 md:p-8 rounded-t-[2.5rem] border-t-8 border-x-8 border-yellow-100 w-full text-center flex flex-col items-center relative">
                              <p className="text-xs md:text-lg font-black text-gray-800 text-center truncate w-full mb-1 uppercase tracking-tighter">{rankedFriends[0].nickname || rankedFriends[0].name}</p>
                              <div className="bg-yellow-400 px-4 py-1.5 md:px-6 md:py-2 rounded-full text-[10px] md:text-sm font-black text-white shadow-lg flex items-center gap-1.5 scale-110">
                                 <Zap size={14} className="fill-current" />
                                 {rankedFriends[0].currentPTS} <span className="text-[9px] opacity-80">PTS</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Juara 3 */}
                        {rankedFriends[2] && (
                          <div className="flex flex-col items-center w-1/3 md:w-64">
                            <div className="relative mb-3 md:mb-6">
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-orange-400 z-20"><Crown size={28} className="fill-current" /></div>
                              <div className="w-16 h-16 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-orange-300 shadow-lg bg-white ring-4 ring-orange-50">
                                {rankedFriends[2].usePhoto && rankedFriends[2].photoUrl ? <img src={rankedFriends[2].photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xl md:text-5xl">{avatars[rankedFriends[2].avatar]?.emoji}</div>}
                              </div>
                              <div className="absolute -top-2 -right-1 md:-top-3 md:-right-3 bg-orange-400 text-white w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-[10px] md:text-lg border-2 border-white shadow-sm">3</div>
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm p-3 md:p-6 rounded-t-3xl border-t-4 border-x-4 border-orange-100 w-full text-center flex flex-col items-center">
                              <p className="text-[10px] md:text-sm font-black text-gray-800 text-center truncate w-full mb-1 uppercase tracking-tight">{rankedFriends[2].nickname || rankedFriends[2].name}</p>
                              <div className="bg-orange-50 px-3 py-1 rounded-full text-[9px] md:text-xs font-black text-orange-600 shadow-inner flex items-center gap-1">
                                 <Zap size={10} className="fill-current" />
                                 {rankedFriends[2].currentPTS} <span className="text-[8px] opacity-60">PTS</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="max-w-4xl mx-auto space-y-3 pb-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {rankedFriends.slice(3, 15).map((friend, index) => {
                            const actualRank = index + 4;
                            return (
                              <div key={friend.id} className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 md:p-4 flex items-center shadow-sm border border-orange-50 hover:border-orange-200 transition-all group">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-xs md:text-sm text-gray-400 mr-3 shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-all">{actualRank}</div>
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white shadow-sm mr-3 shrink-0">
                                   {friend.usePhoto && friend.photoUrl ? <img src={friend.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-lg md:text-2xl">{avatars[friend.avatar]?.emoji}</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-gray-800 text-xs md:text-sm truncate uppercase tracking-tight group-hover:text-orange-600 transition-colors">{friend.nickname || friend.name}</p>
                                </div>
                                <div className="bg-blue-50 px-3 py-1 md:px-4 md:py-2 rounded-full flex items-center gap-1.5 shrink-0 ml-2 shadow-sm border border-blue-100">
                                   <Zap size={14} className="text-blue-500 fill-current" />
                                   <span className="text-[10px] md:text-xs font-black text-blue-600">{friend.currentPTS} <span className="opacity-50 font-bold uppercase">PTS</span></span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-10 text-center text-gray-300 italic font-bold">Belum ada peringkat untuk kategori ini...</div>
                  )}
                </div>
            </div>
          </div>
        )}

        {/* FORM BIODATA (Unchanged Logic, Visual Consistent) */}
        {activeTab === 'form' && userRole !== 'viewer' && (
          <div className="space-y-8 max-w-2xl mx-auto pb-10">
            <div className="bg-white rounded-[2.5rem] shadow-xl p-6 md:p-10 border-2 border-pink-100 animate-scale-up relative">
              <h2 className="text-xl md:text-3xl font-black text-pink-600 mb-8 text-center">{isEditing ? '✏️ Update Biodata' : '✏️ Yuk Isi Biodatamu!'}</h2>
              <form onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-1.5 text-left"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Nama Lengkap</label><input required name="name" value={formData.name} onChange={handleInputChange} placeholder="Ketik nama lengkap..." className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 outline-none focus:border-pink-400 font-bold shadow-sm" /></div>
                   <div className="space-y-1.5 text-left"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Nama Panggilan</label><input name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder="Nama panggilan..." className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 outline-none focus:border-pink-400 font-bold shadow-sm" /></div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-pink-400 ml-1">Pilih Avatar atau Foto Profil:</label>
                  <div className="bg-gray-50 p-5 rounded-[2rem] border-2 border-gray-100 text-center">
                    <div className="flex justify-center gap-3 mb-5">
                      <button type="button" onClick={() => setFormData(p => ({ ...p, usePhoto: false }))} className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${!formData.usePhoto ? 'bg-pink-500 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>Pakai Avatar</button>
                      <button type="button" onClick={() => setFormData(p => ({ ...p, usePhoto: true }))} className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${formData.usePhoto ? 'bg-pink-500 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>Upload Foto</button>
                    </div>
                    {formData.usePhoto ? (
                      <div className="relative inline-block mt-2">
                        {formData.photoUrl ? (
                          <div className="relative"><img src={formData.photoUrl} className="w-28 h-28 object-cover rounded-full border-4 border-pink-400" /><button type="button" onClick={() => setFormData(p => ({ ...p, photoUrl: null }))} className="absolute -top-1 -right-1 bg-red-500 text-white p-2 rounded-full shadow-lg"><X size={16} /></button></div>
                        ) : (
                          <div className="border-2 border-dashed border-pink-200 rounded-3xl p-10 bg-pink-50 cursor-pointer relative hover:bg-pink-100 group"><input type="file" accept="image/*" onChange={(e) => processFile(e.target.files[0], 400, (url) => setFormData(p => ({ ...p, photoUrl: url, usePhoto: true })))} className="absolute inset-0 opacity-0 cursor-pointer" /><Upload size={32} className="text-pink-400 mx-auto group-hover:scale-110 transition-transform" /></div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3 max-w-full mx-auto">
                        {Object.entries(avatars).map(([key, data]) => (
                          <button key={key} type="button" onClick={() => setFormData(p => ({ ...p, avatar: key }))} className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all ${formData.avatar === key ? 'border-pink-400 bg-pink-50' : 'border-transparent bg-white'}`}><div className={`${data.color} w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full text-xl shadow-inner`}>{data.emoji}</div></button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-left"><label className="text-[10px] font-black uppercase text-purple-400 ml-1">Pesan Semangat:</label><textarea required name="message" value={formData.message} onChange={handleInputChange} placeholder="Tulis kata-kata semangat untuk teman sekelas..." rows="3" className="w-full px-6 py-5 rounded-3xl border-2 border-gray-100 outline-none focus:border-purple-400 font-bold shadow-sm transition-all resize-none" /></div>

                <div className="flex flex-col gap-4 pt-6">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-pink-500 text-white font-black py-5 rounded-3xl shadow-[0_8px_0_rgb(190,24,93)] active:shadow-none active:translate-y-1 transition-all uppercase tracking-widest text-lg">{isSubmitting ? 'Menyimpan...' : 'Simpan Biodata'}</button>
                  <button type="button" onClick={() => { resetForm(); setActiveTab('home'); }} className="w-full bg-white text-gray-400 border-2 border-gray-100 font-black py-4 rounded-3xl uppercase tracking-widest text-xs">Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* CONFIRM MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-sm px-4 w-full text-center border-4 border-pink-200">
            <div className="bg-pink-50 p-3 rounded-full inline-block mb-4"><CheckCircle size={40} className="text-pink-500 mx-auto" /></div>
            <h3 className="text-2xl font-bold mb-2">Sudah Yakin?</h3>
            <p className="text-gray-500 mb-6 font-medium">Pastikan datanya sudah benar ya.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowConfirmModal(false)} className="px-6 py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-400 transition">Cek Lagi</button>
              <button onClick={handleConfirmSave} className="px-6 py-2 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 shadow-lg transform active:scale-95 transition">Ya, Simpan!</button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border-4 border-orange-200 p-6 md:p-10 animate-scale-up">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">Pengaturan Kelas</h2>
                 <button onClick={() => setShowSettingsModal(false)} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-1">Nama Kelas:</label><input value={schoolSettings.className} onChange={(e) => handleUpdateSchoolSettings('className', null, e.target.value)} className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 outline-none focus:border-orange-300 font-bold" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-1">Deskripsi:</label><input value={schoolSettings.classDescription} onChange={(e) => handleUpdateSchoolSettings('classDescription', null, e.target.value)} className="w-full px-5 py-3 rounded-2xl border-2 border-gray-100 outline-none focus:border-orange-300 font-bold" /></div>
                </div>
                {['waliKelas', 'asisten', 'ketuaKelas'].map((roleKey) => (
                  <div key={roleKey} className="bg-gray-50 p-5 rounded-[2rem] border-2 border-white relative pt-8">
                    <div className="absolute -top-3 left-6 bg-orange-400 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">{roleKey}</div>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                       <div className="relative group shrink-0">
                          <img src={schoolSettings[roleKey]?.photoUrl} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" alt={roleKey} />
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"><Camera size={16} /><input type="file" accept="image/*" onChange={(e) => processFile(e.target.files[0], 400, (url) => handleUpdateSchoolSettings(roleKey, 'photoUrl', url))} className="hidden" /></label>
                       </div>
                       <input value={schoolSettings[roleKey]?.name} onChange={(e) => handleUpdateSchoolSettings(roleKey, 'name', e.target.value)} placeholder={`Nama ${roleKey}...`} className="w-full px-5 py-3 rounded-2xl border-2 border-white outline-none focus:border-orange-300 font-bold shadow-sm" />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="w-full mt-8 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-orange-600 transition-all">Selesai</button>
           </div>
        </div>
      )}

      <footer className="text-center mt-12 mb-28 opacity-50 text-[10px] md:text-xs tracking-widest uppercase font-black px-4 leading-relaxed">{schoolSettings.className || 'Kelas Kita'} — SD Insan Karima<br/>Dibuat oleh Hiro dan Abinya — 2026</footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes shake-hand { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-shake-hand { animation: shake-hand 0.6s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        .pattern-dots { background-image: radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px); background-size: 15px 15px; }
        .pattern-elegant {
          background-color: #fffbeb;
          background-image: radial-gradient(#fde68a 0.75px, transparent 0.75px), radial-gradient(#fde68a 0.75px, #fffbeb 0.75px);
          background-size: 30px 30px;
          background-position: 0 0, 15px 15px;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        body { -webkit-tap-highlight-color: transparent; scroll-behavior: smooth; }
      `}} />
    </div>
  );
}
