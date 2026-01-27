/* eslint-disable no-restricted-globals */

// UPDATE VERSI: v9 (Network First - Solusi Paling Stabil untuk Error Chunk/File Hilang)
const CACHE_NAME = 'kelas3-biodata-v9-stable';

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
  self.skipWaiting();
});

// 2. FETCH: STRATEGI NETWORK FIRST (INTERNET DULU) UNTUK SEMUA REQUEST
// Ini akan memperbaiki error karena aplikasi selalu mengambil file asli dari server.
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // A. Abaikan request ke API eksternal (Firestore, Google, dll)
  if (
      requestUrl.protocol.startsWith('http') === false ||
      requestUrl.href.includes('firestore') || 
      requestUrl.href.includes('googleapis') ||
      requestUrl.href.includes('githubusercontent')
  ) {
    return;
  }

  // B. NETWORK FIRST: Coba ambil dari internet dulu untuk SEMUA request
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 1. Jika berhasil konek internet dan file ada:
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          // Kloning respon untuk disimpan di cache (buat cadangan offline)
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        // Kembalikan file asli dari internet
        return networkResponse;
      })
      .catch(() => {
        // 2. Jika internet MATI atau GAGAL: Ambil dari cache
        console.log('SW: Internet mati, ambil dari cache:', event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Jika tidak ada di cache juga (dan itu halaman HTML), tampilkan fallback (opsional)
          if (event.request.mode === 'navigate') {
             return caches.match('/index.html');
          }
        });
      })
  );
});

// 3. ACTIVATE: Bersihkan semua cache lama agar tidak ada file basi yang tertinggal
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
             console.log('SW: Hapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
