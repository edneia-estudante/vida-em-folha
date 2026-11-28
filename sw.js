const scope = new URL(self.registration.scope);
const prefix = `vida-em-folha:${scope.pathname}:`;
const CACHE = prefix + 'v7-pages';
const shell = [
  '.',
  'index.html',
  'style.css',
  'app.js',
  'domain.js',
  'api-client.js',
  'site-config.js',
  'icon.svg',
  'scene.svg',
  'cover-autumn.png',
  'manifest.webmanifest',
].map((path) => new URL(path, scope).href);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(shell)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                (key.startsWith(prefix) && key !== CACHE) ||
                (scope.pathname === '/' && key.startsWith('vida-shell-')),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.origin !== scope.origin ||
    !url.pathname.startsWith(scope.pathname) ||
    url.pathname.startsWith('/api/')
  )
    return;
  event.respondWith(
    fetch(event.request).catch(async () => (await caches.match(event.request)) || Response.error()),
  );
});
