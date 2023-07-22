const CACHE_NAME = 'my-website-cache-v4';
const OFFLINE_FALLBACK_PAGE = '/offline.html';

const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/server/server.js',
  'https://educational-umber.vercel.app/'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache, falling back to network strategy
        return response || fetch(event.request)
          .then(fetchResponse => {
            // Check if we received a valid response
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // Clone the response to cache and return the original response
            const clonedResponse = fetchResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, clonedResponse));
            return fetchResponse;
          })
          .catch(error => {
            // Show the offline fallback page if the request is not in cache and fails to fetch
            console.error('Fetch error:', error);
            return caches.match(OFFLINE_FALLBACK_PAGE);
          });
      })
  );
});
