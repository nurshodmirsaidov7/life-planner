// Offline support: serve from cache, refresh the cache in the background.
// Bump C when shipping changes so old caches are cleared.
const C="lp-v1";
const ASSETS=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
  const net=fetch(e.request).then(r=>{if(r.ok){const cl=r.clone();caches.open(C).then(c=>c.put(e.request,cl))}return r});
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(h=>h||net));
  e.waitUntil(net.catch(()=>{}));
});
