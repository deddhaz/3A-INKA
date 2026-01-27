/* eslint-disable no-restricted-globals */

// Versi Cache (Ganti nama jika update kode)
const CACHE_NAME = 'kelas6c-biodata-v5-final';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Cache and return requests
self.addEventListener('fetch', (event) => {
  // Bypass cache untuk request Firestore/API
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
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
