// ExplorationSE Regen – Service Worker: App-Hülle offline verfügbar, Radardaten und Karten immer direkt aus dem Netz
const C = 'regen-v5', SHELL = ['./', './index.html', './app.js', './vendor/maplibre-gl.mjs', './vendor/maplibre-gl-worker.mjs', './vendor/maplibre-gl.css', './fonts/explorationse-regen.woff2', './icons/favicon-v3-32.png', './icons/icon-v3-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || u.pathname.endsWith('.webmanifest') || u.pathname.includes('/icons/')) return; // Browser lädt direkt
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request)));
});
