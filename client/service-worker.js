const CACHE_NAME = 'my-website-cache-v7';
const OFFLINE_FALLBACK_PAGE = '/offline.html';

const allowedHosts = ['yourdomain.com', 'educational-umber.vercel.app'];

const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  // Only cache public assets, avoid sensitive resources
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
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
  const requestURL = new URL(event.request.url);

  // 1. Scope Limitation: Limit the service worker scope to specific directories or paths
  if (!requestURL.pathname.startsWith('/your/specific/path/')) {
    return; // Skip handling for requests outside the specific path
  }

  // 2. Origin Validation: Only cache resources from allowed origins
  if (!allowedHosts.includes(requestURL.host)) {
    return; // Skip caching requests from untrusted origins
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache-first strategy
        if (response) {
          return response; // Return the cached response if available
        }

        // 3. Check for HTTPS: Ensure the service worker runs on a secure origin
        if (!requestURL.protocol.startsWith('https')) {
          return fetch(event.request); // Fetch non-secure requests directly
        }

        return fetch(event.request) // Otherwise, fetch from the network
          .then(fetchResponse => {
            // 4. Fetch Event Validation: Validate request origin and method
            if (
              !fetchResponse ||
              !fetchResponse.ok ||
              fetchResponse.type !== 'basic' ||
              event.request.method !== 'GET'
            ) {
              return fetchResponse;
            }

            // Clone the response to cache and return the original response
            const clonedResponse = fetchResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, clonedResponse));
            return fetchResponse;
          })
          .catch(error => {
            // Show the offline fallback page if the request fails to fetch
            console.error('Fetch error:', error);
            return caches.match(OFFLINE_FALLBACK_PAGE);
          });
      })
  );
});
