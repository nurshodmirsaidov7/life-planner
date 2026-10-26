// Offline support. Every version's files are cached together, so the app never mixes old and new code.
// Bump C when shipping changes: the new worker caches the new set, then the page offers a reload.
const C="lp-v9";
const ASSETS=["./","index.html","css/app.css","js/vendor/chart.umd.min.js","js/vendor/firebase-app-compat.js","js/vendor/firebase-auth-compat.js","js/vendor/firebase-firestore-compat.js","js/vendor/firebase-messaging-compat.js",
  "js/icons.js","js/i18n.js","js/i18n-dict.js","js/core.js","js/plan.js","js/money.js","js/workout.js","js/food.js","js/learn.js","js/add.js","js/settings.js","js/cloud.js","js/remind.js","js/app.js",
  "manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS.map(a=>new Request(a,{cache:"reload"})))));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(caches.open(C).then(c=>c.match(e.request,{ignoreSearch:true}).then(h=>h||fetch(e.request))));
});

// Daily reminder pushes (sent by the hourly GitHub job through Firebase Cloud Messaging as data messages).
self.addEventListener("push",e=>{
  let d={};try{d=e.data.json()}catch(x){}
  const m=d.data||d.notification||{};
  e.waitUntil(self.registration.showNotification(m.title||"TrackMe",{body:m.body||"",icon:"icon-192.png",tag:"trackme-daily",renotify:true,data:{url:m.url||"./"}}));
});
// Tapping the notification focuses TrackMe if it's open, otherwise opens it.
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  const url=new URL((e.notification.data&&e.notification.data.url)||"./",self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{
    for(const c of cs)if(c.url.startsWith(self.registration.scope)&&"focus" in c)return c.focus();
    return self.clients.openWindow(url);
  }));
});
