const C = "bobby-v20";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(C).then((c) => c.addAll(["/"])).catch(() => {})); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u0 = new URL(e.request.url);
  if (e.request.method === "POST" && u0.origin === self.location.origin && u0.pathname === "/share-target") {
    e.respondWith((async () => {
      try {
        const f = await e.request.formData(); const text = [f.get("title"), f.get("text"), f.get("url")].filter(Boolean).join(" ").trim(); const file = f.get("media");
        if (file && file.size) { const c = await caches.open("bobby-share"); await c.put("/shared-image", new Response(file, { headers: { "Content-Type": file.type || "image/png" } })); return Response.redirect("/?share=image", 303); }
        return Response.redirect("/?text=" + encodeURIComponent(text), 303);
      } catch { return Response.redirect("/", 303); }
    })());
  }
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== self.location.origin || u.pathname.startsWith("/api/")) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match("/"))));
});
