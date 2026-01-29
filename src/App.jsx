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
  Sun, Cloud, TreeDeciduous as Tree, Flower, Home, Trophy, Zap, 
  ChevronRight, CornerUpLeft, Medal, Image as ImageIcon, Search, 
  Settings, UserCircle, Type, Crown, Blocks, CalendarDays, Users, BrainCircuit,
  CalendarCheck, Clock, ArrowLeft, FileText, CheckSquare, Edit3, Bookmark,
  TrendingUp, TrendingDown, Minus
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

  // --- JADWAL PELAJARAN & PR STATE ---
  const [scheduleData, setScheduleData] = useState({
    Senin: '', Selasa: '', Rabu: '', Kamis: '', Jumat: ''
  });
  const [homeworkData, setHomeworkData] = useState({}); // Stores PR info
  const [showScheduleModal, setShowScheduleModal] = useState(false); // Admin edit text jadwal
  const [showHomeworkModal, setShowHomeworkModal] = useState(false); // Admin edit PR
  const [currentHomeworkEdit, setCurrentHomeworkEdit] = useState(null); // { day, index, subject, ...data }

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
    const scheduleRef = doc(db, 'artifacts', appId, 'public', 'data', SETTINGS_COLLECTION, 'schedule');
    
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
          waliKelas: { ...data.waliKelas, photoUrl: data.waliKelas?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher", role: "Wali Kelas" },
          asisten: { ...data.asisten, photoUrl: data.asisten?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=assistant", role: "Asisten" },
          ketuaKelas: { ...data.ketuaKelas, photoUrl: data.ketuaKelas?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=leader", role: "Ketua Kelas" }
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

    // Listener Jadwal Pelajaran & PR
    const unsubscribeSchedule = onSnapshot(scheduleRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setScheduleData({
          Senin: data.Senin || '',
          Selasa: data.Selasa || '',
          Rabu: data.Rabu || '',
          Kamis: data.Kamis || '',
          Jumat: data.Jumat || ''
        });
        setHomeworkData(data.homework || {});
      }
    });

    return () => {
      unsubscribeData();
      unsubscribeTestimonies();
      unsubscribeSettings();
      unsubscribeSchedule();
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

  const handleSaveScheduleText = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') return;
    try {
      const scheduleRef = doc(db, 'artifacts', appId, 'public', 'data', SETTINGS_COLLECTION, 'schedule');
      await setDoc(scheduleRef, { ...scheduleData, homework: homeworkData }); // Maintain existing homework
      setShowScheduleModal(false);
    } catch (error) {
      console.error("Gagal update jadwal:", error);
      alert("Gagal menyimpan jadwal.");
    }
  };

  const handleSaveHomework = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin' || !currentHomeworkEdit) return;

    const { day, index, topic, page, task } = currentHomeworkEdit;
    const key = `${day}-${index}`;
    
    const updatedHomework = {
      ...homeworkData,
      [key]: { topic, page, task }
    };

    try {
      const scheduleRef = doc(db, 'artifacts', appId, 'public', 'data', SETTINGS_COLLECTION, 'schedule');
      // We only update the 'homework' field
      await updateDoc(scheduleRef, { homework: updatedHomework });
      
      // Update local state immediately for better UX
      setHomeworkData(updatedHomework);
      setShowHomeworkModal(false);
      setCurrentHomeworkEdit(null);
    } catch (error) {
       console.error("Gagal simpan PR:", error);
       alert("Gagal menyimpan PR.");
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
          Sabar ya...
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-20 px-2 z-[100] md:hidden shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
      <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-400'}`}>
        <div className={`p-2 rounded-xl transition-all ${activeTab === 'home' ? 'bg-blue-50 scale-110' : ''}`}><Home size={22} /></div>
        <span className="text-[10px] font-bold uppercase">Home</span>
      </button>
      <button onClick={() => setActiveTab('ranking')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'ranking' ? 'text-orange-500' : 'text-gray-400'}`}>
        <div className={`p-2 rounded-xl transition-all ${activeTab === 'ranking' ? 'bg-orange-50 scale-110' : ''}`}><Trophy size={22} /></div>
        <span className="text-[10px] font-bold uppercase">Peringkat</span>
      </button>
      
      {/* MENU BARU: ACTIVITY */}
      <button onClick={() => setActiveTab('activity')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'activity' || activeTab === 'schedule' ? 'text-indigo-500' : 'text-gray-400'}`}>
        <div className={`p-2 rounded-xl transition-all ${activeTab === 'activity' || activeTab === 'schedule' ? 'bg-indigo-50 scale-110' : ''}`}><Blocks size={22} /></div>
        <span className="text-[10px] font-bold uppercase">Activity</span>
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
          <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-2xl p-6 md:p-12 w-[90%] max-w-sm text-center border-4 border-green-200 animate-scale-up">
            <div className="relative mx-auto bg-green-50 w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-inner"><div className="animate-shake-hand"><HeartHandshake size={64} className="text-green-500" /></div></div>
            <h3 className="text-2xl font-extrabold text-gray-800 mb-2">Terima Kasih!</h3>
            <p className="text-gray-500">Kamu sudah bilang terima kasih ke <br/><span className="text-green-600 font-bold text-xl">"{thanksMessage.name}"</span></p>
          </div>
        </div>
      )}

      {starMessage.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-2xl p-6 md:p-12 w-[90%] max-w-sm text-center border-4 border-yellow-300 animate-scale-up">
            <div className="relative mx-auto bg-yellow-50 w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-inner"><div className="animate-spin-slow"><Star size={64} className="text-yellow-500 fill-current" /></div></div>
            <h3 className="text-2xl font-extrabold text-gray-800 mb-2">Bintang Terkirim!</h3>
            <p className="text-gray-500">Kamu memberikan Bintang untuk <br/><span className="text-yellow-600 font-bold text-xl">"{starMessage.name}"</span></p>
          </div>
        </div>
      )}

      {restrictedMessage.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-2xl p-6 md:p-12 w-[90%] max-w-sm text-center border-4 border-red-300 animate-scale-up">
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
          <div className="bg-white rounded-[30px] md:rounded-[40px] shadow-2xl p-6 md:p-8 w-[90%] max-w-sm text-center border-4 border-orange-200 animate-scale-up">
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
          <div className="bg-white rounded-3xl shadow-2xl w-[95%] md:w-full max-w-md h-[80vh] md:max-h-[85vh] flex flex-col border-4 border-purple-200 animate-scale-up">
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
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-[90%] max-w-sm text-center border-4 border-pink-200">
            <div className="bg-pink-50 p-3 rounded-full inline-block mb-4"><CheckCircle size={40} className="text-pink-500 mx-auto" /></div>
            <h3 className="text-2xl font-bold mb-2">Sudah Yakin?</h3>
            <p className="text-gray-500 mb-6">Pastikan datanya sudah benar ya.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowConfirmModal(false)} className="px-6 py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-400 transition">Cek Lagi</button>
              <button onClick={handleConfirmSave} className="px-6 py-2 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 shadow-lg transform active:scale-95 transition">Ya, Simpan!</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL INPUT JADWAL TEKS (ADMIN ONLY) --- */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[450] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-[95%] md:w-full max-w-lg overflow-y-auto border-4 border-blue-200 p-5 md:p-8 animate-scale-up max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-500 shadow-inner"><CalendarDays size={24} /></div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">Atur Jadwal</h2>
                 </div>
                 <button onClick={() => setShowScheduleModal(false)} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>

              <form onSubmit={handleSaveScheduleText} className="space-y-4">
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(day => (
                  <div key={day} className="space-y-1">
                    <label className="text-xs font-black uppercase text-gray-500 ml-1 block">{day}</label>
                    <textarea 
                      value={scheduleData[day] || ''} 
                      onChange={(e) => setScheduleData({...scheduleData, [day]: e.target.value})}
                      placeholder={`Pelajaran hari ${day}... (Pisahkan dengan Enter)`}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-400 outline-none text-sm font-bold bg-gray-50 focus:bg-white transition-all resize-none"
                      rows={3}
                    />
                  </div>
                ))}
                <button type="submit" className="w-full mt-4 py-4 bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <CheckCircle size={20} /> Simpan Jadwal
                </button>
              </form>
            </div>
        </div>
      )}

      {/* --- MODAL INPUT PR (ADMIN ONLY) --- */}
      {showHomeworkModal && currentHomeworkEdit && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
           <div className="bg-white rounded-[2rem] shadow-2xl w-[95%] max-w-sm md:max-w-md overflow-hidden border-4 border-indigo-200 animate-scale-up">
              <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex justify-between items-center">
                 <div>
                    <h3 className="text-lg font-black text-indigo-600 uppercase tracking-tight flex items-center gap-2"><Edit3 size={18} /> Input PR</h3>
                    <p className="text-xs font-bold text-gray-400">{currentHomeworkEdit.day} • {currentHomeworkEdit.subject}</p>
                 </div>
                 <button onClick={() => setShowHomeworkModal(false)} className="bg-white p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveHomework} className="p-6 space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Topik / Bab</label>
                    <div className="relative">
                       <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                       <input 
                         value={currentHomeworkEdit.topic} 
                         onChange={(e) => setCurrentHomeworkEdit({...currentHomeworkEdit, topic: e.target.value})}
                         placeholder="Contoh: Pecahan Campuran" 
                         className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-300 outline-none text-sm font-bold transition-all"
                       />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Halaman Buku</label>
                    <div className="relative">
                       <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                       <input 
                         value={currentHomeworkEdit.page} 
                         onChange={(e) => setCurrentHomeworkEdit({...currentHomeworkEdit, page: e.target.value})}
                         placeholder="Contoh: Hal. 45 - 46" 
                         className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-300 outline-none text-sm font-bold transition-all"
                       />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tugas Tambahan</label>
                    <div className="relative">
                       <CheckSquare size={16} className="absolute left-4 top-4 text-gray-300" />
                       <textarea 
                         value={currentHomeworkEdit.task} 
                         onChange={(e) => setCurrentHomeworkEdit({...currentHomeworkEdit, task: e.target.value})}
                         placeholder="Catatan tambahan untuk murid..." 
                         rows={3}
                         className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-300 outline-none text-sm font-bold transition-all resize-none"
                       />
                    </div>
                 </div>
                 <button type="submit" className="w-full bg-indigo-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 mt-2">
                    <Bookmark size={18} /> Simpan PR
                 </button>
              </form>
           </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl w-[95%] md:w-full max-w-xl h-[85vh] md:max-h-[90vh] overflow-y-auto border-4 border-orange-200 p-5 md:p-10 animate-scale-up">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-3 rounded-2xl text-orange-500 shadow-inner"><Settings size={24} /></div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-800 uppercase tracking-tight">Pengaturan Kelas</h2>
                 </div>
                 <button onClick={() => setShowSettingsModal(false)} className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>

              <div className="space-y-10">
                <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-gray-100 relative">
                  <div className="absolute -top-3 left-6 bg-gray-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-md">Identitas Kelas</div>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Nama Kelas:</label>
                       <div className="relative">
                          <Type size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                          <input 
                             value={schoolSettings.className} 
                             onChange={(e) => handleUpdateSchoolSettings('className', null, e.target.value)}
                             placeholder="Contoh: Solahudin Al-Ayubi" 
                             className="w-full pl-11 pr-5 py-3 rounded-2xl border-2 border-white focus:border-orange-300 outline-none text-sm font-bold shadow-sm transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Deskripsi Kelas:</label>
                       <div className="relative">
                          <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                          <input 
                             value={schoolSettings.classDescription} 
                             onChange={(e) => handleUpdateSchoolSettings('classDescription', null, e.target.value)}
                             placeholder="Contoh: Kelas 6A SD Insan Karima" 
                             className="w-full pl-11 pr-5 py-3 rounded-2xl border-2 border-white focus:border-orange-300 outline-none text-sm font-bold shadow-sm transition-all"
                          />
                       </div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50/50 p-6 rounded-[2.5rem] border-2 border-orange-100 relative">
                  <div className="absolute -top-3 left-6 bg-orange-400 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-md">Profil Wali Kelas</div>
                  
                  <div className="flex flex-col md:flex-row gap-6 items-center mt-2">
                      <div className="relative group shrink-0">
                         <img src={schoolSettings.waliKelas.photoUrl} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" alt="Wali Kelas" />
                         <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <Camera size={20} />
                            <input type="file" accept="image/*" onChange={(e) => handleTeacherPhotoUpload('waliKelas', e)} className="hidden" />
                         </label>
                      </div>
                      <div className="flex-1 w-full space-y-3">
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-orange-400 ml-1">Nama Wali Kelas:</label>
                            <input 
                              value={schoolSettings.waliKelas.name} 
                              onChange={(e) => handleUpdateSchoolSettings('waliKelas', 'name', e.target.value)}
                              placeholder="Nama Wali Kelas..." 
                              className="w-full px-5 py-3 rounded-2xl border-2 border-white focus:border-orange-300 outline-none text-sm font-bold shadow-sm transition-all"
                            />
                         </div>
                      </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border-2 border-blue-100 relative">
                  <div className="absolute -top-3 left-6 bg-blue-400 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-md">Profil Asisten</div>
                  
                  <div className="flex flex-col md:flex-row gap-6 items-center mt-2">
                      <div className="relative group shrink-0">
                         <img src={schoolSettings.asisten.photoUrl} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" alt="Asisten" />
                         <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <Camera size={20} />
                            <input type="file" accept="image/*" onChange={(e) => handleTeacherPhotoUpload('asisten', e)} className="hidden" />
                         </label>
                      </div>
                      <div className="flex-1 w-full space-y-3">
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-blue-400 ml-1">Nama Asisten:</label>
                            <input 
                              value={schoolSettings.asisten.name} 
                              onChange={(e) => handleUpdateSchoolSettings('asisten', 'name', e.target.value)}
                              placeholder="Nama Asisten..." 
                              className="w-full px-5 py-3 rounded-2xl border-2 border-white focus:border-blue-300 outline-none text-sm font-bold shadow-sm transition-all"
                            />
                         </div>
                      </div>
                  </div>
                </div>

                <div className="bg-purple-50/50 p-6 rounded-[2.5rem] border-2 border-purple-100 relative">
                  <div className="absolute -top-3 left-6 bg-purple-400 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase shadow-md">Profil Ketua Kelas</div>
                  
                  <div className="flex flex-col md:flex-row gap-6 items-center mt-2">
                      <div className="relative group shrink-0">
                         <img src={schoolSettings.ketuaKelas?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=leader"} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" alt="Ketua Kelas" />
                         <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <Camera size={20} />
                            <input type="file" accept="image/*" onChange={(e) => handleTeacherPhotoUpload('ketuaKelas', e)} className="hidden" />
                         </label>
                      </div>
                      <div className="flex-1 w-full space-y-3">
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-purple-400 ml-1">Nama Ketua Kelas:</label>
                            <input 
                              value={schoolSettings.ketuaKelas?.name || ""} 
                              onChange={(e) => handleUpdateSchoolSettings('ketuaKelas', 'name', e.target.value)}
                              placeholder="Nama Ketua Kelas..." 
                              className="w-full px-5 py-3 rounded-2xl border-2 border-white focus:border-purple-300 outline-none text-sm font-bold shadow-sm transition-all"
                            />
                         </div>
                      </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 text-center">
                 <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed italic">
                    💡 Perubahan informasi identitas kelas, guru, dan ketua kelas akan langsung terupdate untuk semua siswa.
                 </p>
              </div>

              <button onClick={() => setShowSettingsModal(false)} className="w-full mt-8 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-orange-600 active:scale-[0.98] transition-all">Selesai</button>
            </div>
        </div>
      )}

      <header className="bg-gradient-to-br from-orange-400 via-orange-500 to-pink-500 text-white p-8 pb-16 shadow-lg rounded-b-[3rem] mb-0 relative text-center overflow-hidden">
        {/* Pattern & Decoration */}
        <div className="absolute inset-0 opacity-10 pattern-dots pointer-events-none"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-yellow-300 rounded-full blur-3xl opacity-20 mix-blend-overlay animate-float"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-pink-400 rounded-full blur-3xl opacity-20 mix-blend-overlay animate-float" style={{ animationDelay: '2s' }}></div>

        <div className="absolute top-4 right-4 flex flex-col md:flex-row gap-3 z-50">
          {/* MENU KHUSUS ADMIN: INPUT JADWAL TEKS */}
          {userRole === 'admin' && (
            <button 
              onClick={() => setShowScheduleModal(true)} 
              className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all shadow-sm border border-white/20 active:scale-90 flex items-center justify-center backdrop-blur-md"
              aria-label="Atur Jadwal"
            >
              <CalendarDays size={22} />
            </button>
          )}

          {/* MENU KHUSUS ADMIN: SETTINGS */}
          {userRole === 'admin' && (
            <button 
              onClick={() => setShowSettingsModal(true)} 
              className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all shadow-sm border border-white/20 active:scale-90 flex items-center justify-center backdrop-blur-md"
              aria-label="Settings"
            >
              <Settings size={22} />
            </button>
          )}

          {/* LOGOUT */}
          <button 
            onClick={() => setShowLogoutConfirm(true)} 
            className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all shadow-sm border border-white/20 active:scale-90 flex items-center justify-center backdrop-blur-md"
            aria-label="Logout"
          >
            <LogOut size={22} />
          </button>
        </div>

        <div className="relative z-10">
          <h1 className="text-2xl md:text-5xl font-extrabold mb-1 drop-shadow-md">{schoolSettings.className}</h1>
          <p className="text-orange-100 text-[10px] md:text-sm font-bold uppercase tracking-widest mb-6">{schoolSettings.classDescription}</p>
          
          <div className="flex justify-center flex-wrap gap-4 md:gap-12 mb-2 px-2">
             <div className="flex flex-col items-center group">
               <div className="relative mb-2 transform group-hover:scale-105 transition-transform duration-300">
                 <div className="absolute inset-0 bg-white rounded-full blur-md opacity-30"></div>
                 <img src={schoolSettings.waliKelas.photoUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg object-cover relative z-10" alt="Wali" />
                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm whitespace-nowrap z-20">WALI KELAS</div>
               </div>
               <span className="font-bold text-[10px] md:text-sm mt-1">{schoolSettings.waliKelas.name}</span>
             </div>

             <div className="flex flex-col items-center group">
               <div className="relative mb-2 transform group-hover:scale-105 transition-transform duration-300">
                 <div className="absolute inset-0 bg-white rounded-full blur-md opacity-30"></div>
                 <img src={schoolSettings.asisten.photoUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg object-cover relative z-10" alt="Asisten" />
                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm whitespace-nowrap z-20">ASISTEN</div>
               </div>
               <span className="font-bold text-[10px] md:text-sm mt-1">{schoolSettings.asisten.name}</span>
             </div>

             <div className="flex flex-col items-center group">
               <div className="relative mb-2 transform group-hover:scale-105 transition-transform duration-300">
                 <div className="absolute inset-0 bg-white rounded-full blur-md opacity-30"></div>
                 <img src={schoolSettings.ketuaKelas?.photoUrl} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg object-cover relative z-10" alt="Ketua" />
                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm whitespace-nowrap z-20">KETUA KELAS</div>
               </div>
               <span className="font-bold text-[10px] md:text-sm mt-1">{schoolSettings.ketuaKelas?.name}</span>
             </div>
          </div>
        </div>
      </header>

      {/* NEW DESKTOP NAVIGATION - FLOATING BAR */}
      <div className="hidden md:flex justify-center -mt-8 mb-10 relative z-20 px-4">
        <div className="bg-white/90 backdrop-blur-xl p-2 rounded-full shadow-2xl border-4 border-white/50 flex gap-2 items-center ring-1 ring-black/5">
          <button 
            onClick={() => setActiveTab('home')} 
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-black uppercase tracking-wider text-xs ${activeTab === 'home' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 transform -translate-y-1' : 'text-gray-400 hover:bg-orange-50 hover:text-orange-500'}`}
          >
            <Home size={18} className={activeTab === 'home' ? 'animate-bounce' : ''} />
            Home
          </button>
          
          <button 
            onClick={() => setActiveTab('ranking')} 
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-black uppercase tracking-wider text-xs ${activeTab === 'ranking' ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-200 transform -translate-y-1' : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'}`}
          >
            <Trophy size={18} className={activeTab === 'ranking' ? 'animate-bounce' : ''} />
            Peringkat
          </button>
          
          <button 
            onClick={() => setActiveTab('activity')} 
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-black uppercase tracking-wider text-xs ${activeTab === 'activity' || activeTab === 'schedule' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200 transform -translate-y-1' : 'text-gray-400 hover:bg-indigo-50 hover:text-indigo-500'}`}
          >
            <Blocks size={18} className={activeTab === 'activity' || activeTab === 'schedule' ? 'animate-bounce' : ''} />
            Activity
          </button>

          {userRole !== 'viewer' && (
            <button 
              onClick={() => { setActiveTab('form'); resetForm(); }} 
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-black uppercase tracking-wider text-xs ${activeTab === 'form' ? 'bg-pink-500 text-white shadow-lg shadow-pink-200 transform -translate-y-1' : 'text-gray-400 hover:bg-pink-50 hover:text-pink-500'}`}
            >
              <Plus size={18} className={activeTab === 'form' ? 'animate-spin-slow' : ''} />
              Tambah Data
            </button>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4">
        {activeTab === 'home' && (
          <div className="space-y-6">
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
                   <button onClick={() => setSearchQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-100 p-1.5 rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 px-1">
              <div className="w-full md:w-auto text-xs font-bold text-gray-400 uppercase tracking-widest text-left">
                {searchQuery ? `Hasil pencarian untuk "${searchQuery}"` : ''}
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="md:hidden flex flex-1 items-center bg-white rounded-xl shadow-sm border-2 border-orange-100 px-3 py-1.5 transition-all focus-within:border-orange-400">
                  <Search size={18} className="text-orange-500 shrink-0" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari teman..." className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-700 ml-2" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-gray-300 hover:text-red-400"><X size={16} /></button>
                  )}
                </div>
                <button onClick={() => setIsMobileGrid(!isMobileGrid)} className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm text-sm font-bold text-blue-500 border-2 border-blue-100 transition-all active:scale-95 shrink-0">
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
                  const rankIndex = rankedFriends.findIndex(f => f.id === friend.id);
                  const rankNum = rankIndex + 1;
                  const ordinalRank = getOrdinal(rankNum);

                  return (
                    <div key={friend.id} className={`bg-white shadow-lg border-b-8 border-blue-200 flex flex-col hover:border-blue-400 transition-all ${isMobileGrid ? 'rounded-2xl' : 'rounded-3xl'}`}>
                      <div className={`${isMobileGrid ? 'h-24' : 'h-32 md:h-44'} relative`}>
                        <div className={`absolute inset-0 w-full h-full overflow-hidden ${isMobileGrid ? 'rounded-t-2xl' : 'rounded-t-3xl'}`}>
                           <div className={`absolute inset-0 w-full h-full transition-all duration-700 ${banner ? '' : (pic ? 'bg-gray-100' : av.color.split(' ')[0])} ${!banner && !pic ? 'pattern-dots' : ''}`} style={banner ? { backgroundImage: `url(${friend.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} />
                           <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-2 pointer-events-none z-10">
                           <h4 className={`font-black text-white text-center leading-tight [text-shadow:_0_1px_2px_rgba(0,0,0,0.8),_0_0_1px_rgba(0,0,0,1)] ${isMobileGrid ? 'text-xs mt-1' : 'text-xl md:text-2xl mt-2'} flex items-center justify-center gap-2`}>
                             {isMobileGrid ? (friend.nickname || friend.name) : friend.name}
                             <span className={`flex items-center gap-1 text-[0.9em] bg-white/30 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/40 font-black tracking-tighter shadow-sm ${rankNum === 1 ? 'text-yellow-300' : rankNum === 2 ? 'text-gray-200' : rankNum === 3 ? 'text-amber-400' : 'text-white'}`}>
                               {(rankNum <= 3) && <Crown size={15} className="fill-current" />}
                               {ordinalRank}
                             </span>
                           </h4>
                        </div>
                        <div className="absolute top-2 left-2 bg-white/90 px-2.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 z-20 border-2 border-yellow-200 backdrop-blur-sm">
                          <Zap size={16} className="text-yellow-600 fill-yellow-50" />
                          <span className="text-xs font-black text-yellow-700">{totalPTS} <span className="text-[9px] font-normal">PTS</span></span>
                        </div>
                        {userRole !== 'viewer' && (
                          <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20">
                             {(owner || userRole === 'admin') && <button onClick={() => { setFormData(friend); setIsEditing(true); setCurrentEditId(friend.id); setActiveTab('form'); }} className="bg-white/90 p-1.5 rounded-full text-blue-500 shadow-md hover:bg-blue-500 hover:text-white transition backdrop-blur-sm"><Pencil size={14} /></button>}
                             {userRole === 'admin' && <button onClick={() => handleDelete(friend.id)} className="bg-white/90 p-1.5 rounded-full text-red-500 shadow-md hover:bg-red-500 hover:text-white transition backdrop-blur-sm"><Trash2 size={14} /></button>}
                          </div>
                        )}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30">
                          <div className={`bg-white p-1 rounded-full shadow-xl ring-4 ring-white overflow-hidden flex items-center justify-center ${isMobileGrid ? 'w-14 h-14' : 'w-20 h-20 md:w-28 md:h-28'} transition-all`}>
                             {pic ? <img src={friend.photoUrl} className="w-full h-full object-cover rounded-full" /> : <div className={`${av.color} w-full h-full rounded-full flex items-center justify-center text-xl ${isMobileGrid ? 'text-2xl' : 'text-3xl md:text-5xl'}`}>{av.emoji}</div>}
                          </div>
                        </div>
                      </div>

                      <div className={`${isMobileGrid ? 'pt-10 pb-4' : 'pt-16 pb-6'} px-4 text-center flex-1 flex flex-col items-center`}>
                          {!isMobileGrid && <p className="text-blue-500 font-black text-[10px] md:text-xs uppercase mb-4 tracking-[0.2em] opacity-80 mt-1">"{friend.nickname || friend.name}"</p>}
                          <div className={`w-full bg-purple-50 p-3 rounded-2xl mb-4 border border-purple-100 relative group/msg ${isMobileGrid ? 'mt-2' : ''}`}>
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
                            <button onClick={() => handleStar(friend)} className={`flex items-center justify-center gap-1.5 rounded-full border-2 transition-all ${isMobileGrid ? 'px-2 py-1' : 'px-4 py-2'} ${isS ? 'bg-yellow-400 text-white border-yellow-400 shadow-md scale-105' : 'bg-white text-gray-400 border-gray-100 hover:text-yellow-500 hover:border-yellow-100'} ${userRole === 'viewer' || userRole !== 'admin' ? 'cursor-not-allowed opacity-60' : ''}`}>
                              <Star size={isMobileGrid ? 14 : 18} className={isS ? 'fill-current' : ''} />
                              <span className="text-xs font-black">{friend.stars || 0}</span>
                            </button>
                            <button onClick={() => handleThankYou(friend)} className={`flex items-center justify-center gap-1.5 rounded-full border-2 transition-all ${isMobileGrid ? 'px-2 py-1' : 'px-4 py-2'} ${isT ? 'bg-green-500 text-white border-green-500 shadow-md scale-105' : 'bg-white text-gray-400 border-gray-100 hover:text-green-500 hover:border-green-100'} ${userRole === 'viewer' ? 'cursor-not-allowed opacity-60' : ''}`}><HeartHandshake size={isMobileGrid ? 14 : 18} /><span className="text-xs font-black">{friend.thanks || 0}</span></button>
                            <button onClick={() => { setSelectedFriend(friend); setShowTestimonyModal(true); }} className={`flex items-center justify-center gap-1.5 rounded-full border-2 transition-all ${isMobileGrid ? 'px-2 py-1' : 'px-4 py-2'} bg-white text-gray-400 border-gray-100 hover:text-purple-500 hover:border-purple-100 active:scale-95 shadow-sm`}><MessageSquare size={isMobileGrid ? 14 : 18} /><span className="text-xs font-black">{testimonyCount}</span></button>
                          </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* --- RANKING PAGE (Restored with Podium) --- */}
        {activeTab === 'ranking' && (
          <div className="max-w-3xl mx-auto pb-24 animate-fade-in px-4">
             <div className="text-center mb-12 pt-8 relative">
                <div className="relative inline-block">
                   <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-500 via-orange-500 to-pink-500 uppercase tracking-[0.2em] drop-shadow-sm filter">
                     Peringkat
                   </h2>
                   {/* Decorative Elements replacing the Trophy */}
                   <Star className="absolute -top-6 -right-8 text-yellow-400 fill-yellow-400 w-8 h-8 animate-bounce" />
                   <Sparkles className="absolute top-1/2 -translate-y-1/2 -left-10 text-pink-400 w-6 h-6 animate-spin-slow" />
                   <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-1.5 bg-gradient-to-r from-transparent via-orange-300 to-transparent rounded-full opacity-50"></div>
                </div>
             </div>

             {/* PODIUM DISPLAY */}
             {rankedFriends.length > 0 ? (
               <div className="flex justify-center items-end mb-12 min-h-[300px] px-2 gap-2 md:gap-6 relative">
                  {/* PODIUM 2 (Left) */}
                  <div className="w-1/3 max-w-[130px] flex flex-col items-center z-10 order-1 md:order-1">
                     {rankedFriends[1] ? (
                       <div className="w-full flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                          <div className="relative mb-3 group">
                             <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-gray-300 overflow-hidden shadow-lg bg-gray-100 relative">
                                {rankedFriends[1].usePhoto && rankedFriends[1].photoUrl ? (
                                  <img src={rankedFriends[1].photoUrl} className="w-full h-full object-cover" />
                                ) : (
                                  <div className={`${avatars[rankedFriends[1].avatar]?.color || 'bg-gray-200'} w-full h-full flex items-center justify-center text-2xl`}>
                                    {avatars[rankedFriends[1].avatar]?.emoji || '🥈'}
                                  </div>
                                )}
                             </div>
                             {/* Silver Crown */}
                             <Crown size={30} className="absolute -top-6 left-1/2 -translate-x-1/2 text-gray-400 fill-gray-200" />
                             <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gray-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md border-2 border-white min-w-[30px] text-center">#2</div>
                          </div>
                          <div className="w-full bg-gradient-to-b from-gray-200 to-gray-300 h-32 md:h-44 rounded-t-2xl border-t-4 border-gray-100 flex flex-col justify-end p-2 text-center shadow-lg relative">
                             <div className="font-bold text-xs md:text-sm text-gray-700 truncate w-full mb-1 flex items-center justify-center gap-1">
                                {rankedFriends[1].nickname || rankedFriends[1].name.split(' ')[0]}
                                <TrendingUp size={14} className="text-green-500 inline" />
                             </div>
                             <div className="bg-white/60 rounded-lg py-1 px-1 mb-2 backdrop-blur-sm flex items-center justify-center gap-1">
                                <Zap size={12} className="text-gray-600 fill-current" />
                                <span className="font-black text-gray-600 text-[10px] md:text-xs">{calculatePTS(rankedFriends[1])} PTS</span>
                             </div>
                          </div>
                       </div>
                     ) : <div className="w-full h-32 md:h-44 bg-gray-50/50 rounded-t-2xl border-t-2 border-dashed border-gray-200"></div>}
                  </div>

                  {/* PODIUM 1 (Center) */}
                  <div className="w-1/3 max-w-[150px] flex flex-col items-center z-20 order-2 -mt-10">
                     {rankedFriends[0] && (
                       <div className="w-full flex flex-col items-center animate-slide-up">
                          <div className="relative mb-3 scale-110 group">
                             <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-[5px] border-yellow-400 overflow-hidden shadow-xl bg-yellow-100 ring-4 ring-yellow-400/20 relative">
                                {rankedFriends[0].usePhoto && rankedFriends[0].photoUrl ? (
                                  <img src={rankedFriends[0].photoUrl} className="w-full h-full object-cover" />
                                ) : (
                                  <div className={`${avatars[rankedFriends[0].avatar]?.color || 'bg-yellow-100'} w-full h-full flex items-center justify-center text-4xl`}>
                                    {avatars[rankedFriends[0].avatar]?.emoji || '🥇'}
                                  </div>
                                )}
                             </div>
                             {/* Gold Crown - Adjusted Position */}
                             <Crown size={36} className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-500 fill-yellow-400 drop-shadow-md animate-bounce" />
                             <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-md border-2 border-white min-w-[36px] text-center">#1</div>
                          </div>
                          <div className="w-full bg-gradient-to-b from-yellow-300 to-yellow-500 h-44 md:h-56 rounded-t-[24px] border-t-4 border-yellow-200 flex flex-col justify-end p-3 text-center shadow-xl relative overflow-hidden">
                             <div className="absolute inset-0 pattern-elegant opacity-20"></div>
                             <div className="relative z-10 font-black text-sm md:text-base text-yellow-900 truncate w-full mb-1 flex items-center justify-center gap-1">
                                {rankedFriends[0].nickname || rankedFriends[0].name.split(' ')[0]}
                                <TrendingUp size={16} className="text-green-600 inline" />
                             </div>
                             <div className="relative z-10 bg-white/70 rounded-xl py-1.5 px-2 mb-4 backdrop-blur-md shadow-sm flex items-center justify-center gap-1">
                                <Zap size={14} className="text-yellow-800 fill-current" />
                                <span className="font-black text-yellow-800 text-xs md:text-sm">{calculatePTS(rankedFriends[0])} PTS</span>
                             </div>
                          </div>
                       </div>
                     )}
                  </div>

                  {/* PODIUM 3 (Right) */}
                  <div className="w-1/3 max-w-[130px] flex flex-col items-center z-10 order-3">
                     {rankedFriends[2] ? (
                       <div className="w-full flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
                          <div className="relative mb-3 group">
                             <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-amber-600 overflow-hidden shadow-lg bg-amber-100 relative">
                                {rankedFriends[2].usePhoto && rankedFriends[2].photoUrl ? (
                                  <img src={rankedFriends[2].photoUrl} className="w-full h-full object-cover" />
                                ) : (
                                  <div className={`${avatars[rankedFriends[2].avatar]?.color || 'bg-amber-100'} w-full h-full flex items-center justify-center text-2xl`}>
                                    {avatars[rankedFriends[2].avatar]?.emoji || '🥉'}
                                  </div>
                                )}
                             </div>
                             {/* Bronze Crown */}
                             <Crown size={30} className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-700 fill-amber-600" />
                             <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md border-2 border-white min-w-[30px] text-center">#3</div>
                          </div>
                          <div className="w-full bg-gradient-to-b from-amber-600 to-amber-700 h-24 md:h-36 rounded-t-2xl border-t-4 border-amber-500 flex flex-col justify-end p-2 text-center shadow-lg relative">
                             <div className="font-bold text-xs md:text-sm text-amber-50 truncate w-full mb-1 flex items-center justify-center gap-1">
                                {rankedFriends[2].nickname || rankedFriends[2].name.split(' ')[0]}
                                <TrendingUp size={14} className="text-green-300 inline" />
                             </div>
                             <div className="bg-black/20 rounded-lg py-1 px-1 mb-2 flex items-center justify-center gap-1">
                                <Zap size={12} className="text-amber-50 fill-current" />
                                <span className="font-black text-amber-50 text-[10px] md:text-xs">{calculatePTS(rankedFriends[2])} PTS</span>
                             </div>
                          </div>
                       </div>
                     ) : <div className="w-full h-24 md:h-36 bg-gray-50/50 rounded-t-2xl border-t-2 border-dashed border-gray-200"></div>}
                  </div>
               </div>
             ) : (
                <div className="text-center py-12 opacity-50"><p className="font-bold text-gray-400">Belum ada data peringkat.</p></div>
             )}

             {/* LIST SISANYA */}
             <div className="bg-white rounded-[2rem] p-6 shadow-xl border-4 border-indigo-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200"></div>
                <h3 className="font-black text-gray-400 text-center uppercase tracking-widest text-[10px] mb-6 flex items-center justify-center gap-2">
                   <Star size={12} /> Pejuang Bintang Lainnya <Star size={12} />
                </h3>
                <div className="space-y-3">
                   {rankedFriends.slice(3).map((friend, idx) => (
                      <div key={friend.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-indigo-50 transition-colors group border border-transparent hover:border-indigo-100">
                         <div className="font-black text-gray-300 text-sm w-6 text-center group-hover:text-indigo-400">{idx + 4}</div>
                         <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-100 group-hover:scale-110 transition-transform">
                            {friend.usePhoto && friend.photoUrl ? (
                              <img src={friend.photoUrl} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`${avatars[friend.avatar]?.color || 'bg-gray-200'} w-full h-full flex items-center justify-center text-lg`}>
                                {avatars[friend.avatar]?.emoji || '😐'}
                              </div>
                            )}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-700 text-sm truncate group-hover:text-indigo-600 flex items-center gap-1">
                                {friend.name}
                                <TrendingUp size={14} className="text-green-500 inline" />
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                               <span className="flex items-center gap-0.5"><Star size={10} className="text-yellow-400 fill-current" /> {friend.stars || 0}</span>
                               <span className="flex items-center gap-0.5"><HeartHandshake size={10} className="text-green-500" /> {friend.thanks || 0}</span>
                            </div>
                         </div>
                         <div className="bg-indigo-100 px-3 py-1 rounded-full text-indigo-600 font-black text-[10px] whitespace-nowrap flex items-center gap-1">
                            <Zap size={10} className="fill-current" /> {calculatePTS(friend)} PTS
                         </div>
                      </div>
                   ))}
                   {rankedFriends.length <= 3 && rankedFriends.length > 0 && (
                      <div className="text-center py-4 text-xs text-gray-400 italic bg-gray-50 rounded-xl">
                         Semua sudah di podium! Semangat terus! 🚀
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* --- ACTIVITY PAGE (Restored) --- */}
        {activeTab === 'activity' && (
          <div className="space-y-8 max-w-4xl mx-auto pb-20 animate-fade-in">
            <div className="text-center mb-8">
              <div className="bg-indigo-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-lg border-2 border-white transform rotate-3"><Blocks size={32} /></div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-800 uppercase tracking-tight">Pusat Aktivitas</h2>
              <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-2">Belajar Sambil Bermain</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
              {/* Jadwal Pelajaran (Links to 'schedule' tab) */}
              <button onClick={() => setActiveTab('schedule')} className="bg-white rounded-[2rem] p-6 shadow-xl border-b-8 border-blue-200 hover:border-blue-400 transition-all group text-left relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CalendarCheck size={80} className="text-blue-500" /></div>
                 <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform"><CalendarDays size={28} /></div>
                 <h3 className="text-xl font-black text-gray-800 mb-2">Jadwal Pelajaran</h3>
                 <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">Cek mata pelajaran hari ini biar nggak salah bawa buku!</p>
                 <div className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group-hover:bg-blue-600 transition-colors">
                    Lihat Jadwal <ArrowRight size={16} />
                 </div>
              </button>

              {/* Bagi Kelompok */}
              <div className="bg-white rounded-[2rem] p-6 shadow-xl border-b-8 border-purple-200 hover:border-purple-400 transition-all group cursor-default">
                 <div className="bg-purple-50 w-14 h-14 rounded-2xl flex items-center justify-center text-purple-500 mb-4 group-hover:scale-110 transition-transform"><Users size={28} /></div>
                 <h3 className="text-xl font-black text-gray-800 mb-2">Bagi Kelompok</h3>
                 <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">Bingung bagi kelompok? Biar sistem yang acak otomatis.</p>
                 <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed">Segera Hadir</button>
              </div>

              {/* Quiz */}
              <div className="bg-white rounded-[2rem] p-6 shadow-xl border-b-8 border-orange-200 hover:border-orange-400 transition-all group cursor-default">
                 <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform"><BrainCircuit size={28} /></div>
                 <h3 className="text-xl font-black text-gray-800 mb-2">Kuis Seru</h3>
                 <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">Uji pengetahuanmu dengan kuis interaktif yang menantang.</p>
                 <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed">Segera Hadir</button>
              </div>
            </div>
          </div>
        )}

        {/* --- SCHEDULE PAGE (FULL PAGE) --- */}
        {activeTab === 'schedule' && (
           <div className="space-y-6 pb-20 animate-fade-in">
              <div className="flex items-center justify-between mb-8 px-2">
                 <button onClick={() => setActiveTab('activity')} className="flex items-center gap-2 text-gray-400 font-bold uppercase text-xs hover:text-blue-500 transition-colors">
                    <ArrowLeft size={18} /> Kembali
                 </button>
                 <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><CalendarCheck size={20} /></div>
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Jadwal & PR</h2>
                 </div>
                 <div className="w-10"></div> {/* Spacer */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
                 {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((day, idx) => {
                     const colors = ['bg-pink-500', 'bg-orange-500', 'bg-yellow-400', 'bg-green-500', 'bg-blue-500'];
                     const lightColors = ['bg-pink-50', 'bg-orange-50', 'bg-yellow-50', 'bg-green-50', 'bg-blue-50'];
                     const borderColors = ['border-pink-200', 'border-orange-200', 'border-yellow-200', 'border-green-200', 'border-blue-200'];
                     const subjects = scheduleData[day] ? scheduleData[day].split('\n').filter(s => s.trim() !== '') : [];

                     return (
                        <div key={day} className={`rounded-2xl md:rounded-3xl overflow-hidden border-2 ${borderColors[idx]} shadow-lg flex flex-col bg-white`}>
                           <div className={`${colors[idx]} py-3 md:py-4 text-center relative overflow-hidden`}>
                              <div className="absolute top-0 right-0 p-2 opacity-20 transform rotate-12"><CalendarDays size={40} className="text-white" /></div>
                              <h3 className="text-white font-black uppercase tracking-widest text-sm md:text-base relative z-10">{day}</h3>
                           </div>
                           <div className={`flex-1 p-3 md:p-5 ${lightColors[idx]} flex flex-col gap-3`}>
                              {subjects.length > 0 ? (
                                 subjects.map((sub, i) => {
                                    const homeworkKey = `${day}-${i}`;
                                    const hw = homeworkData[homeworkKey];
                                    
                                    return (
                                       <div key={i} className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-black/5 group hover:border-black/10 transition-all">
                                          <div className="flex justify-between items-start gap-2 mb-2">
                                             <span className="text-xs md:text-sm font-black text-gray-700 leading-tight">{sub}</span>
                                             {userRole === 'admin' && (
                                                <button 
                                                  onClick={() => {
                                                     setCurrentHomeworkEdit({ day, index: i, subject: sub, topic: hw?.topic || '', page: hw?.page || '', task: hw?.task || '' });
                                                     setShowHomeworkModal(true);
                                                  }}
                                                  className="text-gray-300 hover:text-blue-500 p-1 -mt-1 -mr-1 transition-colors"
                                                >
                                                   <Edit3 size={14} />
                                                </button>
                                             )}
                                          </div>
                                          
                                          {/* Homework Display */}
                                          {hw && (hw.topic || hw.page || hw.task) ? (
                                             <div className="mt-2 pt-2 border-t border-dashed border-gray-200 space-y-1.5">
                                                {hw.topic && (
                                                   <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-500">
                                                      <BookOpen size={12} className="text-purple-400 shrink-0" />
                                                      <span className="font-bold">{hw.topic}</span>
                                                   </div>
                                                )}
                                                {hw.page && (
                                                   <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-500">
                                                      <FileText size={12} className="text-orange-400 shrink-0" />
                                                      <span className="font-medium bg-orange-50 px-1.5 py-0.5 rounded text-orange-600">{hw.page}</span>
                                                   </div>
                                                )}
                                                {hw.task && (
                                                   <div className="flex items-start gap-1.5 text-[10px] md:text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mt-1">
                                                      <CheckSquare size={12} className="text-green-500 shrink-0 mt-0.5" />
                                                      <span className="italic leading-relaxed">{hw.task}</span>
                                                   </div>
                                                )}
                                             </div>
                                          ) : (
                                             <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-300 italic">
                                                <Smile size={12} /> <span>Tidak ada PR</span>
                                             </div>
                                          )}
                                       </div>
                                    );
                                 })
                              ) : (
                                 <div className="flex flex-col items-center justify-center py-6 text-gray-400 gap-2 opacity-60">
                                    <Clock size={24} />
                                    <span className="text-xs font-bold italic">Libur / Kosong</span>
                                 </div>
                              )}
                           </div>
                        </div>
                     )
                 })}
              </div>
           </div>
        )}

        {activeTab === 'form' && userRole !== 'viewer' && (
          <div className="space-y-8 max-w-2xl mx-auto pb-10">
            <div className="bg-white rounded-[2.5rem] shadow-xl p-6 md:p-10 border-2 border-pink-100 animate-scale-up relative">
              <h2 className="text-xl md:text-3xl font-black text-pink-600 mb-8 text-center drop-shadow-sm">{isEditing ? '✏️ Update Biodata' : '✏️ Yuk Isi Biodatamu!'}</h2>
              <form onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-purple-400 ml-1 tracking-widest">Desain Banner Kartu:</label>
                  <div className="bg-gray-50 p-5 rounded-[2rem] border-2 border-gray-100 text-center">
                    <div className="flex justify-center gap-3 mb-5">
                      <button type="button" onClick={() => setFormData(p => ({ ...p, useBanner: false }))} className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${!formData.useBanner ? 'bg-purple-500 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>Motif Kelas</button>
                      <button type="button" onClick={() => setFormData(p => ({ ...p, useBanner: true }))} className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${formData.useBanner ? 'bg-purple-500 text-white shadow-lg' : 'bg-white border text-gray-400'}`}>Upload Banner</button>
                    </div>
                    {!formData.useBanner ? <div className="p-10 rounded-2xl bg-indigo-100 pattern-dots flex items-center justify-center border-2 border-indigo-200"><span className="bg-white/80 px-4 py-1.5 rounded-full text-[10px] font-black text-indigo-500 uppercase">Motif Khalid Bin Walid Aktif</span></div> : (
                      <div className="relative">
                        {formData.bannerUrl ? (
                          <div className="relative group"><img src={formData.bannerUrl} className="w-full h-32 object-cover rounded-2xl border-2 border-purple-200 shadow-md" /><button type="button" onClick={() => setFormData(p => ({ ...p, bannerUrl: null }))} className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-all"><X size={16} /></button></div>
                        ) : (
                          <div className="border-2 border-dashed border-purple-200 rounded-2xl p-8 bg-purple-50/50 cursor-pointer relative hover:bg-purple-100 transition-colors"><input type="file" accept="image/*" onChange={handleBannerUpload} className="absolute inset-0 opacity-0 cursor-pointer" /><ImageIcon size={32} className="text-purple-400 mx-auto" /><p className="text-purple-500 font-black text-[10px] mt-2 uppercase">Pilih Gambar Banner</p></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

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
                          <button key={key} type="button" onClick={() => setFormData(p => ({ ...p, avatar: key }))} className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all ${formData.avatar === key ? 'border-pink-400 bg-pink-50 ring-2 ring-pink-100' : 'border-transparent bg-white'}`}><div className={`${data.color} w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full text-xl shadow-inner`}>{data.emoji}</div></button>
                        ))}
                      </div>
                    ) : (
                      <div className="relative inline-block mt-2">
                        {formData.photoUrl ? (
                          <div className="relative"><img src={formData.photoUrl} className="w-28 h-28 md:w-36 md:h-36 object-cover rounded-full border-4 border-pink-400 shadow-xl" /><button type="button" onClick={() => setFormData(p => ({ ...p, photoUrl: null }))} className="absolute -top-1 -right-1 bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-all"><X size={16} /></button></div>
                        ) : (
                          <div className="border-2 border-dashed border-pink-200 rounded-3xl p-10 bg-pink-50 cursor-pointer transition-all hover:bg-pink-100 group relative"><input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" /><Upload size={40} className="text-pink-400 mx-auto group-hover:scale-110 transition-transform" /><p className="text-pink-500 font-black text-[10px] mt-2 uppercase tracking-widest text-center">Klik Untuk Ambil Foto</p></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 text-left"><label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Nama Lengkap</label><input required name="name" value={formData.name} onChange={handleInputChange} placeholder="Ketik nama lengkap..." className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 outline-none focus:border-pink-400 font-bold transition-all shadow-sm" /></div>
                  <div className="space-y-1.5 text-left"><label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Nama Panggilan</label><input name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder="Nama panggilan..." className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 outline-none focus:border-pink-400 font-bold transition-all shadow-sm" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5 text-left"><label className="text-[10px] font-black uppercase text-blue-400 ml-1 tracking-widest">Cita-cita</label><input name="dream" value={formData.dream} onChange={handleInputChange} placeholder="Ingin jadi apa?" className="w-full px-5 py-3.5 rounded-2xl border-2 border-blue-50 outline-none focus:border-blue-400 font-bold shadow-sm transition-all" /></div>
                  <div className="space-y-1.5 text-left"><label className="text-[10px] font-black uppercase text-green-400 ml-1 tracking-widest">Hobi</label><input name="hobby" value={formData.hobby} onChange={handleInputChange} placeholder="Suka ngapain?" className="w-full px-5 py-3.5 rounded-2xl border-2 border-green-50 outline-none focus:border-green-400 font-bold shadow-sm transition-all" /></div>
                  <div className="space-y-1.5 text-left"><label className="text-[10px] font-black uppercase text-orange-400 ml-1 tracking-widest">Makanan Favorit</label><input name="food" value={formData.food} onChange={handleInputChange} placeholder="Makan paling enak?" className="w-full px-5 py-3.5 rounded-2xl border-2 border-orange-50 outline-none focus:border-orange-400 font-bold shadow-sm transition-all" /></div>
                </div>

                <div className="space-y-1.5 text-left"><label className="text-[10px] font-black uppercase text-purple-400 ml-1 tracking-widest">Pesan Untuk Teman-teman:</label><textarea required name="message" value={formData.message} onChange={handleInputChange} placeholder="Tulis kata-kata semangat..." rows="3" className="w-full px-6 py-5 rounded-3xl border-2 border-gray-100 outline-none focus:border-purple-400 font-bold shadow-sm transition-all resize-none" /></div>

                <div className="flex flex-col gap-4 pt-6">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-pink-500 text-white font-black py-5 rounded-3xl shadow-[0_8px_0_rgb(190,24,93)] active:shadow-none active:translate-y-1 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 text-lg group">{isSubmitting ? 'Menyimpan...' : (isEditing ? 'Update Biodata' : 'Simpan Biodata')}<CheckCircle size={24} className="group-hover:scale-110 transition-transform" /></button>
                  <button type="button" onClick={() => { resetForm(); setActiveTab('home'); }} className="w-full bg-white text-gray-400 border-2 border-gray-100 font-black py-4 rounded-3xl hover:bg-gray-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs transition-all"><CornerUpLeft size={18} /> Batal & Kembali</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center mt-12 mb-28 opacity-50 text-[10px] md:text-xs tracking-widest uppercase font-black px-4 leading-relaxed">{schoolSettings.className || "Kelas"} — SD Insan Karima<br/>Dibuat oleh Hiro dan Abinya — 2026</footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-up { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes scale-up-balloon { from { opacity: 0; transform: translateX(-50%) scale(0.5); } to { opacity: 1; transform: translateX(-50%) scale(1); } }
        @keyframes shake-hand { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-scale-up-balloon { animation: scale-up-balloon 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-shake-hand { animation: shake-hand 0.6s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .pattern-dots { background-image: radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px); background-size: 15px 15px; }
        .pattern-elegant {
          background-color: #fffbeb;
          background-image: radial-gradient(#fde68a 0.75px, transparent 0.75px), radial-gradient(#fde68a 0.75px, #fffbeb 0.75px);
          background-size: 30px 30px;
          background-position: 0 0, 15px 15px;
        }
        body { -webkit-tap-highlight-color: transparent; scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
      `}} />
    </div>
  );
}
