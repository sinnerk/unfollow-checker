/**
 * Unfollow Checker — offline cache.
 *
 * The privacy promise is "switch your network off and import the file". A
 * service worker makes that literally true: after the first visit, every
 * asset this page needs lives in the cache and no request has to succeed.
 *
 * Bump UC_CACHE_VERSION whenever any cached file changes — the old cache is
 * dropped on activate and the new one is filled on install.
 */
const UC_CACHE_VERSION = "uc-v1";
const PRECACHE = [
  "./",
  "app.html",
  "tutorials.html",
  "privacy.html",
  "404.html",
  "assets/site.css",
  "assets/icon.png",
  "assets/og.png",
  "js/parse.js",
  "js/app.js",
  "vendor/jszip.min.js",
  "manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(UC_CACHE_VERSION);
      // One missing file must not take the whole install down.
      await Promise.allSettled(
        PRECACHE.map((path) =>
          cache.add(new Request(path, { cache: "reload" })).catch(() => {}),
        ),
      );
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name !== UC_CACHE_VERSION)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let everything else through untouched

  // Navigations: try the network first (so deploys show up immediately),
  // fall back to whatever we have cached so the page still opens offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(UC_CACHE_VERSION);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const hit =
            (await caches.match(request, { ignoreSearch: true })) ||
            (await caches.match("app.html", { ignoreSearch: true })) ||
            (await caches.match("./"));
          return hit || Response.error();
        }
      })(),
    );
    return;
  }

  // Static assets: cache-first. GitHub Pages assets only change when a new
  // version of the site is deployed, and that bumps UC_CACHE_VERSION.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const fresh = await fetch(request);
        if (fresh.ok) {
          const cache = await caches.open(UC_CACHE_VERSION);
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        return Response.error();
      }
    })(),
  );
});
