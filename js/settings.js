"use strict";
// ---------- Settings: preferences, exercise lists, backup ----------
const XL={ex:{name:"Bodyweight exercises",ph:"Squats",used:id=>S.wo.filter(w=>w.r[id]).length,
            drop:id=>{S.wo.forEach(w=>delete w.r[id]);S.wo=S.wo.filter(w=>reps(w)||w.n)}},
          lifts:{name:"Gym exercises",ph:"Leg press",used:id=>S.sets.filter(s=>s.lift===id).length,
            drop:id=>{S.sets=S.sets.filter(s=>s.lift!==id)}}};

function listTile(l){const x=XL[l];
  return tile(`<h2>${x.name}</h2><p class="lb" style="margin-top:0">Tap a name to rename it. Hidden ones keep their history.</p>
  ${S[l].map(e=>`<div class="rw"><input class="g" data-c="rename" data-l="${l}" data-id="${e.id}" value="${esc(e.name)}" aria-label="Name" style="background:none;border:0;padding:4px 0;${e.on?"":"color:var(--faint)"}"><button class="btn sm" data-a="xon" data-l="${l}" data-id="${e.id}">${e.on?"Hide":"Show"}</button><button class="ib" data-a="xdel" data-l="${l}" data-id="${e.id}" aria-label="Delete">${ic("trash","s")}</button></div>`).join("")||'<div class="empty">None yet.</div>'}
  <div class="addrow" data-form data-xl="${l}"><input name="nx" placeholder="${x.ph}" aria-label="New exercise"><button class="ib" data-a="xadd" data-l="${l}" aria-label="Add">${ic("plus")}</button></div>`);
}

V.set={title:"Settings",nav:null,render(){
  const days=S.lastExport?Math.floor((Date.now()-S.lastExport)/864e5):null;
  let share=false;try{share=!!(navigator.canShare&&navigator.canShare({files:[new File(["{}"],"x.json",{type:"application/json"})]}))}catch(e){}
  const o=(k,v,l)=>opt(v,l,S[k]===v),tg=targets();
  const n=(k,l,v)=>`<label class="fl"><span>${l}</span><input type="number" inputmode="decimal" min="0" data-c="pref" data-k="${k}" value="${v}"></label>`;
  return head("Settings",{sub:"Life Planner"})+`<div class="stack">
  ${tile(`<h2>You</h2><label class="fl"><span>Your name</span><input data-c="pref" data-k="name" value="${esc(S.name)}" placeholder="Shown in the greeting"></label>
    <div class="f"><button class="btn" data-a="split">${ic("calendar-week","s")} Weekly split</button><button class="btn" data-a="ftgt">${ic("target","s")} Calories${tg?": "+tg.kcal:""}</button></div>`)}
  ${tile(`<h2>Goals and preferences</h2>${n("budget","Weekly spending budget (0 = none)",S.budget||0)}${n("goal","Runs per week",S.goal)}${n("studyGoal","Daily study goal, minutes",S.studyGoal)}
    <div class="f"><label class="fl"><span>Currency</span><select data-c="pref" data-k="cur">${o("cur","UZS","UZS (so'm)")}${o("cur","USD","USD ($)")}</select></label>
    <label class="fl"><span>Appearance</span><select data-c="pref" data-k="theme">${o("theme","auto","Match my phone")}${o("theme","light","Light")}${o("theme","dark","Dark")}</select></label></div>`)}
  ${tile(`<h2>Backup</h2><p class="lb" style="margin-top:0">Your data lives on this device only. Export a backup to keep it safe or move it to another device.</p>
    <p style="font-size:14px">${days===null?"No backup exported yet.":days===0?"Last backup: today.":`Last backup: ${plural(days,"day")} ago.`}<br><small class="mute">${S.tasks.length} tasks · ${S.exp.length} purchases · ${S.wo.length+S.sets.length+S.runs.length} workout entries · ${S.meals.length} food entries · ${S.learn.length} learning items</small></p>
    <div class="f"><button class="btn p" data-a="exp">${ic("download","s")} Export</button>${share?`<button class="btn" data-a="share">${ic("share","s")} Share</button>`:""}<button class="btn" data-a="imp">${ic("upload","s")} Import</button></div>
    <details><summary>Paste backup text instead</summary><textarea id="bk" style="min-height:90px;margin-top:8px;font-family:ui-monospace,monospace;font-size:12px" placeholder="Paste backup text here"></textarea><button class="btn" data-a="paste" style="margin-top:8px">Import pasted text</button></details>`)}
  <div class="two">${listTile("ex")}${listTile("lifts")}</div>
  <p class="lb" style="text-align:center">Life Planner 3 · works offline · <a href="#" data-a="welcome" style="color:inherit">show welcome again</a></p></div>`;
}};

// ---- backup ----
const backupText=()=>JSON.stringify({...S,app:"life-planner",exportedAt:new Date().toISOString()});
const backupName=()=>`life-planner-${today()}.json`;
function exported(){S.lastExport=Date.now();save();render()}
function doExport(){
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([backupText()],{type:"application/json"}));a.download=backupName();
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);exported();toast("Backup saved to Downloads");
}
async function doShare(){
  try{await navigator.share({files:[new File([backupText()],backupName(),{type:"application/json"})],title:"Life Planner backup"});exported()}
  catch(e){if(e.name!=="AbortError")toast("Sharing didn't work. Use Export instead")}
}
async function doImport(text){
  let d;try{d=norm(JSON.parse(text))}catch(e){toast("That isn't a Life Planner backup");return}
  const has=LISTS.some(l=>S[l].length);
  const r=await ask(`<h2>Import backup?</h2><p>It has ${d.tasks.length} tasks, ${d.exp.length} purchases, ${d.wo.length+d.sets.length+d.runs.length} workout entries, ${d.meals.length} food entries and ${d.learn.length} learning items.</p>
    <p class="lb"><b>Merge</b> adds anything missing and keeps what's here. <b>Replace</b> wipes this device's data and uses the backup instead.</p>`,
    has?[["merge","Merge"],["replace","Replace"],["","Cancel"]]:[["replace","Import"],["","Cancel"]]);
  if(!r)return;
  snap();S=r==="replace"?{...d,onb:true}:merge(S,d);save();render();undoToast("Backup imported");
}
function backupNudge(){
  const has=LISTS.some(l=>S[l].length),days=S.lastExport?Math.floor((Date.now()-S.lastExport)/864e5):null;
  if(nudgeOff||!has||(days!==null&&days<7))return"";
  return tile(`<div class="rw" style="border:0;padding:0;min-height:0"><span class="ci">${ic("download","s")}</span><span class="g lb">${days===null?"You haven't backed up yet.":`Last backup was ${days} days ago.`}</span><button class="btn sm" data-a="exp">Export</button><button class="ib" data-a="nudge" aria-label="Dismiss">${ic("x","s")}</button></div>`,"t");
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
  if(n){const r=await ask(`<h2>Delete ${esc(e.name)}?</h2><p>It has ${plural(n,"logged entry")}. Deleting removes them from your history. Hiding keeps them.</p>`,[["hide","Hide instead"],["del","Delete anyway"],["","Cancel"]]);
    if(!r)return false;if(r==="hide"){e.on=false;return}}
  snap();if(n)x.drop(e.id);S[l]=S[l].filter(o=>o!==e);undoToast(e.name+" deleted")};
C.pref=el=>{const k=el.dataset.k;S[k]=["cur","theme","name"].includes(k)?el.value.trim().slice(0,40):num(el.value)};
C.rename=el=>{const e=S[el.dataset.l].find(o=>o.id===el.dataset.id),n=el.value.trim();if(n)e.name=n;else el.value=e.name};
