/**
 * 武軒冷氣 Service Worker
 * 提供離線支援和快取功能
 */

const CACHE_NAME = 'hvac-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/app.js',
    '/installer.html',
    '/installer.js',
    'https://cdn.tailwindcss.com'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] 安裝中...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] 快取檔案');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('[Service Worker] 快取失敗:', error);
            })
    );
    // 強制立即啟用
    self.skipWaiting();
});

// 啟用 Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] 啟用中...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] 刪除舊快取:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// 攔截請求
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 快取命中，返回快取內容
                if (response) {
                    return response;
                }

                // 否則發出網路請求
                return fetch(event.request)
                    .then((response) => {
                        // 檢查是否為有效回應
                        if (!response || response.status !== 200 || response.type === 'opaque') {
                            return response;
                        }

                        // 複製回應以便快取
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // 網路失敗時返回離線頁面
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// 監聽訊息
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
