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
  query
} from 'firebase/firestore';
import { 
  User, Star, Heart, Smile, Trash2, Plus, BookOpen, Gamepad2, 
  Utensils, Rocket, Palette, Music, Camera, Upload, X, 
  Lock, Key, School, ArrowRight, CheckCircle, AlertCircle, 
  LayoutGrid, List, Pencil, RotateCcw, LogOut, HeartHandshake,
  MessageSquareQuote, Languages, Sparkles, MessageSquare, Send,
  Sun, Cloud, TreeDeciduous as Tree, Flower, Home, Trophy, Zap, 
  ChevronRight, CornerUpLeft, Medal, Image as ImageIcon, Search, Settings, Share2
} from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "",
  authDomain: "a-inka.firebaseapp.com",
  projectId: "a-inka",
  storageBucket: "a-inka.firebasestorage.app",
  messagingSenderId: "554090824336",
  appId: "1:554090824336:web:18902f6b1264965f808e15"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'kelas6a_biodata_v2';

// Collections
const COLLECTION_NAME = 'biodata';
const TESTIMONY_COLLECTION = 'testimonies';
const SETTINGS_COLLECTION = 'settings';

// --- ASSETS & CONSTANTS ---
const AVATARS = {
  super_boy: { emoji: '🦸‍♂️', color: 'bg-blue-100', label: 'Super Boy' },
  super_girl: { emoji: '🦸‍♀️', color: 'bg-pink-100', label: 'Super Girl' },
  ninja: { emoji: '🥷', color: 'bg-gray-800 text-white', label: 'Ninja' },
  robot: { emoji: '🤖', color: 'bg-red-100', label: 'Cyborg' },
  spider: { emoji: '🕷️', color: 'bg-red-50', label: 'Spidey' },
  bat: { emoji: '🦇', color: 'bg-gray-200', label: 'Bat Hero' },
  alien: { emoji: '👽', color: 'bg-green-100', label: 'Alien' },
  wizard: { emoji: '🧙‍♂️', color: 'bg-purple-100', label: 'Penyihir' },
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMobileGrid, setIsMobileGrid] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [feedback, setFeedback] = useState({ show: false, type: '', name: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showTestimonyModal, setShowTestimonyModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [testimonyInput, setTestimonyInput] = useState('');
  const [testimonyAuthor, setTestimonyAuthor] = useState(''); 
  const [allTestimonies, setAllTestimonies] = useState([]);
  const [isSavingTestimony, setIsSavingTestimony] = useState(false);
  const [teacherData, setTeacherData] = useState({
    waliKelas: { name: "Ustazah Najwa", photoUrl: "https://raw.githubusercontent.com/deddhaz/library/refs/heads/main/ust1.jpeg" },
    asisten: { name: "Ustazah Dea", photoUrl: "https://raw.githubusercontent.com/deddhaz/library/refs/heads/main/ust2.jpeg" }
  });

  const [formData, setFormData] = useState({
    name: '', nickname: '', dream: '', hobby: '', food: '', message: '',
    avatar: 'super_boy', photoUrl: null, usePhoto: false,
    bannerUrl: null, useBanner: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LOGIC: PTS CALCULATION ---
  const calculatePTS = (friend) => (friend.stars || 0) * 5 + (friend.thanks || 0) * 3;

  const filteredFriends = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return friends;
    return friends.filter(f => 
      f.name.toLowerCase().includes(query) || 
      (f.nickname && f.nickname.toLowerCase().includes(query))
    );
  }, [friends, searchQuery]);

  const rankedFriends = useMemo(() => {
    return [...friends].sort((a, b) => calculatePTS(b) - calculatePTS(a));
  }, [friends]);

  // --- FIREBASE EFFECTS ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth error", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);

    const sessionAuth = sessionStorage.getItem('school_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
      setUserRole(sessionStorage.getItem('user_role') || 'user');
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
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', SETTINGS_COLLECTION, 'teacher_info');

    const unsubData = onSnapshot(dataRef, (snap) => {
      setFriends(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)));
      setLoading(false);
    }, (err) => console.error("Data load error", err));

    const unsubTest = onSnapshot(testimonyRef, (snap) => {
      setAllTestimonies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) setTeacherData(snap.data());
    });

    return () => { unsubData(); unsubTest(); unsubSettings(); };
  }, [user, isAuthenticated]);

  // --- HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    const input = accessCode.toLowerCase().trim();
    const adminCodes = ["ustazah", "ustadzah", "ustadz", "ustad"];
    const userCodes = ["insan karima", "inka", "6a", "solahudin"];

    if (adminCodes.includes(input)) {
      setAuthStatus(true, 'admin');
    } else if (userCodes.includes(input)) {
      setAuthStatus(true, 'user');
    } else {
      setLoginError(true);
    }
  };

  const setAuthStatus = (status, role) => {
    setIsAuthenticated(status);
    setUserRole(role);
    sessionStorage.setItem('school_auth', status);
    sessionStorage.setItem('user_role', role);
  };

  const handleLogout = () => {
    setAuthStatus(false, 'user');
    setAccessCode('');
  };

  const processFile = (file, maxSize, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
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
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const showFeedback = (type, name) => {
    setFeedback({ show: true, type, name });
    setTimeout(() => setFeedback({ show: false, type: '', name: '' }), 2500);
  };

  const handleStar = async (friend) => {
    if (userRole !== 'admin') return showFeedback('restricted', '');
    const key = `starred_${friend.id}`;
    const isStarred = localStorage.getItem(key);
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, friend.id);
    await updateDoc(docRef, { stars: increment(isStarred ? -1 : 1) });
    isStarred ? localStorage.removeItem(key) : localStorage.setItem(key, 'true');
    if (!isStarred) showFeedback('star', friend.nickname || friend.name);
  };

  const handleThankYou = async (friend) => {
    const key = `thanked_${friend.id}`;
    const isThanked = localStorage.getItem(key);
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, friend.id);
    await updateDoc(docRef, { thanks: increment(isThanked ? -1 : 1) });
    isThanked ? localStorage.removeItem(key) : localStorage.setItem(key, 'true');
    if (!isThanked) showFeedback('thanks', friend.nickname || friend.name);
  };

  const handleShare = (friend) => {
    const text = `Cek profil ${friend.name} di Biodata Kelas 6A! Cita-cita: ${friend.dream || '-'}`;
    document.execCommand('copy'); // Fallback trigger
    if (navigator.share) {
      navigator.share({ title: 'Biodata Kelas 6A', text, url: window.location.href });
    } else {
      showFeedback('shared', friend.name);
    }
  };

  const handleSaveDoc = async () => {
    if (!user) return;
    setIsSubmitting(true);
    const payload = { ...formData, updatedAt: serverTimestamp() };
    try {
      if (isEditing && currentEditId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME, currentEditId), payload);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_NAME), {
          ...payload, stars: 0, thanks: 0, createdAt: serverTimestamp(), creatorId: user.uid
        });
      }
      resetForm();
      setActiveTab('home');
    } catch (err) { console.error("Save error", err); }
    finally { setIsSubmitting(false); setShowConfirmModal(false); }
  };

  const resetForm = () => {
    setFormData({ name: '', nickname: '', dream: '', hobby: '', food: '', message: '', avatar: 'super_boy', photoUrl: null, usePhoto: false, bannerUrl: null, useBanner: false });
    setIsEditing(false);
    setCurrentEditId(null);
  };

  // --- UI COMPONENTS ---
  if (!isAuthenticated) return (
    <div className="h-screen w-full bg-sky-200 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-10 right-10 text-yellow-400 animate-pulse"><Sun size={100} className="fill-current" /></div>
        <div className="absolute bottom-0 w-full h-[20vh] bg-green-500 rounded-t-[100%] scale-x-150 transform translate-y-10"></div>
      </div>
      <div className="relative z-10 w-full max-w-sm bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl p-8 border-4 border-orange-300">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-orange-400 p-4 rounded-full text-white shadow-lg mb-4"><School size={40} /></div>
          <h2 className="text-3xl font-black text-gray-800">Assalamualaikum!</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Kelas 6A SD Insan Karima</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Kode Rahasia..." className={`w-full px-4 py-4 rounded-2xl border-2 ${loginError ? 'border-red-400 bg-red-50' : 'border-gray-200'} text-center font-black tracking-widest focus:outline-none transition-all`} />
          <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-[0_6px_0_#c2410c] active:shadow-none active:translate-y-1 transition-all uppercase flex items-center justify-center gap-2">Masuk Kelas <ArrowRight size={20} /></button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-yellow-50 font-sans pb-28 md:pb-10">
      {/* Feedback Modals */}
      {feedback.show && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-xs w-full text-center border-4 border-orange-200 animate-scale-up">
            {feedback.type === 'star' && <Star size={60} className="text-yellow-500 fill-current mx-auto mb-4 animate-bounce" />}
            {feedback.type === 'thanks' && <HeartHandshake size={60} className="text-green-500 mx-auto mb-4 animate-shake" />}
            {feedback.type === 'restricted' && <AlertCircle size={60} className="text-red-500 mx-auto mb-4 animate-pulse" />}
            {feedback.type === 'shared' && <Share2 size={60} className="text-blue-500 mx-auto mb-4 animate-pulse" />}
            <h3 className="text-xl font-black text-gray-800">{feedback.type === 'restricted' ? 'Akses Terbatas' : 'Berhasil!'}</h3>
            <p className="text-sm text-gray-500 mt-2">
              {feedback.type === 'star' ? `Bintang untuk ${feedback.name} terkirim!` : 
               feedback.type === 'thanks' ? `Terima kasih untuk ${feedback.name}!` : 
               feedback.type === 'shared' ? `Link profil ${feedback.name} disalin!` :
               'Hanya guru yang bisa memberi bintang.'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-orange-400 text-white p-8 pt-12 rounded-b-[60px] shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-4 right-4 flex gap-2">
          {userRole === 'admin' && <button onClick={() => setShowSettingsModal(true)} className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all"><Settings size={22} /></button>}
          <button onClick={handleLogout} className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all"><LogOut size={22} /></button>
        </div>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">Solahudin Al-Ayubi</h1>
          <p className="text-orange-100 font-bold uppercase tracking-widest text-sm mb-8">Keluarga Besar Kelas 6A</p>
          <div className="flex justify-center gap-10">
            {Object.entries(teacherData).map(([key, t]) => (
              <div key={key} className="flex flex-col items-center group">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white overflow-hidden shadow-lg group-hover:scale-105 transition-transform mb-2">
                  <img src={t.photoUrl} className="w-full h-full object-cover" alt={t.name} />
                </div>
                <span className="text-xs md:text-sm font-black">{t.name}</span>
                <span className="text-[10px] opacity-70 uppercase font-bold tracking-tighter">{key === 'waliKelas' ? 'Wali Kelas' : 'Asisten'}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Navigation (Desktop) */}
      <nav className="hidden md:flex justify-center gap-4 my-8">
        {['home', 'ranking', 'form'].map(t => (
          <button key={t} onClick={() => { setActiveTab(t); if(t==='form') resetForm(); }} className={`px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all ${activeTab === t ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-orange-500 hover:bg-orange-50'}`}>
            {t === 'home' ? 'Galeri' : t === 'ranking' ? 'Peringkat' : 'Isi Biodata'}
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* TAB: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari teman..." className="w-full pl-12 pr-4 py-4 rounded-3xl bg-white shadow-sm border-2 border-orange-100 focus:border-orange-400 outline-none font-bold" />
              </div>
              <button onClick={() => setIsMobileGrid(!isMobileGrid)} className="px-6 py-4 bg-white rounded-3xl border-2 border-orange-100 text-orange-500 font-black flex items-center gap-2 shadow-sm">
                {isMobileGrid ? <List size={20} /> : <LayoutGrid size={20} />} {isMobileGrid ? 'Mode List' : 'Mode Kotak'}
              </button>
            </div>

            <div className={`grid gap-6 ${isMobileGrid ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
              {filteredFriends.map(friend => {
                const pts = calculatePTS(friend);
                const av = AVATARS[friend.avatar] || AVATARS.super_boy;
                const isS = localStorage.getItem(`starred_${friend.id}`);
                const isT = localStorage.getItem(`thanked_${friend.id}`);
                
                return (
                  <div key={friend.id} className="bg-white rounded-[40px] shadow-lg border-b-8 border-orange-200 overflow-hidden group hover:scale-[1.02] transition-all">
                    <div className="h-32 relative">
                      <div className={`absolute inset-0 ${friend.useBanner ? '' : av.color} opacity-80`} style={friend.useBanner ? { backgroundImage: `url(${friend.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <div className="bg-white/90 px-3 py-1 rounded-full text-[10px] font-black text-orange-600 shadow-sm flex items-center gap-1"><Medal size={12} /> {pts} PTS</div>
                      </div>
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                        {friend.usePhoto ? <img src={friend.photoUrl} className="w-full h-full object-cover" /> : <div className={`w-full h-full ${av.color} flex items-center justify-center text-4xl`}>{av.emoji}</div>}
                      </div>
                    </div>
                    <div className="pt-12 pb-6 px-6 text-center space-y-4">
                      <div>
                        <h3 className="font-black text-gray-800 text-lg leading-tight">{friend.name}</h3>
                        <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mt-1">"{friend.nickname || friend.name}"</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-3xl text-left text-xs space-y-2 border border-orange-100">
                        <p className="flex items-center gap-2"><Rocket size={14} className="text-blue-400" /> <b>Cita-cita:</b> {friend.dream || '-'}</p>
                        <p className="flex items-center gap-2"><Gamepad2 size={14} className="text-green-400" /> <b>Hobi:</b> {friend.hobby || '-'}</p>
                      </div>
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleStar(friend)} className={`p-3 rounded-2xl border-2 transition-all ${isS ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-white text-gray-400 border-gray-100'}`}><Star size={18} className={isS ? 'fill-current' : ''} /></button>
                        <button onClick={() => handleThankYou(friend)} className={`p-3 rounded-2xl border-2 transition-all ${isT ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-400 border-gray-100'}`}><HeartHandshake size={18} /></button>
                        <button onClick={() => { setSelectedFriend(friend); setShowTestimonyModal(true); }} className="p-3 bg-purple-500 text-white rounded-2xl shadow-md"><MessageSquare size={18} /></button>
                        <button onClick={() => handleShare(friend)} className="p-3 bg-blue-500 text-white rounded-2xl shadow-md"><Share2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: RANKING */}
        {activeTab === 'ranking' && (
          <div className="max-w-2xl mx-auto animate-fade-in space-y-8">
            <div className="text-center">
              <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500 shadow-inner"><Trophy size={40} /></div>
              <h2 className="text-3xl font-black text-gray-800">Tangga Prestasi</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Bintang (5 Poin) & Terima Kasih (3 Poin)</p>
            </div>
            <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border-2 border-orange-100">
              <div className="divide-y divide-gray-50">
                {rankedFriends.map((f, i) => (
                  <div key={f.id} className="p-6 flex items-center gap-4 hover:bg-orange-50/30 transition-colors">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${i === 0 ? 'bg-yellow-400 text-white shadow-lg' : i === 1 ? 'bg-gray-300 text-white shadow-lg' : i === 2 ? 'bg-orange-300 text-white shadow-lg' : 'text-gray-400'}`}>{i + 1}</div>
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                      {f.usePhoto ? <img src={f.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">{AVATARS[f.avatar]?.emoji}</div>}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-gray-800">{f.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{f.nickname || '-'}</p>
                    </div>
                    <div className="bg-yellow-50 px-4 py-2 rounded-2xl border-2 border-yellow-200 text-center min-w-[80px]">
                      <span className="block text-lg font-black text-yellow-700">{calculatePTS(f)}</span>
                      <span className="text-[8px] font-black uppercase text-yellow-600">Total PTS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: FORM */}
        {activeTab === 'form' && (
          <div className="max-w-2xl mx-auto bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border-4 border-pink-100 animate-scale-up">
            <h2 className="text-3xl font-black text-pink-500 text-center mb-10">{isEditing ? '✏️ Edit Biodatamu' : '📝 Tulis Biodatamu'}</h2>
            <form onSubmit={e => { e.preventDefault(); setShowConfirmModal(true); }} className="space-y-8">
              {/* Photo & Avatar Toggle */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tampilan Profil</label>
                <div className="bg-gray-50 p-6 rounded-[30px] border-2 border-gray-100 text-center space-y-6">
                   <div className="flex justify-center gap-2">
                     <button type="button" onClick={() => setFormData({...formData, usePhoto: false})} className={`px-6 py-2 rounded-full font-black text-xs transition-all ${!formData.usePhoto ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-400'}`}>Pilih Avatar</button>
                     <button type="button" onClick={() => setFormData({...formData, usePhoto: true})} className={`px-6 py-2 rounded-full font-black text-xs transition-all ${formData.usePhoto ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-400'}`}>Upload Foto</button>
                   </div>
                   {!formData.usePhoto ? (
                     <div className="grid grid-cols-4 gap-3">
                       {Object.entries(AVATARS).map(([k, v]) => (
                         <button key={k} type="button" onClick={() => setFormData({...formData, avatar: k})} className={`p-3 rounded-2xl border-4 transition-all ${formData.avatar === k ? 'border-pink-300 bg-pink-50' : 'border-transparent bg-white'}`}>
                           <div className="text-3xl mb-1">{v.emoji}</div>
                           <span className="text-[8px] font-black uppercase text-gray-400 hidden md:block">{v.label}</span>
                         </button>
                       ))}
                     </div>
                   ) : (
                     <div className="relative inline-block">
                        {formData.photoUrl ? (
                          <div className="relative group">
                            <img src={formData.photoUrl} className="w-32 h-32 rounded-full object-cover border-4 border-pink-300 shadow-xl" />
                            <button onClick={() => setFormData({...formData, photoUrl: null})} className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full shadow-lg"><X size={16} /></button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 border-dashed border-pink-200 bg-white cursor-pointer hover:bg-pink-50 transition-colors">
                            <Camera className="text-pink-300" size={32} />
                            <input type="file" accept="image/*" className="hidden" onChange={e => processFile(e.target.files[0], 400, url => setFormData({...formData, photoUrl: url}))} />
                          </label>
                        )}
                     </div>
                   )}
                </div>
              </div>

              {/* Text Inputs */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nama Lengkap</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-pink-400 outline-none font-bold" placeholder="Nama Lengkap..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Panggilan</label>
                  <input required value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-pink-400 outline-none font-bold" placeholder="Nama Panggilan..." />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Pesan Untuk Teman</label>
                <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-pink-400 outline-none font-bold resize-none" rows="3" placeholder="Tuliskan kata-kata semangat..." />
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <button type="submit" disabled={isSubmitting} className="w-full bg-pink-500 text-white font-black py-5 rounded-2xl shadow-[0_8px_0_#be185d] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Biodata'} <CheckCircle size={22} />
                </button>
                <button type="button" onClick={() => setActiveTab('home')} className="text-gray-400 font-bold uppercase tracking-widest text-xs hover:text-gray-600 transition-colors">Batal & Kembali</button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* MODAL: CONFIRM */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-sm w-full text-center border-4 border-pink-100">
            <h3 className="text-2xl font-black text-gray-800 mb-2">Simpan Sekarang?</h3>
            <p className="text-sm text-gray-500 mb-8">Pastikan datamu sudah benar ya teman-teman!</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest">Batal</button>
              <button onClick={handleSaveDoc} className="flex-1 py-4 bg-pink-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Ya, Simpan!</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-20 px-4 z-[400] md:hidden shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-orange-500' : 'text-gray-300'}`}>
          <Home size={24} /> <span className="text-[10px] font-black uppercase tracking-tighter">Galeri</span>
        </button>
        <button onClick={() => setActiveTab('ranking')} className={`flex flex-col items-center gap-1 ${activeTab === 'ranking' ? 'text-yellow-500' : 'text-gray-300'}`}>
          <Trophy size={24} /> <span className="text-[10px] font-black uppercase tracking-tighter">Peringkat</span>
        </button>
        <button onClick={() => { setActiveTab('form'); resetForm(); }} className="w-14 h-14 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-lg -translate-y-6 border-4 border-white">
          <Plus size={30} />
        </button>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes shake { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-shake { animation: shake 0.6s ease-in-out infinite; }
        body { -webkit-tap-highlight-color: transparent; }
      `}} />
    </div>
  );
}
