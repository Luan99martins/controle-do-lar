const CACHE = 'controle-lar-v1';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['/','/manifest.webmanifest','/icon-192.png'])));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => {
      if(res.ok) { const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit=>hit || caches.match('/'))));
  } else {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if(res.ok) { const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); }
      return res;
    })));
  }
});
