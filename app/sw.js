// Service Worker: hält die App offline verfügbar.
// Strategie "Netz zuerst": online kommt immer die neueste Version,
// offline die zuletzt geladene aus dem Cache.

const CACHE = 'time-v1';
const DATEIEN = [
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  './js/ui.js',
  './js/rechner.js',
  './js/bloecke.js',
  './js/speicher.js',
  './js/format.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((antwort) => {
        if (antwort.ok) {
          const kopie = antwort.clone();
          caches.open(CACHE).then((c) => c.put(e.request, kopie));
        }
        return antwort;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
