const CACHE_NAME = 'storyforge-v1';
const STATIC_CACHE = 'storyforge-static-v1';
const DYNAMIC_CACHE = 'storyforge-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/vite.svg',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
  
  // Force activate new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  
  // Take control of all clients
  self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and requests from other origins
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }
        
        // Clone the request for caching
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then((response) => {
            // Check if response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response for caching
            const responseClone = response.clone();
            
            // Cache dynamic resources
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                console.log('[SW] Caching dynamic resource:', event.request.url);
                cache.put(event.request, responseClone);
              });
            
            return response;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);
            
            // Try to serve a cached fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            throw error;
          });
      })
  );
});

// Handle model downloads and caching
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_MODEL':
      handleModelCache(data)
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          console.error('[SW] Model caching failed:', error);
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo()
        .then((info) => {
          event.ports[0].postMessage({ success: true, data: info });
        })
        .catch((error) => {
          console.error('[SW] Failed to get cache info:', error);
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'CLEAR_CACHE':
      clearCaches()
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          console.error('[SW] Failed to clear caches:', error);
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
  }
});

async function handleModelCache(modelData) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const response = new Response(modelData.weights, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-Model-ID': modelData.id,
      'X-Model-Version': modelData.version
    }
  });
  
  await cache.put(`/models/${modelData.id}`, response);
  console.log('[SW] Cached model:', modelData.id);
}

async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {
    caches: cacheNames.length,
    totalSize: 0,
    models: 0
  };
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const size = await response.blob().then(blob => blob.size);
        info.totalSize += size;
        
        if (request.url.includes('/models/')) {
          info.models++;
        }
      }
    }
  }
  
  return info;
}

async function clearCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('[SW] All caches cleared');
}