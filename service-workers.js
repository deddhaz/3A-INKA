/* eslint-disable no-restricted-globals */

// Nama cache aplikasi Anda
const CACHE_NAME = 'kelaskita-biodata-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  // Tambahkan aset lain jika perlu (seperti logo)
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', (event) => {
  // Untuk request Firestore/API, kita bypass cache agar data selalu update
  if (event.request.url.includes('firestore') || event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Update Service Worker
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
    })
  );
});
