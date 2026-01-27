import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Gunakan konfigurasi dari dashboard Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyBC-15YvoHfx8CxsP9ddmMSWfw0aGeJRak",
  authDomain: "a-inka.firebaseapp.com",
  projectId: "a-inka",
  storageBucket: "a-inka.firebasestorage.app",
  messagingSenderId: "554090824336",
  appId: "1:554090824336:web:18902f6b1264965f808e15"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = "kelas3-biodata-app"; // ID unik aplikasi Anda
