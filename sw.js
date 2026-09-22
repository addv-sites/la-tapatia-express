const CACHE_NAME = 'latapatia-shell-v2';
const scopeUrl = (path) => new URL(path, self.registration.scope).href;
const OFFLINE_URL = scopeUrl('offline.html');

const SHELL_ASSETS = [
  scopeUrl('./'),
  scopeUrl('index.html'),
  scopeUrl('css/site.css'),
  scopeUrl('src/config/site.js'),
  scopeUrl('manifest.webmanifest'),
  OFFLINE_URL
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Nunca cachear llamadas a Apps Script ni al snapshot de datos: precios y
  // disponibilidad no deben servirse obsoletos desde cache.
  const isDataRequest =
    url.hostname.includes('script.google.com') ||
    url.pathname.includes('/data/');

  if (isDataRequest) {
    event.respondWith(
      fetch(request).catch(() => new Response(
        JSON.stringify({ error: 'offline' }),
        { headers: { 'Content-Type': 'application/json' }, status: 503 }
      ))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Network-first para el resto del shell (CSS/JS/config): en un sitio que se
  // reconstruye seguido (precios, catálogo, estilos) cache-first dejaría a
  // los visitantes atorados en una versión vieja hasta un hard-refresh. Solo
  // cae a cache si de plano no hay red (offline real).
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
