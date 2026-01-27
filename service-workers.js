/* eslint-disable no-restricted-globals */

// UPDATE VERSI: v7 (Setiap kali deploy ulang, ganti angka ini agar HP user mau update)
const CACHE_NAME = 'kelas3-biodata-v7-anti-error';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. INSTALL: Cache file inti
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching core files');
        return cache.addAll(urlsToCache);
      })
  );
  // PENTING: Paksa SW baru untuk segera mengambil alih tanpa menunggu browser restart
  self.skipWaiting();
});

// 2. FETCH: Strategi Cerdas untuk Mencegah Error Layar Putih
self.addEventListener('fetch', (event) => {
  // Abaikan request ke API eksternal (Firestore, Google, dll)
  if (
      event.request.url.includes('firestore') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('githubusercontent')
  ) {
    return;
  }

  // KHUSUS NAVIGASI HALAMAN (HTML):
  // Gunakan "Network First" -> Coba ambil dari internet dulu.
  // Ini mencegah aplikasi memuat file HTML basi yang menunjuk ke JS yang sudah hilang.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Jika internet mati total, baru ambil dari cache
          return caches.match('/index.html');
        })
    );
    return;
  }

  // UNTUK ASET LAIN (Gambar, JS, CSS):
  // Gunakan "Cache First" -> Ambil dari cache dulu biar cepat.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// 3. ACTIVATE: Hapus Cache Versi Lama (v4, v5, v6, dll)
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
             console.log('SW: Membersihkan cache usang:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
