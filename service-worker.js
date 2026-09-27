/* ==========================================================================
   gukeeee — service worker
   Bumping VERSION replaces the cache wholesale on the next load (old caches
   are deleted in activate) — the simplest correct invalidation for a small
   static site, no per-file versioning needed.
   ========================================================================== */

const VERSION = "v1";
const CACHE_NAME = `gukeeee-${VERSION}`;

const APP_SHELL = [
  "/", "/index.html", "/verbos.html", "/chequeo.html", "/sports.html", "/404.html",
  "/theme.css", "/verbos.css", "/chequeo.css", "/sports.css",
  "/auth.js", "/header.js", "/settings.js", "/verbStore.js", "/conjugator.js", "/verbos.js", "/chequeo.js",
  "/verbDataset.json",
  "/manifest.json",
  "/logo.png", "/logo-192.png", "/logo-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Same-origin app shell: stale-while-revalidate — answer instantly from
  // cache (so the app works offline and feels fast), then refresh the cache
  // in the background so the next load picks up anything new.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res.ok) caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // The verb Gist: network-first (so edits show up immediately while
  // online), falling back to the last cached copy offline. Cache key strips
  // verbStore.js's cache-busting "?_=timestamp" query param — otherwise
  // every request would be a distinct, never-reused cache entry.
  if (url.hostname === "gist.githubusercontent.com" || url.hostname === "api.github.com") {
    const cacheKey = new Request(url.origin + url.pathname);
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, res.clone()));
          return res;
        })
        .catch(() => caches.match(cacheKey))
    );
    return;
  }

  // Everything else (translation lookups, GitHub API writes) — no sensible
  // offline fallback, let it fail naturally.
});
