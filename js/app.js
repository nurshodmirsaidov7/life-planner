"use strict";
// ---------- wiring: navigation, events, offline ----------
let nudgeOff=false;
function backupNudge(){
  const has=LISTS.some(l=>S[l].length),days=S.lastExport?Math.floor((Date.now()-S.lastExport)/864e5):null;
  if(nudgeOff||!has||(days!==null&&days<7))return"";
  return `<div class="card soft mb" style="display:flex;gap:10px;align-items:center;justify-content:space-between"><span>💾 ${days===null?"You haven't exported a backup yet.":`Last backup was ${days} days ago.`}</span>
  <span style="display:flex;gap:4px;align-items:center;flex:0 0 auto"><button class="p sm" data-a="exp">Export</button><button class="ib" data-a="nudge" aria-label="Dismiss">✕</button></span></div>`;
}
const planRender=V.plan.render;V.plan.render=()=>backupNudge()+planRender();

A.tab=b=>{tab=b.dataset.t;closeSheet();render();scrollTo(0,0);return false};
A.nav=b=>{const n=+b.dataset.n,k=navKind();
  cur=k==="day"?addD(cur,n):k==="month"?new Date(cur.getFullYear(),cur.getMonth()+n,1):addD(cur,7*n);render();return false};
A.now=()=>{cur=new Date(new Date().setHours(0,0,0,0));render();return false};
A.pick=()=>{const j=$("#jump");j.value=key(cur);try{j.showPicker()}catch(e){j.click()}return false};
A.shx=()=>{closeSheet();return false};
A.nudge=()=>{nudgeOff=true;render();return false};
$("#jump").addEventListener("change",e=>{if(isDay(e.target.value)){cur=dt(e.target.value);render()}});

const mkF=f=>{const el=n=>f&&f.querySelector(`[name="${n}"]`);
  return{el,v:n=>(el(n)?.value||"").trim(),n:n=>num(el(n)?.value||""),ck:n=>!!el(n)?.checked,all:n=>f?[...f.querySelectorAll(`[name="${n}"]:checked`)].map(i=>i.value):[]}};

document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-a]");if(!b||b.disabled)return;
  const fn=A[b.dataset.a];if(!fn)return;
  const f=b.closest("[data-form]"),r=await fn(b,f,mkF(f),e);
  if(r===false)return;
  save();render();
  if(typeof r==="string"){const x=$(r);if(x)x.focus()}
});
document.addEventListener("keydown",e=>{
  if(e.key!=="Enter"||e.target.tagName!=="INPUT"||e.isComposing)return;
  const f=e.target.closest("[data-form]");if(!f)return;
  const b=f.querySelector("button.p[data-a]")||f.querySelector("button[data-a]");if(b){e.preventDefault();b.click()}
});
document.addEventListener("change",e=>{const c=e.target.dataset.c;if(c&&C[c]&&C[c](e.target)!==false){save();render()}});
document.addEventListener("input",e=>{const c=e.target.dataset.i;if(c&&C[c])C[c](e.target)});
$("#file").addEventListener("change",e=>{const f=e.target.files[0];if(f)f.text().then(doImport)});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{if(S.theme==="auto")render()});

// Another open tab saved: take its data so this tab never writes stale data over it.
window.addEventListener("storage",e=>{if(e.key!==STORE||!e.newValue)return;try{S=norm(JSON.parse(e.newValue));render()}catch(x){}});

// Keep "today" current if the app stays open past midnight.
let shownToday=today();
document.addEventListener("visibilitychange",()=>{if(document.visibilityState!=="visible")return;const t=today();
  if(t!==shownToday){if(key(cur)===shownToday)cur=dt(t);shownToday=t;render()}});

render();

if("serviceWorker" in navigator&&location.protocol==="https:"){
  const had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js");
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!had)return;
    const t=$("#toast");t.innerHTML='New version ready. <u style="cursor:pointer">Tap to reload</u>';t.onclick=()=>location.reload();t.classList.add("on");});
}
