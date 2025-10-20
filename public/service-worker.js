
const CACHE_NAME = 'young-meeat-offline-v1';
const OFFLINE_URL = '/remote-streaming-control-hub.html';

// Files to cache for offline use
const CACHE_FILES = [
  '/',
  '/remote-streaming-control-hub.html',
  '/js/api-config.js',
  '/mobile-index.html',
  '/services-index.html',
  '/public-unified-view.html',
  '/index.html'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching files');
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();
        
        // Cache the fetched response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // If fetch fails, try to serve from cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          
          // If HTML page and not in cache, serve offline page
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match(OFFLINE_URL);
          }
          
          // For API requests, return offline JSON response
          if (event.request.url.includes('/remote-streaming-control/')) {
            return new Response(
              JSON.stringify({
                success: false,
                offline: true,
                message: 'Currently offline - cached data may be available'
              }),
              {
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        });
      })
  );
});
