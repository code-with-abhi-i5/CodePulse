/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'codepulse-offline-v1';
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-dark.svg',
  '/favicon-light.svg',
];

// Install Event: Precache static assets with resilient fallback
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(PRECACHE_URLS);
      } catch {
        // Resilient fallback: cache available assets so a single missing resource does not abort installation
        await Promise.allSettled(
          PRECACHE_URLS.map(async (url) => {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
            }
          }),
        );
      }
    }).then(() => {
      return self.skipWaiting();
    }),
  );
});

// Activate Event: Cleanup stale caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      );
    }).then(() => {
      return self.clients.claim();
    }),
  );
});

// Fetch Event: Network-First with Cache Fallback for problem data and static assets
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);

  // Skip non-GET or mutation API endpoints (handled by mutation queue)
  if (event.request.method !== 'GET') return;

  if (url.pathname.startsWith('/api/problems') || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(JSON.stringify({ offline: true, error: 'Network unavailable' }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
            });
          });
        }),
    );
  }
});

// Sync Event: Service Worker Background Sync API (Chromium / Edge / Android)
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'codepulse-mutation-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        for (const client of clients) {
          client.postMessage({
            type: 'TRIGGER_BACKGROUND_SYNC',
            timestamp: Date.now(),
          });
        }
      }),
    );
  }
});

// Message Event: Manual sync trigger from application UI
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

export {};
