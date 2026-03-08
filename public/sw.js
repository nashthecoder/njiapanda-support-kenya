const CACHE_NAME = "njiapanda-safety-v1";
const SAFETY_URLS = [
  "/safety",
  "/src/pages/Safety.tsx",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SAFETY_URLS).catch(() => {
        // Some URLs may fail on first install, that's ok
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only intercept navigation requests to /safety
  if (event.request.mode === "navigate" && url.pathname === "/safety") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the response for offline use
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline — serve from cache
          return caches.match(event.request).then((cached) => {
            return cached || new Response("Offline — page not cached yet", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            });
          });
        })
    );
    return;
  }

  // For other requests on the /safety page, try network first, fall back to cache
  if (url.pathname.includes("safety") || url.pathname === "/") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
