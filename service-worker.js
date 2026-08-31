importScripts('./version.js');

const CACHE_NAME = 'ontable-cache-' + self.APP_VERSION;

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './version.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon-180.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Manual override: the app's "update" button calls reg.waiting.postMessage(...)
// with this message so a waiting new version takes over immediately instead
// of waiting for all tabs to close.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// index.html gets NETWORK-FIRST: since the browser's own update check only
// looks at service-worker.js's bytes (not files it imports, like version.js),
// a plain cache-first strategy here could keep serving a stale index.html
// indefinitely even after a real deploy. Other same-origin files (icons,
// manifest — which rarely change) stay cache-first for speed.
//
// Cross-origin calls (the Apps Script backend, Google Places) always go
// straight to the network, untouched by this service worker at all.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const isAppShell = event.request.mode === 'navigate' ||
    requestUrl.pathname.endsWith('/index.html') ||
    requestUrl.pathname.endsWith('/');

  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)) // offline fallback only
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
