// Intercept all addEventListener calls to wrap the fetch handler and programmatically inject COOP/COEP headers!
const originalAddEventListener = self.addEventListener;
self.addEventListener = function(type, listener, options) {
  if (type === 'fetch') {
    const wrappedListener = function(event) {
      const originalRespondWith = event.respondWith;
      event.respondWith = function(responsePromise) {
        event._respondWithCalled = true;
        const modifiedPromise = Promise.resolve(responsePromise).then(response => {
          if (!response || response.status === 0) {
            return response;
          }
          const newHeaders = new Headers(response.headers);
          newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
          newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
          newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
        });
        return originalRespondWith.call(event, modifiedPromise);
      };
      return listener.call(this, event);
    };
    return originalAddEventListener.call(this, type, wrappedListener, options);
  }
  return originalAddEventListener.call(this, type, listener, options);
};

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');
importScripts('https://cdn.jsdelivr.net/npm/idb@8/build/umd.js');

const CACHE_NAME = 'nexus-ide-v5.5.0';

if (workbox) {
  console.log('Nexus 5.5.0 Service Worker Active');

  // Pre-cache core assets for offline use
  workbox.precaching.precacheAndRoute([
    {url: './', revision: '5.5.0'},
    {url: 'index.html', revision: '5.5.0'},
    {url: 'manifest.json', revision: '5.5.0'},
  ]);

  // Cache-first for images and fonts
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image' || request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: 'nexus-assets-v5',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // Stale-while-revalidate for scripts and styles
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'script' || request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'nexus-code-v5',
    })
  );

  // Network-first for documents (index.html)
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'document',
    new workbox.strategies.NetworkFirst({
      cacheName: 'nexus-pages-v5',
    })
  );

  // Cache API responses for AI providers (short TTL)
  workbox.routing.registerRoute(
    ({url}) => url.hostname.includes('generativelanguage.googleapis.com') ||
               url.hostname.includes('api.openai.com') ||
               url.hostname.includes('api.anthropic.com'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'nexus-api-v5',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        }),
      ],
    })
  );

  // Handle messages from client
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
}
else {
  // Fallback to manual cache if Workbox fails
  self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
}

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fallback fetch listener to handle any requests not matched by Workbox and inject COOP/COEP headers
self.addEventListener('fetch', (event) => {
  if (!event._respondWithCalled) {
    const r = event.request;
    if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
      return;
    }
    event.respondWith(
      fetch(r).then(response => {
        if (response.status === 0) {
          return response;
        }
        const newHeaders = new Headers(response.headers);
        newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
        newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }).catch(err => {
        // Fallback to cache match if offline
        return caches.match(r).then(cachedResponse => {
          if (cachedResponse) {
            const newHeaders = new Headers(cachedResponse.headers);
            newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
            newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
            newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
            return new Response(cachedResponse.body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: newHeaders
            });
          }
          throw err;
        });
      })
    );
  }
});
