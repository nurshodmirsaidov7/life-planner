"use strict";
// ---------- Settings: preferences, exercise lists, backup ----------
const XL={ex:{name:"Bodyweight exercises (reps)",ph:"e.g. Squats",used:id=>S.wo.filter(w=>w.r[id]).length,
            drop:id=>{S.wo.forEach(w=>delete w.r[id]);S.wo=S.wo.filter(w=>reps(w)||w.n)}},
          lifts:{name:"Gym exercises (kg × reps)",ph:"e.g. Leg press",used:id=>S.sets.filter(s=>s.lift===id).length,
            drop:id=>{S.sets=S.sets.filter(s=>s.lift!==id)}}};

function listCard(l){const x=XL[l];
  return `<div class="card"><h2>${x.name}</h2><p class="mute" style="margin-top:0"><small>Tap a name to rename it. Hidden ones keep their history.</small></p>
  ${S[l].map(e=>`<div class="row"><input class="g" data-c="rename" data-l="${l}" data-id="${e.id}" value="${esc(e.name)}" aria-label="Name" style="${e.on?"":"opacity:.55"}"><button class="ib" data-a="xon" data-l="${l}" data-id="${e.id}">${e.on?"Hide":"Show"}</button><button class="ib" data-a="xdel" data-l="${l}" data-id="${e.id}" aria-label="Delete">✕</button></div>`).join("")||'<div class="empty">None yet.</div>'}
  <div class="f" data-form data-xl="${l}" style="margin-top:8px"><input name="nx" placeholder="${x.ph}"><button class="p x" data-a="xadd" data-l="${l}">Add</button></div></div>`;
}

V.set={title:"Settings",nav:null,render(){
  const days=S.lastExport?Math.floor((Date.now()-S.lastExport)/864e5):null;
  let share=false;try{share=!!(navigator.canShare&&navigator.canShare({files:[new File(["{}"],"x.json",{type:"application/json"})]}))}catch(e){}
  const o=(k,v,l)=>opt(v,l,S[k]===v),tg=targets();
  return `<div class="two"><div class="card"><h2>Preferences</h2>
  <label class="fl"><span>Currency</span><select data-c="pref" data-k="cur">${o("cur","UZS","UZS (so'm)")}${o("cur","USD","USD ($)")}</select></label>
  <label class="fl"><span>Weekly spending budget (0 = none)</span><input type="number" inputmode="decimal" min="0" data-c="pref" data-k="budget" value="${S.budget||0}"></label>
  <label class="fl"><span>Weekly run goal</span><input type="number" inputmode="numeric" min="0" data-c="pref" data-k="goal" value="${S.goal}"></label>
  <label class="fl"><span>Appearance</span><select data-c="pref" data-k="theme">${o("theme","auto","Match my phone")}${o("theme","light","Light")}${o("theme","dark","Dark")}</select></label>
  <div class="btns" style="margin-top:12px"><button data-a="split">📋 Weekly split</button><button data-a="ftgt">🎯 Calorie targets${tg?": "+tg.kcal:""}</button></div></div>
  <div class="card"><h2>Backup</h2><p class="mute" style="margin-top:0">Your data lives on this device only. Export a backup file to keep it safe or to move it between your phone and laptop.</p>
  <p>${days===null?"No backup exported yet.":days===0?"Last backup: today.":`Last backup: ${plural(days,"day")} ago.`}<br><small class="mute">${S.tasks.length} tasks · ${S.exp.length} expenses · ${S.wo.length+S.sets.length+S.runs.length} workout entries · ${S.meals.length} food entries · ${S.learn.length} learning items</small></p>
  <div class="btns"><button class="p" data-a="exp">⬇️ Export backup</button>${share?'<button data-a="share">📤 Share backup</button>':""}<button data-a="imp">⬆️ Import backup</button></div>
  <details><summary>Paste backup text instead</summary><p><textarea id="bk" class="mono" placeholder="Paste backup text here"></textarea></p><button data-a="paste">Import pasted text</button></details></div></div>
  <div class="two">${listCard("ex")}${listCard("lifts")}</div>
  <p class="mute" style="text-align:center"><small>Life Planner v2 · works offline · your data never leaves this device unless you export it</small></p>`;
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
  catch(e){if(e.name!=="AbortError")toast("Sharing failed. Use Export instead")}
}
async function doImport(text){
  let d;try{d=norm(JSON.parse(text))}catch(e){toast("That isn't a valid Life Planner backup");return}
  const has=LISTS.some(l=>S[l].length);
  const r=await ask(`<h2>Import backup?</h2><p>It has ${d.tasks.length} tasks, ${d.exp.length} expenses, ${d.wo.length+d.sets.length+d.runs.length} workout entries, ${d.meals.length} food entries and ${d.learn.length} learning items.</p>
    <p class="mute"><b>Merge</b> adds anything missing and keeps what's already here. <b>Replace</b> wipes this device's data and uses the backup instead.</p>`,
    has?[["merge","Merge"],["replace","Replace"],["","Cancel"]]:[["replace","Import"],["","Cancel"]]);
  if(!r)return;
  S=r==="replace"?d:merge(S,d);save();render();toast("Backup imported ✓");
}

A.exp=()=>{doExport();return false};
A.share=()=>{doShare();return false};
A.imp=()=>{$("#file").value="";$("#file").click();return false};
A.paste=()=>{doImport($("#bk").value);return false};
A.xadd=(b,f,F)=>{const n=F.v("nx");if(!n)return false;S[b.dataset.l].push({id:uid(),name:n,on:true});return `[data-xl="${b.dataset.l}"] [name=nx]`};
A.xon=b=>{const e=S[b.dataset.l].find(o=>o.id===b.dataset.id);e.on=!e.on};
A.xdel=async b=>{const l=b.dataset.l,x=XL[l],e=S[l].find(o=>o.id===b.dataset.id),n=x.used(e.id);
  if(n){const r=await ask(`<h2>Delete ${esc(e.name)}?</h2><p>It has ${plural(n,"logged entry")}. Deleting removes them from your history. Hiding keeps them.</p>`,[["hide","Hide instead"],["del","Delete anyway"],["","Cancel"]]);
    if(!r)return false;if(r==="hide"){e.on=false;return}x.drop(e.id)}
  S[l]=S[l].filter(o=>o!==e)};
C.pref=el=>{const k=el.dataset.k;S[k]=["cur","theme"].includes(k)?el.value:num(el.value)};
C.rename=el=>{const e=S[el.dataset.l].find(o=>o.id===el.dataset.id),n=el.value.trim();if(n)e.name=n;else el.value=e.name};
