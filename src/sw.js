// Service Worker for box.cric PWA
const CACHE_NAME = 'boxcric-v4';
const STATIC_ASSETS = [
    '/',
    '/index.html'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Force activate immediately
    self.skipWaiting();
});

// Activate - clean up old caches and take control
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => {
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// Fetch - network first for everything, cache only static assets
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // ALWAYS skip API calls - never cache, never intercept
    const url = event.request.url;
    if (url.includes('wisden.com') ||
        url.includes('workers.dev') ||
        url.includes('wikipedia.org') ||
        url.includes('flagcdn.com')) {
        // Let browser handle it directly
        return;
    }

    // For other requests - network first with cache fallback
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Only cache successful responses for static assets
                if (response.ok && (url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.html') || url === '/')) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache only for navigation
                return caches.match(event.request);
            })
    );
});
