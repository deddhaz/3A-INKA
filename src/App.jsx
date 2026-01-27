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
  Heart, Trash2, Plus, BookOpen, Gamepad2, Utensils, Rocket, 
  Camera, Upload, X, Lock, Key, ArrowRight, CheckCircle, 
  Pencil, LogOut, MessageCircle, Smile, Send, School, RotateCcw
} from 'lucide-react';

// --- 1. KONFIGURASI FIREBASE ---
// Gunakan konfigurasi asli kamu agar langsung terhubung ke database
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
const customAppId = "kelas3_biodata_app"; 

// Path Koleksi sesuai Aturan Struktur Data
const BIODATA_PATH = ['artifacts', customAppId, 'public', 'data', 'kelas3_biodata'];
const TESTIMONI_PATH = ['artifacts', customAppId, 'public', 'data', 'kelas3_testimoni'];

// --- 2. KOMPONEN: TESTIMONY MODAL (INTERNAL) ---
const TestimonyModal = ({ isOpen, onClose, friend, currentUser }) => {
  const [testimonyText, setTestimonyText] = useState('');
  const [list, setList] = useState([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen || !friend) return;

    // Mengambil data testimoni secara real-time
    const collRef = collection(db, ...TESTIMONI_PATH);
    const unsubscribe = onSnapshot(collRef, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.targetId === friend.id)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setList(data);
    }, (err) => console.error("Firestore Error:", err));

    return () => unsubscribe();
  }, [isOpen, friend]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!testimonyText.trim() || !currentUser) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, ...TESTIMONI_PATH), {
        targetId: friend.id,
        senderName: currentUser.displayName || "Teman Kelas",
        senderUid: currentUser.uid,
        text: testimonyText,
        createdAt: serverTimestamp()
      });
      setTestimonyText('');
    } catch (err) {
      console.error("Gagal mengirim pesan:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[35px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border-4 border-purple-200 font-sans">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold">
            <MessageCircle size={22} />
            <span className="text-lg">Pesan untuk {friend.nickname || friend.name}</span>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-purple-50/30">
          {list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Smile size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Belum ada pesan.<br/>Ayo tulis pesan penyemangat pertama!</p>
            </div>
          ) : (
            list.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100">
                <p className="text-gray-700 text-sm italic leading-relaxed">"{item.text}"</p>
                <div className="mt-2 flex items-center gap-1">
                  <div className="h-px flex-1 bg-purple-50"></div>
                  <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest">— {item.senderName}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white border-t border-purple-100 flex gap-2">
          <input 
            type="text"
            value={testimonyText}
            onChange={(e) => setTestimonyText(e.target.value)}
            placeholder="Tulis pesan baik..."
            className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm focus:border-purple-400 outline-none transition-all"
          />
          <button disabled={isSending || !testimonyText.trim()} className="bg-purple-500 text-white p-3 rounded-2xl hover:bg-purple-600 active:scale-90 transition-all shadow-lg">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

// --- 3. KOMPONEN: INSTALL PROMPT (INTERNAL) ---
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[90] bg-white p-4 rounded-2xl shadow-2xl border-4 border-orange-200 flex items-center justify-between animate-bounce">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><School size={20} /></div>
        <div className="text-xs font-black text-gray-600 uppercase">Pasang di HP Kamu?</div>
      </div>
      <button onClick={() => deferredPrompt.prompt()} className="bg-orange-500 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg">INSTALL</button>
    </div>
  );
};

// --- 4. APLIKASI UTAMA ---
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
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [selectedFriendForTestimony, setSelectedFriendForTestimony] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '', nickname: '', dream: '', hobby: '', food: '', message: '',
    avatar: 'super_boy', photoUrl: null, usePhoto: false
  });

  const TEACHER_DATA = {
    waliKelas: { name: "Ustazah Najwa", photoUrl: "https://raw.githubusercontent.com/deddhaz/library/refs/heads/main/ust1.jpeg", role: "Wali Kelas" },
    asisten: { name: "Ustazah Dea", photoUrl: "https://raw.githubusercontent.com/deddhaz/library/refs/heads/main/ust2.jpeg", role: "Asisten Wali Kelas" }
  };

  const avatars = {
    super_boy: { emoji: '🦸‍♂️', color: 'bg-blue-100' },
    super_girl: { emoji: '🦸‍♀️', color: 'bg-pink-100' },
    ninja: { emoji: '🥷', color: 'bg-gray-800 text-white' },
    robot: { emoji: '🤖', color: 'bg-red-100' },
    spider: { emoji: '🕷️', color: 'bg-red-50' },
    bat: { emoji: '🦇', color: 'bg-gray-200' },
    alien: { emoji: '👽', color: 'bg-green-100' },
    wizard: { emoji: '🧙‍♂️', color: 'bg-purple-100' },
  };

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, setUser);
    const sessionAuth = sessionStorage.getItem('school_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
      setUserRole(sessionStorage.getItem('user_role') || 'user');
    }
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthenticated) return;
    const unsubscribe = onSnapshot(collection(db, ...BIODATA_PATH), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.updatedAt?.seconds || b.createdAt?.seconds || 0) - (a.updatedAt?.seconds || a.createdAt?.seconds || 0));
      setFriends(data);
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsubscribe();
  }, [user, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const code = accessCode.toLowerCase().trim();
    if (["ustazah", "ustadzah", "ustadz", "ustad"].includes(code)) {
      loginSuccess('admin');
    } else if (["insan karima", "inka", "sd insan karima"].includes(code)) {
      loginSuccess('user');
    } else {
      setLoginError(true);
    }
  };

  const loginSuccess = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    sessionStorage.setItem('school_auth', 'true');
    sessionStorage.setItem('user_role', role);
  };

  const handleLogout = () => {
    if(window.confirm("Yakin ingin keluar?")) {
      setIsAuthenticated(false);
      setUserRole('user');
      sessionStorage.removeItem('school_auth');
      sessionStorage.removeItem('user_role');
    }
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    const data = { 
      ...formData, 
      photoUrl: formData.usePhoto ? formData.photoUrl : null,
      updatedAt: serverTimestamp() 
    };
    try {
      if (isEditing) {
        await updateDoc(doc(db, ...BIODATA_PATH, currentEditId), data);
      } else {
        await addDoc(collection(db, ...BIODATA_PATH), { 
          ...data, 
          loves: 0, 
          createdAt: serverTimestamp(), 
          creatorId: user.uid 
        });
      }
      setFormData({ name: '', nickname: '', dream: '', hobby: '', food: '', message: '', avatar: 'super_boy', photoUrl: null, usePhoto: false });
      setIsEditing(false);
      setActiveTab('gallery');
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-sky-200 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-sm w-full border-8 border-orange-200 text-center animate-in zoom-in duration-300">
          <div className="bg-orange-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-white text-white">
            <Lock size={36} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">SD Insan Karima</h2>
          <p className="text-gray-400 text-xs font-bold mb-6 uppercase tracking-widest">Gerbang Terkunci</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={accessCode} 
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Kode Rahasia..."
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-orange-400 outline-none text-center font-bold tracking-widest"
            />
            {loginError && <p className="text-red-500 text-xs font-bold animate-pulse">Ups! Kode salah.</p>}
            <button type="submit" className="w-full bg-orange-400 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-orange-500 flex items-center justify-center gap-2 transition-all">
              MASUK <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className="h-screen bg-yellow-50 flex items-center justify-center font-black text-orange-500 animate-pulse">MEMUAT DATA KELAS...</div>;

  return (
    <div className="min-h-screen bg-yellow-50 font-sans pb-20">
      <InstallPrompt />
      <header className="bg-orange-400 text-white p-6 md:p-10 rounded-b-[50px] shadow-xl text-center relative overflow-hidden">
        <button onClick={handleLogout} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/40 z-20 transition-all"><LogOut size={20} /></button>
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-2 uppercase drop-shadow-lg tracking-tight">🏹 Khalid Bin Walid 🏹</h1>
          <p className="text-orange-100 font-bold uppercase text-xs tracking-widest">Kelas 3A SDI Insan Karima</p>
          <div className="flex justify-center gap-8 mt-8">
            {[TEACHER_DATA.waliKelas, TEACHER_DATA.asisten].map((t, i) => (
              <div key={i} className="flex flex-col items-center">
                <img src={t.photoUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-xl object-cover hover:scale-110 transition-all" alt={t.name}/>
                <span className="font-bold mt-2 text-[10px] md:text-xs tracking-tight">{t.name}</span>
                <span className="text-[8px] bg-white/20 px-2 rounded-full uppercase font-bold">{t.role}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="flex justify-center gap-3 my-8 px-4">
        <button onClick={() => { setActiveTab('gallery'); setIsEditing(false); }} className={`flex items-center gap-2 px-6 py-4 rounded-full font-black shadow-lg transition-all ${activeTab === 'gallery' ? 'bg-blue-500 text-white scale-105' : 'bg-white text-blue-500'}`}>
          <BookOpen size={20}/> LIHAT TEMAN
        </button>
        <button onClick={() => { setActiveTab('form'); setIsEditing(false); }} className={`flex items-center gap-2 px-6 py-4 rounded-full font-black shadow-lg transition-all ${activeTab === 'form' ? 'bg-pink-500 text-white scale-105' : 'bg-white text-pink-500'}`}>
          <Plus size={20}/> ISI BIODATA
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4">
        {activeTab === 'gallery' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {friends.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-[40px] border-4 border-dashed border-gray-100">
                <Smile size={60} className="mx-auto mb-4 text-gray-200" />
                <p className="text-gray-400 font-bold">Belum ada teman yang isi biodata.</p>
              </div>
            ) : (
              friends.map((friend) => {
                const av = avatars[friend.avatar] || avatars.super_boy;
                const isLoved = localStorage.getItem(`loved_${friend.id}`);
                const isOwner = user && user.uid === friend.creatorId;
                return (
                  <div key={friend.id} className="bg-white rounded-[40px] shadow-xl overflow-hidden hover:-translate-y-2 transition-all border-b-8 border-indigo-100 relative group">
                    <div className={`h-24 ${friend.usePhoto ? 'bg-indigo-50' : av.color} relative`}>
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full p-1.5 shadow-xl border-4 border-white">
                        {friend.usePhoto ? <img src={friend.photoUrl} className="w-full h-full rounded-full object-cover" alt={friend.name}/> : <div className="w-full h-full rounded-full flex items-center justify-center text-4xl shadow-inner">{av.emoji}</div>}
                      </div>
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={() => setSelectedFriendForTestimony(friend)} className="bg-white/90 p-2 rounded-full text-purple-500 shadow-sm hover:bg-purple-500 hover:text-white transition-all"><MessageCircle size={18}/></button>
                        <button onClick={() => {
                           updateDoc(doc(db, ...BIODATA_PATH, friend.id), { loves: increment(1) });
                           localStorage.setItem(`loved_${friend.id}`, 'true');
                        }} className={`p-2 rounded-full shadow-sm transition-all flex items-center gap-1 ${isLoved ? 'bg-pink-500 text-white' : 'bg-white/90 text-pink-500'}`}><Heart size={18} className={isLoved ? 'fill-current' : ''}/><span className="text-[10px] font-black">{friend.loves || 0}</span></button>
                        {(userRole === 'admin' || isOwner) && (
                          <button onClick={() => { setFormData({...friend}); setIsEditing(true); setCurrentEditId(friend.id); setActiveTab('form'); }} className="bg-white/90 p-2 rounded-full text-blue-500 shadow-sm hover:bg-blue-500 hover:text-white transition-all"><Pencil size={18}/></button>
                        )}
                        {userRole === 'admin' && (
                          <button onClick={() => { if(window.confirm("Hapus?")) deleteDoc(doc(db, ...BIODATA_PATH, friend.id)); }} className="bg-white/90 p-2 rounded-full text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                        )}
                      </div>
                    </div>
                    <div className="pt-14 pb-8 px-6 text-center">
                      <h3 className="text-xl font-black text-gray-800 uppercase truncate tracking-tight">{friend.name}</h3>
                      <p className="text-blue-500 font-bold text-xs mb-4 uppercase tracking-widest">"{friend.nickname || friend.name}"</p>
                      
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-blue-50 p-2 rounded-2xl"><Rocket size={16} className="mx-auto text-blue-400 mb-1"/><span className="text-[9px] font-black block truncate uppercase">{friend.dream || '-'}</span></div>
                        <div className="bg-green-50 p-2 rounded-2xl"><Gamepad2 size={16} className="mx-auto text-green-400 mb-1"/><span className="text-[9px] font-black block truncate uppercase">{friend.hobby || '-'}</span></div>
                        <div className="bg-orange-50 p-2 rounded-2xl"><Utensils size={16} className="mx-auto text-orange-400 mb-1"/><span className="text-[9px] font-black block truncate uppercase">{friend.food || '-'}</span></div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-3xl border-2 border-dashed border-yellow-200 relative">
                        <div className="absolute -top-2 left-4 bg-yellow-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Pesan Sahabat</div>
                        <p className="text-xs italic text-gray-600 line-clamp-3">"{friend.message}"</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 max-w-2xl mx-auto border-4 border-pink-100 animate-in slide-in-from-bottom-5 duration-500">
             <h2 className="text-2xl font-black text-pink-600 mb-8 text-center uppercase tracking-tight">{isEditing ? '✏️ Update Biodatamu' : '✏️ Isi Biodatamu Yuk!'}</h2>
             <form onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }} className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-[35px] border-2 border-dashed border-pink-200 text-center">
                  <div className="flex justify-center gap-4 mb-6">
                    <button type="button" onClick={() => setFormData(p => ({...p, usePhoto: false}))} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!formData.usePhoto ? 'bg-pink-500 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>AVATAR</button>
                    <button type="button" onClick={() => setFormData(p => ({...p, usePhoto: true}))} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.usePhoto ? 'bg-pink-500 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>FOTO ASLI</button>
                  </div>
                  
                  {!formData.usePhoto ? (
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries(avatars).map(([k, v]) => (
                        <button key={k} type="button" onClick={() => setFormData(p => ({...p, avatar: k, usePhoto: false}))} className={`p-3 rounded-2xl transition-all ${formData.avatar === k && !formData.usePhoto ? 'bg-pink-100 ring-2 ring-pink-400 scale-110' : 'bg-white shadow-sm'}`}>
                          <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${v.color} text-xl shadow-inner`}>{v.emoji}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      {formData.photoUrl ? (
                        <div className="relative">
                          <img src={formData.photoUrl} className="w-32 h-32 rounded-full border-4 border-pink-400 object-cover shadow-2xl" alt="Preview"/>
                          <button type="button" onClick={() => setFormData(p => ({...p, photoUrl: null, usePhoto: false}))} className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"><X size={16}/></button>
                        </div>
                      ) : (
                        <label className="w-full p-10 border-4 border-dashed border-pink-200 rounded-[35px] cursor-pointer hover:bg-pink-50 transition-all flex flex-col items-center gap-2 group">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if(file) {
                              const reader = new FileReader();
                              reader.onload = (re) => setFormData(p => ({...p, photoUrl: re.target.result, usePhoto: true}));
                              reader.readAsDataURL(file);
                            }
                          }} />
                          <Upload className="text-pink-400 group-hover:scale-125 transition-transform" size={32} />
                          <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Klik Upload Foto Kamu</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nama Lengkap</label>
                    <input required name="name" value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-pink-300 outline-none transition-all font-bold" placeholder="Fatih Al-Ayyubi"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Panggilan</label>
                    <input name="nickname" value={formData.nickname} onChange={(e) => setFormData(p => ({...p, nickname: e.target.value}))} className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-pink-300 outline-none transition-all font-bold" placeholder="Fatih"/>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Cita-cita</label>
                    <input name="dream" value={formData.dream} onChange={(e) => setFormData(p => ({...p, dream: e.target.value}))} className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-blue-300 outline-none transition-all text-sm font-bold" placeholder="Astronaut"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Hobi</label>
                    <input name="hobby" value={formData.hobby} onChange={(e) => setFormData(p => ({...p, hobby: e.target.value}))} className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-green-300 outline-none transition-all text-sm font-bold" placeholder="Main Bola"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Makanan</label>
                    <input name="food" value={formData.food} onChange={(e) => setFormData(p => ({...p, food: e.target.value}))} className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-orange-300 outline-none transition-all text-sm font-bold" placeholder="Kurma"/>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Pesan Untuk Teman</label>
                  <textarea required name="message" value={formData.message} onChange={(e) => setFormData(p => ({...p, message: e.target.value}))} rows="3" className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-300 outline-none transition-all font-medium resize-none" placeholder="Pesan semangat untuk teman sekelas..."/>
                </div>

                <div className="flex gap-4">
                  {isEditing && (
                    <button type="button" onClick={() => { setIsEditing(false); setActiveTab('gallery'); }} className="flex-1 bg-gray-200 text-gray-500 font-black py-5 rounded-2xl hover:bg-gray-300 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                      <RotateCcw size={20}/> BATAL
                    </button>
                  )}
                  <button type="submit" disabled={isSubmitting} className="flex-[2] bg-pink-500 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-pink-600 active:scale-95 transition-all uppercase tracking-widest">
                    {isSubmitting ? 'MENYIMPAN...' : (isEditing ? 'UPDATE DATA' : 'SIMPAN DATA')}
                  </button>
                </div>
             </form>
          </div>
        )}
      </main>

      <footer className="mt-20 text-center opacity-30 text-[10px] font-bold uppercase tracking-widest pb-10">
        Dibuat oleh Bilal & Abinya • SD Insan Karima • 2026
      </footer>

      {/* --- RENDER MODAL TESTIMONI --- */}
      <TestimonyModal 
        isOpen={!!selectedFriendForTestimony} 
        onClose={() => setSelectedFriendForTestimony(null)} 
        friend={selectedFriendForTestimony} 
        db={db}
        currentUser={user}
      />

      {/* MODAL KONFIRMASI SIMPAN */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full text-center border-4 border-pink-200 shadow-2xl">
            <CheckCircle size={60} className="mx-auto text-pink-500 mb-4" />
            <h3 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">SIMPAN DATA?</h3>
            <p className="text-sm text-gray-400 mb-8 font-medium">Pastikan semua data yang kamu isi sudah benar ya!</p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-all uppercase text-xs tracking-widest">CEK LAGI</button>
              <button onClick={handleConfirmSave} className="flex-1 py-4 bg-pink-500 text-white font-black rounded-2xl shadow-lg hover:bg-pink-600 active:scale-95 transition-all uppercase text-xs tracking-widest">YA, SIMPAN!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
