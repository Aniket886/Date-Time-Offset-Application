const CACHE_NAME = "timeoffset-pwa-v1";
const STATIC_ASSETS = [
    "/",
    "/static/offset_app/live_clock.js",
    "/static/offset_app/world_time.js",
    "/static/pwa/offline.html",
];

const TIMEZONES_CACHE = "timeoffset-timezones-v1";
const API_CACHE_DURATION = 24 * 60 * 60 * 1000;

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== TIMEZONES_CACHE)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== "GET") {
        return;
    }

    if (url.pathname.startsWith("/api/timezones/")) {
        event.respondWith(cacheFirstWithExpiration(request, TIMEZONES_CACHE, API_CACHE_DURATION));
        return;
    }

    if (url.pathname.startsWith("/api/")) {
        event.respondWith(networkFirst(request));
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            caches.match(request).then((cached) => {
                return cached || fetch(request).catch(() => caches.match("/static/pwa/offline.html"));
            })
        );
        return;
    }

    event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error("Fetch failed:", error);
        throw error;
    }
}

async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw error;
    }
}

async function cacheFirstWithExpiration(request, cacheName, maxAge) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        const cachedDate = cached.headers.get("x-cached-date");
        const age = Date.now() - new Date(cachedDate).getTime();
        if (age < maxAge) {
            return cached;
        }
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const headers = new Headers(networkResponse.headers);
            headers.set("x-cached-date", new Date().toISOString());
            const responseToCache = new Response(networkResponse.body, {
                status: networkResponse.status,
                statusText: networkResponse.statusText,
                headers: headers,
            });
            cache.put(request, responseToCache);
        }
        return networkResponse;
    } catch (error) {
        if (cached) return cached;
        throw error;
    }
}
