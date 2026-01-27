/* eslint-disable no-restricted-globals */

// Kita ganti nama cache jadi 'v4-nofile' karena struktur file berubah (tidak ada gambar fisik)
const CACHE_NAME = 'kelas3-biodata-v4-nofile'; 

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
  // KITA HAPUS DAFTAR GAMBAR .png/.ico DI SINI
  // Karena sekarang gambarnya sudah berupa kode (Data URI) di dalam manifest & html
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache).catch(err => {
             console.error('Gagal cache file:', err);
        });
      })
  );
  self.skipWaiting();
});

// Cache and return requests
self.addEventListener('fetch', (event) => {
  if (
      event.request.url.includes('firestore') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('githubusercontent')
  ) {
    return;
  }

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

// Update Service Worker & Hapus Cache Lama
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
             console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
