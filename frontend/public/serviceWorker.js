const CACHE_NAME = 'inventory-management-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap'
];

// Function to handle failed requests
const handleFetchError = (error) => {
  console.error('[ServiceWorker] Fetch failed:', error);
  return new Response('Offline', {
    status: 200,
    headers: new Headers({
      'Content-Type': 'text/plain',
    }),
  });
};

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[ServiceWorker] Cache failed:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip caching for API requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        // Clone the request because it can only be used once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Check if the response is from the same origin or Google Fonts
            if (event.request.url.startsWith(self.location.origin) ||
                event.request.url.startsWith('https://fonts.googleapis.com')) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch((error) => {
                  console.error('[ServiceWorker] Cache put failed:', error);
                });
            }

            return response;
          })
          .catch(handleFetchError);
      })
      .catch(handleFetchError)
  );
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  // Take control of all clients immediately
  event.waitUntil(Promise.all([
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }),
    // Take control of all clients immediately
    self.clients.claim()
  ]));
}); 