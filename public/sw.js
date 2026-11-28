const CACHE = 'vida-shell-v6-goal-order';
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) =>
        c.addAll([
          '/',
          '/style.css',
          '/app.js',
          '/domain.js',
          '/icon.svg',
          '/scene.svg',
          '/cover-autumn.png',
        ]),
      ),
  );
  self.skipWaiting();
});
self.addEventListener('activate', (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener('fetch', (event) => {
  const u = new URL(event.request.url);
  if (
    u.origin !== self.location.origin ||
    u.pathname.startsWith('/api/') ||
    event.request.method !== 'GET'
  )
    return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
