// sw.js — tiny offline cache so the app installs as a real PWA and works
// without a network. Bump CACHE when you change any cached file.
const CACHE = "pitchperfect-v8";
const ASSETS = [
  "./", "./index.html", "./style.css",
  "./chords.js", "./audio.js", "./fx.js", "./app.js", "./vendor/Tone.js",
  "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
];
// Piano samples are cached on first play via the runtime network-first handler.

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first so edits show up when online; fall back to cache offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});
