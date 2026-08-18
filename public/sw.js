// Service Worker para JP Carpintaria PWA
const CACHE_NAME = 'jp-carpintaria-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/favicon.svg'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Alguns arquivos estáticos não puderam ser cacheados imediatamente:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Fetch: Network-First com Fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET e chamadas do Firebase/Firestore WebSocket
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Não interceptar Google APIs ou Firestore backend para não conflitar com offline persistence nativa do SDK
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('identitytoolkit.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a resposta for válida, armazena uma cópia no cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se a rede falhar (offline), busca do cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se for navegação de página html, retorna a raiz
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html') || caches.match('/');
          }
          return new Response('Offline - Conteúdo não disponível no cache', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
