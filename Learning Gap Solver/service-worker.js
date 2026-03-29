// ============================================================
// SERVICE WORKER — Learning Level Gap Solver PWA
// Caches all app files for full offline functionality
// ============================================================

const CACHE_NAME = 'llg-solver-v1.0';

// Files to cache on install
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './author.jpg',
  './conceptual-background.html',
  './user-manual.html'
];

// ---- INSTALL: cache all files ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ---- ACTIVATE: clean old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ---- FETCH: serve from cache, fallback to network ----
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // Serve from cache
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache new requests dynamically
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // If both fail, return index.html as fallback
        return caches.match('./index.html');
      });
    })
  );
});
