"use strict";
// ---------- wiring: navigation, events, swipe, welcome, offline ----------
$$(".sh-h").forEach(el=>el.innerHTML=el.innerHTML.replace(/__([\w-]+)__/g,(m,n)=>ic(n)));

A.tab=b=>{tab=b.dataset.t;anim=true;closeSheet();scrollTo(0,0)};
A.nav=b=>{const n=+b.dataset.n,k=navKind();anim=true;
  cur=k==="day"?addD(cur,n):k==="month"?new Date(cur.getFullYear(),cur.getMonth()+n,1):addD(cur,7*n)};
A.now=()=>{cur=new Date(new Date().setHours(0,0,0,0));anim=true};
A.pick=()=>{const j=$("#jump");j.value=key(cur);try{j.showPicker()}catch(e){j.click()}return false};
A.shx=()=>{closeSheet();return false};
$("#jump").addEventListener("change",e=>{if(isDay(e.target.value)){cur=dt(e.target.value);anim=true;render()}});

const mkF=f=>{const el=n=>f&&f.querySelector(`[name="${n}"]`);
  return{el,v:n=>(el(n)?.value||"").trim(),n:n=>num(el(n)?.value||""),ck:n=>!!el(n)?.checked,all:n=>f?[...f.querySelectorAll(`[name="${n}"]:checked`)].map(i=>i.value):[]}};
async function run(fn,b,e){
  const f=b.closest?b.closest("[data-form]"):null,r=await fn(b,f,mkF(f),e);
  if(r===false)return;
  save();render();
  if(typeof r==="string"){const x=$(r);if(x)x.focus()}
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-a]");if(!b||b.disabled)return;
  const fn=A[b.dataset.a];if(!fn)return;
  if(b.tagName==="A")e.preventDefault();
  run(fn,b,e);
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

// Swipe a row (.sw) right for data-r, left for data-l. Vertical scrolling wins when the finger moves up/down first.
let sx=null;
document.addEventListener("touchstart",e=>{const r=e.target.closest(".sw");if(!r||e.touches.length>1)return;
  sx={r,fg:r.querySelector(".sw-fg"),x:e.touches[0].clientX,y:e.touches[0].clientY,dx:0,on:false}},{passive:true});
document.addEventListener("touchmove",e=>{if(!sx)return;const t=e.touches[0],dx=t.clientX-sx.x,dy=t.clientY-sx.y;
  if(!sx.on){if(Math.abs(dx)<10&&Math.abs(dy)<10)return;if(Math.abs(dy)>=Math.abs(dx)){sx=null;return}sx.on=true}
  e.preventDefault();sx.dx=dx;sx.fg.style.transform=`translateX(${dx}px)`;sx.r.classList.toggle("r",dx>0);sx.r.classList.toggle("l",dx<0)},{passive:false});
document.addEventListener("touchend",()=>{if(!sx)return;const{r,fg,dx,on}=sx;sx=null;if(!on)return;
  fg.classList.add("anim");
  if(Math.abs(dx)>Math.min(110,r.offsetWidth*.3)){const a=A[dx>0?r.dataset.r:r.dataset.l];fg.style.transform=`translateX(${dx>0?100:-100}%)`;
    setTimeout(()=>a&&run(a,{dataset:{id:r.dataset.id}}),170)}
  else{fg.style.transform="";setTimeout(()=>{r.classList.remove("r","l");fg.classList.remove("anim")},220)}});

// Another open tab saved: take its data so this tab never writes stale data over it.
window.addEventListener("storage",e=>{if(e.key!==STORE||!e.newValue)return;try{S=norm(JSON.parse(e.newValue));render()}catch(x){}});
// Keep "today" current if the app stays open past midnight.
let shownToday=today();
document.addEventListener("visibilitychange",()=>{if(document.visibilityState!=="visible")return;const t=today();
  if(t!==shownToday){if(key(cur)===shownToday)cur=dt(t);shownToday=t;anim=true;render()}});

// ---------- first-run welcome (3 short steps, all skippable) ----------
const PRESETS=[["","Name each day myself later"],["Chest & Biceps|Back & Triceps|Shoulders|Legs","Chest & Biceps / Back & Triceps / Shoulders / Legs"],["Push|Pull|Legs","Push / Pull / Legs"],["Upper body|Lower body","Upper / Lower"],["Full body","Full body"]];
let ob=0;
function welcomeSheet(){
  $("#sh-t").textContent=T(["Welcome to TrackMe","Your body","Your training"][ob]);
  const dots=`<div class="steps">${[0,1,2].map(i=>`<i class="${i<=ob?"on":""}"></i>`).join("")}</div>`;
  if(ob===0)return dots+`<div data-form><label class="fl"><span>Language · Til · Язык</span><select data-c="pref" data-k="lang">${opt("",T("Same as my phone"),!S.lang)}${LANGS.map(([c,l])=>opt(c,l,S.lang===c)).join("")}</select></label>
    <p style="font-size:16px">${T("Plan your days and track your money, workouts, food and learning, all in one place.")}</p>
    <p class="lb">${T("Everything syncs to your account and works offline too.")}</p>
    <label class="fl"><span>${T("What should we call you?")}</span><input name="name" data-i="obname" value="${esc(S.name)}" placeholder="${T("Your name")}"></label><button class="btn p w" data-a="ob" data-v="0">${T("Continue")}</button></div>`;
  if(ob===1)return dots+`<div data-form><p style="margin-top:0">${T("These numbers set your daily calorie and protein target.")}</p>${bodyFields(S.body)}
    <label class="fl"><span>${T("Goal")}</span><select name="goal">${GOALS.map(([v,l])=>opt(v,T(l),S.body.goal===v)).join("")}</select></label>
    <button class="btn p w" data-a="ob" data-v="1">${T("Continue")}</button><button class="btn ghost w" data-a="obs">${T("Skip")}</button></div>`;
  return dots+`<div data-form><p style="margin-top:0">${T("Which days do you train?")}</p>${dayChecks(S.split.map((s,i)=>s?i:-1).filter(i=>i>=0))}
    <label class="fl" style="margin-top:12px"><span>${T("Split")}</span><select name="pre">${PRESETS.map(([v,l])=>opt(v,l.split(" / ").map(x=>T(x)).join(" / "))).join("")}</select></label>
    <button class="btn p w" data-a="ob" data-v="2">${T("Finish")}</button><button class="btn ghost w" data-a="obs">${T("Skip")}</button></div>`;
}
function openWelcome(){ob=0;sheet("",welcomeSheet)}
const obNext=()=>{ob++;if(ob>2){S.onb=true;closeSheet();toast(S.name?T("You're all set, {x}",{x:S.name}):T("You're all set"));return}$("#sh-b").innerHTML=welcomeSheet()};
A.ob=(b,f,F)=>{const st=+b.dataset.v;
  if(st===0)S.name=F.v("name").slice(0,40);
  if(st===1)saveBody(F);
  if(st===2){const days=F.all("rd").map(Number).sort(),pre=F.v("pre").split("|").filter(Boolean).map(x=>T(x));   // split names are saved in the chosen language
    if(days.length)S.split=DN.map((_,i)=>{const j=days.indexOf(i);return j<0?"":pre.length?pre[j%pre.length]:S.split[i]||T("Workout")})}
  save();obNext();if(!$("#sheet").open)render();return false};
A.obs=()=>{obNext();return false};
A.welcome=()=>{openWelcome();return false};
C.obname=el=>{S.name=el.value.trim().slice(0,40)};
$("#sheet").addEventListener("close",()=>{if(!S.onb&&ob<=2){S.onb=true;save()}});

cloudInit();
render();
if(!S.onb&&!needAuth())openWelcome();

if("serviceWorker" in navigator&&location.protocol==="https:"){
  const had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js");
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(had)toast(T("New version ready"),{label:T("Reload"),fn:()=>location.reload()})});
}
