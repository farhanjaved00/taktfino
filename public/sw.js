// Minimal service worker: makes the site installable (PWA) and keeps tools usable offline.
// Static assets: cache-first. Pages: network-first with offline fallback to the cached copy.
const VERSION = 'v1';
const ASSETS = `assets-${VERSION}`;
const PAGES = `pages-${VERSION}`;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => ![ASSETS, PAGES].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/_astro/') || /\.(woff2?|png|svg|ico)$/.test(url.pathname)) {
    e.respondWith(caches.open(ASSETS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); if (res.ok) caches.open(PAGES).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req).then((hit) => hit || caches.match('/de/'))));
  }
});
