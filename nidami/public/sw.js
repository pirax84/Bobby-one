// NOTIIF : fonctionne aussi sans réseau une fois ouvert une première fois.
const C = "cercle-v320";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(C).then((c) => c.addAll(["./", "./icon-192.png", "./manifest.webmanifest"]).catch(() => {}))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin) || e.request.headers.has("range") || /\.mp4$/.test(e.request.url)) return;
  e.respondWith(fetch(e.request, e.request.mode === "navigate" || /\/(sw\.js|index\.html)?$/.test(e.request.url) ? { cache: "no-cache" } : undefined).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match("./"))));
});
// Notification envoyée par le serveur alors que le navigateur ou l'onglet est fermé (ordinateur).
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((l) => {
    // Appli déjà ouverte et visible : elle s'occupe elle-même du son et de l'affichage.
    if (l.some((c) => c.visibilityState === "visible")) return;
    return self.registration.showNotification(d.title || "NOTIIF", { body: d.body || "", icon: "./icon-192.png", badge: "./badge-96.png", tag: d.tag || "notiif", renotify: true, data: { conv: d.conv || "" } });
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const conv = (e.notification.data && e.notification.data.conv) || "";
  const url = conv ? "./#open=" + conv : "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((l) => {
    if (l[0]) { if (conv) l[0].postMessage({ notiifOpen: conv }); return l[0].focus(); }
    return self.clients.openWindow(url);
  }));
});
