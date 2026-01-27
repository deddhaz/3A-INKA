/* eslint-disable no-restricted-globals */

// UPDATE VERSI: v12 (Safety First - SPA & PWA Ready)
const CACHE_NAME = 'kelas3-biodata-v12-safety';

// Hanya cache file inti untuk offline dasar
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

/* =======================
   1. INSTALL
======================= */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching core assets');
      return cache.addAll(
        CORE_ASSETS.map(
          (url) => new Request(url, { cache: 'reload' })
        )
      );
    })
  );

  // Langsung aktifkan versi baru
  self.skipWaiting();
});

/* =======================
   2. FETCH
======================= */
self.addEventListener('fetch', (event) => {
  // Abaikan request non-GET & API eksternal
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('firestore') ||
    event.request.url.includes('googleapis')
  ) {
    return;
  }

  // A. NAVIGASI (HTML / SPA Route)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Jika server return 404 / error → fallback ke index.html
          if (!response || response.status !== 200) {
            return caches.match('/index.html');
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // B. ASET (JS / CSS / IMG)
  // Network only → biarkan HTTP cache browser bekerja
  event.respondWith(fetch(event.request));
});

/* =======================
   3. ACTIVATE
======================= */
self.addEventListener('activate', (event) => {
  const whitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (!whitelist.includes(name)) {
            console.log('SW: Deleting old cache', name);
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});
