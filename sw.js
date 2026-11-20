/* INTS Report — service worker: aplikasi terbuka cepat & tetap tampil saat sinyal lemah.
   Hanya berkas aplikasi (halaman, kantor 3D, ikon) yang disimpan di perangkat; DATA selalu diminta ke server
   (API Apps Script beda alamat, tidak pernah disentuh di sini). Versi berubah otomatis setiap build. */
var VER = '5a19cbf01c36';
var CACHE = 'ints-app-' + VER;
var SHELL = ['./', 'office.html', 'manifest.webmanifest', 'icon.svg', 'icon-maskable.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('ints-app-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// simpanan dulu (langsung tampil), lalu diperbarui di latar belakang untuk pembukaan berikutnya
function fresh(c, req, key) {
  return fetch(req).then(function (r) {
    if (r && r.ok) c.put(key || req, r.clone());
    return r;
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;     // API, login Google: langsung ke jaringan
  if (url.pathname.indexOf('/.well-known/') === 0 || url.pathname.slice(-6) === 'sw.js') return;
  var nav = req.mode === 'navigate';
  e.respondWith(caches.open(CACHE).then(function (c) {
    var key = nav ? './' : req;
    return c.match(key, { ignoreSearch: true }).then(function (hit) {
      var net = fresh(c, req, nav ? './' : null);
      if (hit) { e.waitUntil(net.catch(function () { /* luring: pakai simpanan */ })); return hit; }
      return net;
    });
  }));
});
