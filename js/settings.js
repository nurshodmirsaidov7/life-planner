"use strict";
// ---------- Settings: language, preferences, exercise lists, backup ----------
const XL={ex:{name:"Bodyweight exercises",ph:"Squats",used:id=>S.wo.filter(w=>w.r[id]).length,
            drop:id=>{S.wo.forEach(w=>delete w.r[id]);S.wo=S.wo.filter(w=>reps(w)||w.n)}},
          lifts:{name:"Gym exercises",ph:"Leg press",used:id=>S.sets.filter(s=>s.lift===id).length,
            drop:id=>{S.sets=S.sets.filter(s=>s.lift!==id)}}};

function listTile(l){const x=XL[l];
  return tile(`<h2>${T(x.name)}</h2><p class="lb" style="margin-top:0">${T("Tap a name to rename it. Hidden ones keep their history.")}</p>
  ${S[l].map(e=>`<div class="rw"><input class="g" data-c="rename" data-l="${l}" data-id="${e.id}" value="${esc(e.name)}" aria-label="${T("Name")}" style="background:none;border:0;padding:4px 0;${e.on?"":"color:var(--faint)"}"><button class="btn sm" data-a="xon" data-l="${l}" data-id="${e.id}">${e.on?T("Hide"):T("Show")}</button><button class="ib" data-a="xdel" data-l="${l}" data-id="${e.id}" aria-label="${T("Delete")}">${ic("trash","s")}</button></div>`).join("")||`<div class="empty">${T("None yet.")}</div>`}
  <div class="addrow" data-form data-xl="${l}"><input name="nx" placeholder="${T(x.ph)}" aria-label="${T("New exercise")}"><button class="ib" data-a="xadd" data-l="${l}" aria-label="${T("Add")}">${ic("plus")}</button></div>`);
}

V.set={nav:null,render(){
  const days=S.lastExport?Math.floor((Date.now()-S.lastExport)/864e5):null;
  let share=false;try{share=!!(navigator.canShare&&navigator.canShare({files:[new File(["{}"],"x.json",{type:"application/json"})]}))}catch(e){}
  const o=(k,v,l)=>opt(v,l,S[k]===v),tg=targets();
  const n=(k,l,v)=>`<label class="fl"><span>${l}</span><input type="number" inputmode="decimal" min="0" data-c="pref" data-k="${k}" value="${v}"></label>`;
  return head(T("Settings"),{sub:"TrackMe"})+`<div class="stack">
  ${accountTile()}
  ${tile(`<h2>${T("You")}</h2><label class="fl"><span>${T("Language")}</span><select data-c="pref" data-k="lang">${opt("",T("Same as my phone"),!S.lang)}${LANGS.map(([c,l])=>opt(c,l,S.lang===c)).join("")}</select></label>
    <label class="fl"><span>${T("Your name")}</span><input data-c="pref" data-k="name" value="${esc(S.name)}" placeholder="${T("Shown in the greeting")}"></label>
    <div class="f"><button class="btn" data-a="split">${ic("calendar-week","s")} ${T("Weekly split")}</button><button class="btn" data-a="ftgt">${ic("target","s")} ${T("Calories")}${tg?": "+tg.kcal:""}</button></div>`)}
  ${tile(`<h2>${T("Goals and preferences")}</h2>${n("budget",T("Weekly spending budget (0 = none)"),S.budget||0)}${n("goal",T("Runs per week"),S.goal)}${n("studyGoal",T("Daily study goal, minutes"),S.studyGoal)}
    <div class="f"><label class="fl"><span>${T("Currency")}</span><select data-c="pref" data-k="cur">${o("cur","UZS",T("UZS (so'm)"))}${o("cur","USD",T("USD ($)"))}</select></label>
    <label class="fl"><span>${T("Appearance")}</span><select data-c="pref" data-k="theme">${o("theme","auto",T("Match my phone"))}${o("theme","light",T("Light"))}${o("theme","dark",T("Dark"))}</select></label></div>`)}
  ${tile(`<h2>${T("Backup")}</h2><p class="lb" style="margin-top:0">${user?T("Your data syncs to your account. You can also export a backup file to keep your own copy."):T("Your data lives on this device only. Export a backup to keep it safe or move it to another device.")}</p>
    <p style="font-size:14px">${days===null?T("No backup exported yet."):days===0?T("Last backup: today."):T("Last backup: {x} ago.",{x:plural(days,"day")})}<br><small class="mute">${T("{a} tasks · {b} purchases · {c} workout entries · {d} food entries · {e} learning items",{a:S.tasks.length,b:S.exp.length,c:S.wo.length+S.sets.length+S.runs.length,d:S.meals.length,e:S.learn.length})}</small></p>
    <div class="f"><button class="btn p" data-a="exp">${ic("download","s")} ${T("Export")}</button>${share?`<button class="btn" data-a="share">${ic("share","s")} ${T("Share")}</button>`:""}<button class="btn" data-a="imp">${ic("upload","s")} ${T("Import")}</button></div>
    <details><summary>${T("Paste backup text instead")}</summary><textarea id="bk" style="min-height:90px;margin-top:8px;font-family:ui-monospace,monospace;font-size:12px" placeholder="${T("Paste backup text here")}"></textarea><button class="btn" data-a="paste" style="margin-top:8px">${T("Import pasted text")}</button></details>`)}
  <div class="two">${listTile("ex")}${listTile("lifts")}</div>
  <p class="lb" style="text-align:center">TrackMe 3 · ${T("works offline")} · <a href="#" data-a="welcome" style="color:inherit">${T("show welcome again")}</a> · <a href="${PRIVACY_URL}${LANG}" target="_blank" rel="noopener" style="color:inherit">${T("Privacy policy")}</a></p></div>`;
}};

// ---- backup ----
const backupText=()=>JSON.stringify({...S,app:"trackme",exportedAt:new Date().toISOString()});
const backupName=()=>`trackme-${today()}.json`;
function exported(){S.lastExport=Date.now();save();render()}
function doExport(){
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([backupText()],{type:"application/json"}));a.download=backupName();
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);exported();toast(T("Backup saved to Downloads"));
}
async function doShare(){
  try{await navigator.share({files:[new File([backupText()],backupName(),{type:"application/json"})],title:T("TrackMe backup")});exported()}
  catch(e){if(e.name!=="AbortError")toast(T("Sharing didn't work. Use Export instead"))}
}
async function doImport(text){
  let d;try{d=norm(JSON.parse(text))}catch(e){toast(T("That isn't a TrackMe backup"));return}
  const has=LISTS.some(l=>S[l].length);
  const r=await ask(`<h2>${T("Import backup?")}</h2><p>${T("It has {a} tasks, {b} purchases, {c} workout entries, {d} food entries and {e} learning items.",{a:d.tasks.length,b:d.exp.length,c:d.wo.length+d.sets.length+d.runs.length,d:d.meals.length,e:d.learn.length})}</p>
    <p class="lb">${T("Merge adds anything missing and keeps what's here. Replace wipes this device's data and uses the backup instead.")}</p>`,
    has?[["merge",T("Merge")],["replace",T("Replace")],["",T("Cancel")]]:[["replace",T("Import")],["",T("Cancel")]]);
  if(!r)return;
  snap();S=r==="replace"?{...d,onb:true,lang:S.lang}:merge(S,d);save();render();undoToast(T("Backup imported"));
}
function backupNudge(){
  const has=LISTS.some(l=>S[l].length),days=S.lastExport?Math.floor((Date.now()-S.lastExport)/864e5):null;
  if(nudgeOff||!has||user||(days!==null&&days<7))return"";   // signed in = already backed up in the account
  return tile(`<div class="rw" style="border:0;padding:0;min-height:0"><span class="ci">${ic("download","s")}</span><span class="g lb">${days===null?T("You haven't backed up yet."):T("Last backup was {n} days ago.",{n:days})}</span><button class="btn sm" data-a="exp">${T("Export")}</button><button class="ib" data-a="nudge" aria-label="${T("Dismiss")}">${ic("x","s")}</button></div>`,"t");
}
let nudgeOff=false;

A.exp=()=>{doExport();return false};
A.share=()=>{doShare();return false};
A.imp=()=>{$("#file").value="";$("#file").click();return false};
A.paste=()=>{doImport($("#bk").value);return false};
A.nudge=()=>{nudgeOff=true};
A.xadd=(b,f,F)=>{const n=F.v("nx");if(!n)return false;S[b.dataset.l].push({id:uid(),name:n,on:true});return `[data-xl="${b.dataset.l}"] [name=nx]`};
A.xon=b=>{const e=S[b.dataset.l].find(o=>o.id===b.dataset.id);e.on=!e.on};
A.xdel=async b=>{const l=b.dataset.l,x=XL[l],e=S[l].find(o=>o.id===b.dataset.id),n=x.used(e.id);
  if(n){const r=await ask(`<h2>${T("Delete {x}?",{x:esc(e.name)})}</h2><p>${T("It has {x}. Deleting removes them from your history. Hiding keeps them.",{x:plural(n,"logged entry")})}</p>`,[["hide",T("Hide instead")],["del",T("Delete anyway")],["",T("Cancel")]]);
    if(!r)return false;if(r==="hide"){e.on=false;return}}
  snap();if(n)x.drop(e.id);S[l]=S[l].filter(o=>o!==e);undoToast(T("{x} deleted",{x:e.name}))};
C.pref=el=>{const k=el.dataset.k;S[k]=["cur","theme","name","lang"].includes(k)?el.value.trim().slice(0,40):num(el.value);
  if(k==="lang"){setLang(S.lang);localizeDefaults();if(window.firebase&&firebase.apps.length)firebase.auth().languageCode=LANG}};
C.rename=el=>{const e=S[el.dataset.l].find(o=>o.id===el.dataset.id),n=el.value.trim();if(n)e.name=n;else el.value=e.name};
