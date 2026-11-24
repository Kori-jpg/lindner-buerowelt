/* LindnerNet Offline-Modus: speichert die Seite nach dem ersten Laden auf dem Gerät. Keine Daten werden gesendet. */
var V = 'lindnernet-13f87e5c1877';
var FILES = ["./","index.html","assets/app.js","assets/style.css","assets/firmensitz.svg","assets/logo_farbig.png","assets/logo_kurz_farbig.png","assets/logo_kurz_weiss.png","assets/logo_weiss.png","content/lf8-1.enc.json","content/lf8-2.enc.json","content/lf8-3.enc.json","content/lf8-l.enc.json","content/lf8.enc.json"];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // Netz zuerst (damit neue Inhalte ankommen), sonst Kopie vom Gerät
  e.respondWith(fetch(e.request).then(function (r) {
    if (r && r.ok) { var copy = r.clone(); caches.open(V).then(function (c) { c.put(e.request, copy); }); }
    return r;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (m) { return m || caches.match('index.html'); }); }));
});
