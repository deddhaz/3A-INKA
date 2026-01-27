/* eslint-disable no-restricted-globals */

// UPDATE VERSI: v8 (Versi dengan Dynamic Caching agar file JS tersimpan)
const CACHE_NAME = 'kelas3-biodata-v8-dynamic';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. INSTALL: Cache file inti (index.html & manifest)
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

// 2. FETCH: Strategi Network First untuk HTML, Dynamic Cache untuk Aset
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // A. Abaikan request ke API eksternal (Firestore, Google, dll)
  if (
      requestUrl.protocol.startsWith('http') === false || // Abaikan chrome-extension:// dll
      requestUrl.href.includes('firestore') || 
      requestUrl.href.includes('googleapis') ||
      requestUrl.href.includes('githubusercontent')
  ) {
    return;
  }

  // B. KHUSUS NAVIGASI HALAMAN (HTML): Network First
  // Coba ambil HTML terbaru dari internet. Kalau gagal, baru pakai cache lama.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // C. UNTUK ASET (JS, CSS, Gambar): Stale-While-Revalidate / Dynamic Cache
  // Cek cache dulu. Kalau gak ada, ambil internet LALU SIMPAN ke cache (PENTING!)
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Jika ada di cache, kembalikan langsung (cepat)
          return cachedResponse;
        }

        // Jika tidak ada di cache, ambil dari internet
        return fetch(event.request).then((networkResponse) => {
          // Pastikan respon valid sebelum disimpan
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Kloning respon karena stream hanya bisa dibaca sekali
          const responseToCache = networkResponse.clone();

          // Simpan file JS/CSS yang baru didownload ke dalam cache
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
  );
});

// 3. ACTIVATE: Hapus Cache Versi Lama
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
