/* eslint-disable no-restricted-globals */

// UPDATE VERSI: v11 (Safety First - Hanya Cache HTML & Manifest)
const CACHE_NAME = 'kelas3-biodata-v11-safety';

// Kita HANYA menyimpan file inti untuk mode offline dasar.
// File JS/CSS/Gambar biarkan browser yang menangani caching-nya secara alami.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. INSTALL
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching core files only');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
  );
  self.skipWaiting();
});

// 2. FETCH (Bagian Penting)
self.addEventListener('fetch', (event) => {
  // A. Abaikan request ke API eksternal
  if (event.request.url.includes('http') === false || 
      event.request.url.includes('firestore') || 
      event.request.url.includes('googleapis')) {
    return;
  }

  // B. STRATEGI NAVIGASI (HTML): NETWORK FIRST
  // Ini agar saat buka aplikasi, dia selalu cek versi terbaru.
  // Jika internet mati, baru ambil dari cache (Offline Mode).
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // C. STRATEGI ASET (JS/CSS/GAMBAR): NETWORK ONLY
  // Kita TIDAK menyimpan JS/CSS di Service Worker Cache Storage.
  // Kita kembalikan langsung ke jaringan. Browser punya "HTTP Cache" sendiri yang lebih pintar
  // menangani file hashed (file dengan nama acak) dari Vite.
  // Ini MENGHILANGKAN error "ChunkLoadError" / "File Not Found".
  event.respondWith(
    fetch(event.request)
  );
});

// 3. ACTIVATE
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
