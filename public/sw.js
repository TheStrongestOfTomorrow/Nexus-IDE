importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');
importScripts('https://cdn.jsdelivr.net/npm/idb@8/build/umd.js');

const CACHE_NAME = 'nexus-ide-v4.3.6';

if (workbox) {
  console.log('Nexus 4.3.6 Service Worker Active');

  // Pre-cache core assets for offline use
  workbox.precaching.precacheAndRoute([
    {url: './', revision: '4.3.6'},
    {url: 'index.html', revision: '4.3.6'},
    {url: 'manifest.json', revision: '4.3.6'},
  ]);

  // Cache-first for images and fonts
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image' || request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: 'nexus-assets-v4',
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
      cacheName: 'nexus-code-v4',
    })
  );

  // Network-first for documents (index.html)
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'document',
    new workbox.strategies.NetworkFirst({
      cacheName: 'nexus-pages-v4',
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
