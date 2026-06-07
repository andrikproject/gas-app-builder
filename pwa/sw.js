/* GAS App Builder - Service Worker */
const CACHE = 'gas-app-v1';
const FILES = [
  '/pwa/index.html', '/pwa/manifest.json',
  '/pwa/css/style.css',
  '/pwa/js/api.js', '/pwa/js/generator.js', '/pwa/js/app.js',
  '/pwa/icons/icon-192.png', '/pwa/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Network first for API, cache for static
  if (url.hostname === 'script.google.com' || url.hostname === 'generativelanguage.googleapis.com') {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({error:'offline'}), {status:503})));
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        if (res.ok && !url.pathname.includes('chrome-extension')) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }))
    );
  }
});
