// GharShala – Home Learning Environment Mapper
// Service Worker for Offline-First PWA
// Author: Mateen Yousuf – School Education Department, J&K
// Aligned with: NEP 2020 | NCF 2023 | FLN Mission | Samagra Shiksha

const CACHE_NAME = 'gharshala-v1.0';
const OFFLINE_PAGE = './index.html';

const CACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './author.jpg',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Caveat:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap',
];

// ===== INSTALL =====
self.addEventListener('install', event => {
  console.log('[GharShala SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[GharShala SW] Caching core assets');
        const localAssets = CACHE_ASSETS.filter(u => !u.startsWith('http') || u.includes('fonts.googleapis'));
        return cache.addAll(localAssets);
      })
      .then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', event => {
  console.log('[GharShala SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ===== FETCH – Offline First =====
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) return response;
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
            return response;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
          });
      })
  );
});

// ===== BACKGROUND SYNC – Student Data =====
self.addEventListener('sync', event => {
  if (event.tag === 'sync-home-profiles') {
    event.waitUntil(syncHomeProfiles());
  }
  if (event.tag === 'sync-guidance-logs') {
    event.waitUntil(syncGuidanceLogs());
  }
});

async function syncHomeProfiles() {
  console.log('[GharShala SW] Syncing home environment profiles...');
  // In production: POST /home-profile endpoint
}

async function syncGuidanceLogs() {
  console.log('[GharShala SW] Syncing guidance completion logs...');
  // In production: POST /guidance-log endpoint
}

// ===== PUSH NOTIFICATIONS =====
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Time for your child\'s daily learning tip! 💡',
    icon: './manifest.json',
    badge: './manifest.json',
    tag: 'gharshala-daily',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || './' },
    actions: [
      { action: 'view', title: '📋 View Guidance' },
      { action: 'dismiss', title: 'Later' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'GharShala Daily Reminder', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action !== 'dismiss') {
    event.waitUntil(clients.openWindow(event.notification.data?.url || './'));
  }
});

console.log('[GharShala SW] Service Worker ready ✅ – Offline-First, NEP 2020 Aligned');
