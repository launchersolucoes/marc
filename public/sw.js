const STATIC_CACHE = "marc-static-v1";
const OFFLINE_URL = "/offline";
const APP_SHELL = [OFFLINE_URL, "/icon.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("marc-") && key !== STATIC_CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

async function cachedAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  const isVersionedStaticAsset = url.pathname.startsWith("/_next/static/");
  const isPublicAsset = url.pathname.startsWith("/assets/") || ["/icon.png", "/manifest.webmanifest"].includes(url.pathname);
  if (isVersionedStaticAsset || isPublicAsset) event.respondWith(cachedAsset(request));
});
