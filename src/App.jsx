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
  User, Star, Heart, Smile, Trash2, Plus, BookOpen, Gamepad2,
  Utensils, Rocket, Camera, Upload, X,
  Lock, Key, School, ArrowRight, CheckCircle,
  LayoutGrid, List, Pencil, RotateCcw, LogOut,
  MessageCircle
} from 'lucide-react';

import InstallPrompt from './components/InstallPrompt'; 

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

const COLLECTION_NAME = 'kelas3_biodata';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '', nickname: '', dream: '', hobby: '', food: '', message: '',
    avatar: 'super_boy', photoUrl: null, usePhoto: false
  });

  useEffect(() => {
    signInAnonymously(auth);
    const unsub = onAuthStateChanged(auth, setUser);

    if (sessionStorage.getItem('school_auth') === 'true') {
      setIsAuthenticated(true);
      setUserRole(sessionStorage.getItem('user_role') || 'user');
    }
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const unsub = onSnapshot(collection(db, COLLECTION_NAME), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a,b)=>(b.updatedAt?.seconds||b.createdAt?.seconds||0)-(a.updatedAt?.seconds||a.createdAt?.seconds||0));
      setFriends(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    const input = accessCode.toLowerCase().trim();
    const admin = ["ustazah","ustadz","ustadzah","ustad"];
    const userCodes = ["insan karima","inka","sd insan karima"];

    if (admin.includes(input)) {
      setUserRole('admin');
    } else if (userCodes.includes(input)) {
      setUserRole('user');
    } else {
      setLoginError(true);
      return;
    }
    setIsAuthenticated(true);
    sessionStorage.setItem('school_auth','true');
    sessionStorage.setItem('user_role', userRole);
  };

  const handleLogout = () => {
    if (confirm("Yakin ingin keluar?")) {
      sessionStorage.clear();
      setIsAuthenticated(false);
    }
  };

  const handleLove = async (id) => {
    if (localStorage.getItem(`loved_${id}`)) return alert("Sudah kasih ❤️");
    await updateDoc(doc(db, COLLECTION_NAME, id), { loves: increment(1) });
    localStorage.setItem(`loved_${id}`, true);
  };

  // ✅ TESTIMONY HANDLER (SIMPLE)
  const handleTestimony = (friend) => {
    alert(`Testimoni untuk ${friend.name}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-sky-200">
        <InstallPrompt />
        <form onSubmit={handleLogin} className="bg-white p-6 rounded-2xl shadow-xl">
          <input
            type="password"
            value={accessCode}
            onChange={e=>setAccessCode(e.target.value)}
            placeholder="Kode Sekolah"
            className="border p-3 rounded-xl w-full mb-3 text-center"
          />
          {loginError && <p className="text-red-500 text-sm mb-2">Kode salah</p>}
          <button className="bg-orange-400 text-white w-full py-3 rounded-xl font-bold">
            Masuk
          </button>
        </form>
      </div>
    );
  }

  if (loading) return <div className="h-screen flex items-center justify-center">Sabar ya...</div>;

  return (
    <div className="min-h-screen bg-yellow-50 pb-10">
      <InstallPrompt />

      <header className="bg-orange-400 p-4 text-white text-center relative">
        <h1 className="text-2xl font-bold">Kelas 3A Insan Karima</h1>
        <button onClick={handleLogout} className="absolute top-4 right-4">
          <LogOut />
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {friends.map(friend => {
            const isLoved = localStorage.getItem(`loved_${friend.id}`);
            return (
              <div key={friend.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="h-20 bg-blue-100 relative flex justify-center items-end">

                  {/* ❤️ LOVE + 💬 TESTIMONY */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <button
                      onClick={() => handleLove(friend.id)}
                      className={`p-1.5 rounded-full flex items-center gap-1 ${
                        isLoved ? 'bg-pink-100 text-pink-600' : 'bg-white/70'
                      }`}
                    >
                      <Heart size={16} className={isLoved ? 'fill-current' : ''} />
                      <span className="text-xs font-bold">{friend.loves || 0}</span>
                    </button>

                    <button
                      onClick={() => handleTestimony(friend)}
                      className="p-1.5 rounded-full bg-white/70 text-gray-500 hover:text-blue-500"
                      title="Testimoni"
                    >
                      <MessageCircle size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-4 text-center">
                  <h3 className="font-bold text-lg">{friend.name}</h3>
                  <p className="italic text-sm text-gray-600">"{friend.message}"</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 mt-8">
        © 2026 Kelas 3A SDI Insan Karima
      </footer>
    </div>
  );
}
