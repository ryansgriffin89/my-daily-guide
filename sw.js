const CACHE_NAME = "mdg-app-v2"; // Changed version to force update
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./guide.json",
  "./manifest.webmanifest"
];

// Install: Cache core files
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force this SW to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: NETWORK FIRST, then Cache (Fixes the "Stale Data" bug)
self.addEventListener("fetch", (event) => {
  // For the JSON guide, always try network first
  if (event.request.url.includes("guide.json")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // For everything else (CSS/JS), try network, fall back to cache
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
