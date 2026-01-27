import React, { useState, useEffect } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, addDoc, onSnapshot, deleteDoc, doc, 
  serverTimestamp, updateDoc, increment 
} from 'firebase/firestore';
import { 
  Heart, Trash2, Plus, BookOpen, Gamepad2, Utensils, Rocket, 
  Camera, Upload, X, Lock, Key, ArrowRight, CheckCircle, 
  Pencil, LogOut, MessageCircle 
} from 'lucide-react';

// Import Konfigurasi dan Komponen yang sudah dipisah
import { auth, db, appId } from './src/firebase';
import InstallPrompt from './components/InstallPrompt';
import TestimonyModal from './components/TestimonyModal';

const BIODATA_PATH = ['artifacts', appId, 'public', 'data', 'kelas3_biodata'];

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
    bat: { emoji: 'Bat', color: 'bg-gray-200' },
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
    });
    return () => unsubscribe();
  }, [user, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const code = accessCode.toLowerCase().trim();
    if (["ustazah", "ustadzah", "ustadz", "ustad"].includes(code)) {
      loginSuccess('admin');
    } else if (["insan karima", "inka"].includes(code)) {
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

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    const data = { ...formData, updatedAt: serverTimestamp() };
    try {
      if (isEditing) {
        await updateDoc(doc(db, ...BIODATA_PATH, currentEditId), data);
      } else {
        await addDoc(collection(db, ...BIODATA_PATH), { ...data, loves: 0, createdAt: serverTimestamp(), creatorId: user.uid });
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
        <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-sm w-full border-8 border-orange-200 text-center">
          <div className="bg-orange-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-white text-white">
            <Lock size={36} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-6 uppercase tracking-tight">SD Insan Karima</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={accessCode} 
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Kode Rahasia..."
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-orange-400 outline-none text-center font-bold"
            />
            {loginError && <p className="text-red-500 text-xs font-bold">Kode salah!</p>}
            <button type="submit" className="w-full bg-orange-400 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-orange-500 flex items-center justify-center gap-2">
              MASUK <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 font-sans pb-20">
      <InstallPrompt />
      <header className="bg-orange-400 text-white p-6 md:p-10 rounded-b-[50px] shadow-xl text-center">
        <h1 className="text-3xl md:text-5xl font-black mb-2 uppercase drop-shadow-lg tracking-tight">🏹 Khalid Bin Walid 🏹</h1>
        <p className="text-orange-100 font-bold uppercase text-xs tracking-widest">Kelas 3A SDI Insan Karima</p>
        <div className="flex justify-center gap-8 mt-8">
          {[TEACHER_DATA.waliKelas, TEACHER_DATA.asisten].map((t, i) => (
            <div key={i} className="flex flex-col items-center">
              <img src={t.photoUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-xl object-cover" alt={t.name}/>
              <span className="font-bold mt-2 text-[10px] md:text-xs">{t.name}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="flex justify-center gap-3 my-8 px-4">
        <button onClick={() => setActiveTab('gallery')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all ${activeTab === 'gallery' ? 'bg-blue-500 text-white scale-105' : 'bg-white text-blue-500'}`}>
          <BookOpen size={20}/> Lihat Teman
        </button>
        <button onClick={() => setActiveTab('form')} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all ${activeTab === 'form' ? 'bg-pink-500 text-white scale-105' : 'bg-white text-pink-500'}`}>
          <Plus size={20}/> Isi Biodata
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4">
        {activeTab === 'gallery' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.map((friend) => (
              <div key={friend.id} className="bg-white rounded-[40px] shadow-xl overflow-hidden group hover:-translate-y-2 transition-all border-b-8 border-indigo-100 relative">
                <div className={`h-24 ${friend.usePhoto ? 'bg-indigo-50' : (avatars[friend.avatar]?.color || 'bg-gray-100')} relative`}>
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full p-1.5 shadow-xl">
                    {friend.usePhoto ? <img src={friend.photoUrl} className="w-full h-full rounded-full object-cover"/> : <div className="w-full h-full rounded-full flex items-center justify-center text-4xl">{avatars[friend.avatar]?.emoji}</div>}
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => setSelectedFriendForTestimony(friend)} className="bg-white/90 p-2 rounded-full text-purple-500 shadow-sm hover:bg-purple-500 hover:text-white transition"><MessageCircle size={18}/></button>
                    <button onClick={() => {
                        updateDoc(doc(db, ...BIODATA_PATH, friend.id), { loves: increment(1) });
                    }} className="bg-white/90 p-2 rounded-full text-pink-500 shadow-sm flex items-center gap-1"><Heart size={18}/><span className="text-xs font-bold">{friend.loves || 0}</span></button>
                  </div>
                </div>
                <div className="pt-14 pb-8 px-6 text-center">
                  <h3 className="text-xl font-black text-gray-800 uppercase truncate">{friend.name}</h3>
                  <p className="text-blue-500 font-bold text-xs mb-4">"{friend.nickname}"</p>
                  <div className="bg-yellow-50 p-4 rounded-3xl border-2 border-dashed border-yellow-200">
                    <p className="text-xs italic text-gray-600 line-clamp-3">"{friend.message}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[35px] shadow-2xl p-6 md:p-10 max-w-2xl mx-auto border-4 border-pink-100">
             <h2 className="text-2xl font-black text-pink-600 mb-8 text-center uppercase">✏️ Isi Biodatamu Yuk!</h2>
             {/* Form fields here (as in previous App.js) */}
             <button onClick={() => setShowConfirmModal(true)} className="w-full bg-pink-500 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-pink-600 transition-all uppercase tracking-widest">Simpan Data</button>
          </div>
        )}
      </main>

      <TestimonyModal 
        isOpen={!!selectedFriendForTestimony}
        onClose={() => setSelectedFriendForTestimony(null)}
        friend={selectedFriendForTestimony}
        db={db}
        currentUser={user}
      />

      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full text-center border-4 border-pink-200 shadow-2xl">
            <CheckCircle size={60} className="mx-auto text-pink-500 mb-4" />
            <h3 className="text-2xl font-black text-gray-800 mb-2 uppercase">Simpan Data?</h3>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 font-bold text-gray-400">BATAL</button>
              <button onClick={handleConfirmSave} className="flex-1 py-4 bg-pink-500 text-white font-black rounded-2xl">YA, SIMPAN!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
