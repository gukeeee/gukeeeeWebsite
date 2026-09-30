/* ==========================================================================
   gukeeee — service worker
   Bumping VERSION replaces the cache wholesale on the next load (old caches
   are deleted in activate) — the simplest correct invalidation for a small
   static site, no per-file versioning needed.
   ========================================================================== */

const VERSION = "v2";
const CACHE_NAME = `gukeeee-${VERSION}`;

// Cloudflare Pages redirects "*.html" URLs to their clean equivalent
// ("/verbos.html" -> "/verbos", a 308) — precache the clean URLs directly,
// not the ones that redirect (see the fetch handler below for why a
// redirected response is actively dangerous to precache, not just wasteful).
const APP_SHELL = [
  "/", "/verbos", "/chequeo", "/sports",
  "/theme.css", "/verbos.css", "/chequeo.css", "/sports.css",
  "/auth.js", "/header.js", "/settings.js", "/verbStore.js", "/conjugator.js", "/verbos.js", "/chequeo.js",
  "/verbDataset.json",
  "/manifest.json",
  "/logo.png", "/logo-192.png", "/logo-512.png",
];

self.addEventListener("install", (event) => {
  // Individual cache.add() calls via allSettled instead of cache.addAll() —
  // addAll is all-or-nothing, so one unexpectedly missing/redirecting URL
  // would silently break precaching for every other file (this is exactly
  // how the site went down: a handful of redirecting .html URLs in the list
  // made the whole install fail, leaving no service worker in control —
  // except when an old broken one was already active, see below).
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
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

// Chrome refuses to fulfill a navigation request with a redirected Response
// via respondWith() (it fails the whole navigation with a network error) —
// this is what actually took the site down: a request for a URL Cloudflare
// redirects (like the old "/verbos.html") got its redirected response cached
// and later replayed for a navigation. Precaching only clean URLs (above)
// avoids that in practice, but this strips the redirected flag from
// anything before it's ever handed to respondWith(), so a stray old
// bookmark or link can't reproduce the same failure.
function deredirect(response) {
  if (!response || !response.redirected) return response;
  return new Response(response.body, response);
}

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
            return deredirect(res);
          })
          .catch(() => cached);
        return cached ? deredirect(cached) : network;
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
