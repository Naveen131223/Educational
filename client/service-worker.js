const CACHE_NAME = 'my-website-cache-v3';
const urlsToCache = [
  '/index.html',
  '/css/style.css',
  '/js/script.js',
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
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        // If the request is not cached, fetch it from the network
        return fetch(event.request)
          .then(response => {
            // Clone the response to cache and return the original response
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, clonedResponse));
            return response;
          })
          .catch(error => {
            console.error('Fetch error:', error);
          });
      })
  );
}); 
