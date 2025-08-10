const CACHE_NAME = 'apk-store-cache-v1';
const ASSETS_TO_CACHE = [
  '/frontend/index.html',
  '/frontend/style.css',
  '/frontend/script.js',
  '/frontend/profile.html',
  '/frontend/admin.html',
  '/frontend/developer.html',
  '/frontend/login.html',
  '/frontend/settings.html',
  '/frontend/icons/icon-192.png',
  '/frontend/icons/icon-512.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching app assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Fetch requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
