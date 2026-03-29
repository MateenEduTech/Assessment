// AdaptLearn Service Worker
// Offline-first caching strategy

const CACHE_NAME = 'adaptlearn-v1.0.0';
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './author.jpg'
];

// Install event – cache all core assets
self.addEventListener('install', event => {
  console.log('[SW] Installing AdaptLearn Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(CACHE_URLS).catch(err => {
        console.warn('[SW] Some files could not be cached:', err);
      });
    }).then(() => {
      console.log('[SW] Install complete');
      return self.skipWaiting();
    })
  );
});

// Activate event – clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating AdaptLearn Service Worker...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log('[SW] Removing old cache:', key);
              return caches.delete(key);
            })
      );
    }).then(() => {
      console.log('[SW] Activate complete');
      return self.clients.claim();
    })
  );
});

// Fetch event – serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Serve from cache
        return cachedResponse;
      }

      // Try network
      return fetch(event.request).then(networkResponse => {
        // Cache new successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback – return index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        // Return a simple offline response for other requests
        return new Response('Offline – AdaptLearn is running from cache.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});

// Background sync for quiz scores (when back online)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scores') {
    console.log('[SW] Background sync: scores');
    // Sync logic can be added here if a backend is introduced
  }
});

// Push notifications (future feature)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'AdaptLearn';
  const options = {
    body: data.body || 'Keep learning! Your streak awaits.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || './'));
});
