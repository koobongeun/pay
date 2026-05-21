const CACHE_NAME = 'myfinance-v2';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 설치: 핵심 파일만 캐시
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting(); // 즉시 활성화
    })
  );
});

// 활성화: 구버전 캐시 전부 삭제
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim(); // 즉시 모든 클라이언트 제어
    })
  );
});

// 요청 처리: 네트워크 우선 → 실패 시 캐시
self.addEventListener('fetch', function(event) {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      if (!response || response.status !== 200) return response;
      var toCache = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(event.request, toCache);
      });
      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
