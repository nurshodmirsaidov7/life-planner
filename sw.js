// Offline support. Every version's files are cached together, so the app never mixes old and new code.
// Bump C when shipping changes: the new worker caches the new set, then the page offers a reload.
const C="lp-v2";
const ASSETS=["./","index.html","css/app.css","js/vendor/chart.umd.min.js","js/core.js","js/plan.js","js/money.js","js/workout.js","js/food.js","js/learn.js","js/settings.js","js/app.js",
  "manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS.map(a=>new Request(a,{cache:"reload"})))));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(caches.open(C).then(c=>c.match(e.request,{ignoreSearch:true}).then(h=>h||fetch(e.request))));
});
