"use strict";
// ---------- Workout: bodyweight reps, gym sets (kg × reps), runs, weekly split ----------
const reps=w=>Object.values(w.r).reduce((s,v)=>s+v,0);
const exReps=id=>w=>w.r[id]||0;
const liftName=id=>(S.lifts.find(l=>l.id===id)||{name:"?"}).name;
function pace(m,k){if(!k)return"—";const p=m/k;let a=Math.floor(p),s=Math.round((p-a)*60);if(s===60){a++;s=0}return a+":"+pad(s)+" /km"}
const SPLITS=["Chest & Biceps","Back & Triceps","Shoulders","Legs","Upper body","Lower body","Full body","Push","Pull","Run / Cardio","Street workout"];
let wform={lift:"",kg:"",reps:"",n:1},progLift="";

function lastSession(lift,before){
  const s=S.sets.filter(x=>x.lift===lift&&x.d<before).sort((a,b)=>a.d<b.d?1:-1);
  if(!s.length)return"";const d=s[0].d,x=s.filter(y=>y.d===d);
  return `Last time (${dayLbl(dt(d))}): ${x.map(y=>y.kg+"×"+y.reps).join(", ")}`;
}

V.work={title:"Workout",nav:"week",render(){
  const D=wkD(),tk=today(),W=S.wo.filter(w=>inR(w.d,D)),R=S.runs.filter(r=>inR(r.d,D)),G=S.sets.filter(s=>inR(s.d,D));
  const byD={};S.wo.forEach(w=>byD[w.d]=(byD[w.d]||0)+reps(w));
  const dv=Object.values(byD),km=sum(S.runs,"km"),mn=sum(S.runs,"min"),act=S.ex.filter(e=>e.on),cols=S.ex.filter(e=>e.on||S.wo.some(w=>w.r[e.id]));
  const lifts=S.lifts.filter(l=>l.on);
  if(!lifts.some(l=>l.id===wform.lift))wform.lift=(lifts[0]||{}).id||"";
  const d0=dflt(D);
  // split strip
  const strip=`<div class="card mb"><h2><span>📋 Weekly split</span><button class="sm" data-a="split">Edit</button></h2><div class="chips">${D.map((d,i)=>{const k=key(d);
    return `<span class="chip ${k===tk?"soft":""}" style="${k===tk?"font-weight:700;":""}">${DN[i]} · ${S.split[i]?esc(S.split[i]):'<span class="mute">Rest</span>'}</span>`}).join("")}</div></div>`;
  // log forms
  const num=(n,p,v="")=>`<input name="${n}" class="n" type="number" inputmode="decimal" min="0" step="any" placeholder="${p}" value="${v}" aria-label="${p}">`;
  const forms={
    reps:`<input type="date" name="d" value="${d0}" style="width:100%" aria-label="Date">${act.length?`<div class="exs">${act.map(e=>`<label><small>${esc(e.name)}</small><input name="r_${e.id}" type="number" inputmode="numeric" min="0" step="any" placeholder="0"></label>`).join("")}</div>`:'<div class="empty">No exercises. Add some in Settings.</div>'}
      <div class="f" style="margin-top:6px"><input name="n" placeholder="Note (optional)" style="flex:2 1 160px"><button class="p" data-a="aw">Add to day</button></div><small class="mute">Adds to that day's totals if you already logged something.</small>`,
    gym:lifts.length?`<div class="f"><input type="date" name="d" value="${d0}" aria-label="Date"><select name="lift" data-c="lift" aria-label="Exercise" style="flex:2 1 160px">${lifts.map(l=>opt(l.id,l.name,l.id===wform.lift)).join("")}</select></div>
      <div class="f">${num("kg","kg",wform.kg)}${num("reps","Reps",wform.reps)}<label class="n" style="display:flex;align-items:center;gap:6px"><span class="mute" style="font-size:13px">Sets</span><input name="n" type="number" inputmode="numeric" min="1" value="${wform.n||1}" style="width:100%"></label><button class="p x" data-a="as">Add</button></div>
      <small class="mute">${esc(lastSession(wform.lift,d0))||"Logs that many identical sets. Use Settings to add exercises."}</small>`:'<div class="empty">No gym exercises. Add some in Settings.</div>',
    run:`<div class="f"><input type="date" name="d" value="${d0}" class="w" aria-label="Date">${num("km","km")}${num("min","Minutes")}</div><div class="f"><input name="n" placeholder="Note (optional)" style="flex:2 1 160px"><button class="p" data-a="ar">Add run</button></div>`};
  // this week's log
  const log=D.map(d=>{const k=key(d),a=W.filter(w=>w.d===k),r=R.filter(x=>x.d===k),g=G.filter(s=>s.d===k);if(!a.length&&!r.length&&!g.length)return"";
    const gl=[...new Set(g.map(s=>s.lift))].map(l=>{const x=g.filter(s=>s.lift===l);return `<div class="row"><span class="g">🏋️ <b>${esc(liftName(l))}</b> <small class="mute">${plural(x.length,"set")} · ${Math.round(sum(x,s=>s.kg*s.reps))} kg vol.</small><br><span class="chips" style="margin-top:4px">${x.map(s=>`<button class="chip sm" data-a="ds" data-id="${s.id}" title="Delete this set">${s.kg}×${s.reps} ✕</button>`).join("")}</span></span></div>`}).join("");
    return `<div class="dh"><span>${dayLbl(d)}</span><small class="mute">${esc(S.split[(d.getDay()+6)%7])}</small></div>`+
    a.map(w=>`<div class="row"><span class="g">💪 ${Object.entries(w.r).map(([k,v])=>`${v} ${esc((S.ex.find(e=>e.id===k)||{name:k}).name)}`).join(" · ")} <small class="mute">${esc(w.n)}</small></span><b>${reps(w)}</b><button class="ib" data-a="dw" data-id="${w.id}" aria-label="Delete">✕</button></div>`).join("")+gl+
    r.map(x=>`<div class="row"><span class="g">🏃 ${x.km} km in ${x.min} min · ${pace(x.min,x.km)} <small class="mute">${esc(x.n)}</small></span><button class="ib" data-a="dr" data-id="${x.id}" aria-label="Delete">✕</button></div>`).join("")}).join("");
  // charts
  const first=[...S.wo,...S.runs,...S.sets].map(x=>x.d).sort()[0];
  const nw=first?Math.max(4,Math.min(10,Math.round((mon(cur)-mon(dt(first)))/6048e5)+1)):4;   // from the first logged week, 4–10 weeks
  const wks=[...Array(nw)].map((_,i)=>addD(mon(cur),-7*(nw-1-i))),wl=wks.map(w=>sh(w,{day:"numeric",month:"short"}));
  const inW=w=>x=>inR(x.d,wd(w));
  const repsC=bars(wl,cols.map(e=>({label:e.name,data:wks.map(w=>sum(S.wo.filter(inW(w)),exReps(e.id))),color:pal(S.ex.indexOf(e))})),{stacked:true,legend:cols.length>1,label:"Reps per week by exercise"});
  const kmC=bars(wl,[{label:"Distance",data:wks.map(w=>r1(sum(S.runs.filter(inW(w)),"km"))),color:pal(2)}],{fmt:v=>v+" km",label:"Running km per week"});
  const used=S.lifts.filter(l=>S.sets.some(s=>s.lift===l.id));
  if(!used.some(l=>l.id===progLift))progLift=(used.find(l=>l.id===wform.lift)||used[0]||{}).id||"";
  let prog="";
  if(progLift){const days=[...new Set(S.sets.filter(s=>s.lift===progLift).map(s=>s.d))].sort().slice(-15);
    const top=days.map(d=>S.sets.filter(s=>s.lift===progLift&&s.d===d).sort((a,b)=>b.kg-a.kg||b.reps-a.reps)[0]);
    prog=chart(lines(days.map(d=>sh(dt(d),{day:"numeric",month:"short"})),[{label:"Heaviest set",data:top.map(s=>s.kg),color:pal(1)}],
      {zero:false,label:"Heaviest set per session",fmt:(v,c)=>`${v} kg × ${top[c.dataIndex].reps}`}),200);}
  const hist=wks.slice().reverse().map(w=>{const X=wd(w),a=S.wo.filter(o=>inR(o.d,X)),r=S.runs.filter(o=>inR(o.d,X));
    return `<tr class="${S.goal&&r.length>=S.goal?"hit":""}"><td>${sh(w,{day:"numeric",month:"short"})}</td>${cols.map(e=>`<td>${sum(a,exReps(e.id))}</td>`).join("")}<td><b>${sum(a,reps)}</b></td><td>${S.sets.filter(o=>inR(o.d,X)).length}</td><td>${r.length}/${S.goal}</td><td>${sum(r,"km").toFixed(1)}</td></tr>`}).join("");
  return strip+`<div class="stats">${stat("Reps this week",sum(W,reps),act.map(e=>`${sum(W,exReps(e.id))} ${esc(e.name)}`).join(" · "))}
  ${stat("Gym this week",plural(G.length,"set"),G.length?Math.round(sum(G,s=>s.kg*s.reps)).toLocaleString("en-US")+" kg volume":"")}
  ${stat("Runs this week",R.length+" / "+S.goal,S.goal&&R.length>=S.goal?"Goal hit 🎉":sum(R,"km").toFixed(1)+" km · "+pace(sum(R,"min"),sum(R,"km")))}
  ${stat("All-time",sum(dv,x=>x)+" reps",km.toFixed(1)+" km run · "+pace(mn,km))}</div>
  <div class="card mb"><div class="mute" style="margin-bottom:4px">Run goal this week · ${R.length} of ${S.goal}</div>${bar(S.goal?R.length/S.goal*100:0)}</div>
  <div class="two"><div class="card soft" data-form><h2>Log a workout</h2>${seg("wlog",[["reps","💪 Reps"],["gym","🏋️ Gym"],["run","🏃 Run"]],mode.wlog)}${forms[mode.wlog]}</div>
  <div class="card"><h2>This week's log</h2>${log||'<div class="empty">Nothing logged this week.</div>'}</div></div>
  <div class="two"><div class="card"><h2>Reps per week</h2>${chart(repsC,220)}</div><div class="card"><h2>Running per week</h2>${chart(kmC,220)}</div></div>
  <div class="two"><div class="card"><h2><span>Strength progress</span>${used.length?`<select data-c="plift" aria-label="Exercise" style="max-width:55%">${used.map(l=>opt(l.id,l.name,l.id===progLift)).join("")}</select>`:""}</h2>${prog||'<div class="empty">Log gym sets to see your strength progress here.</div>'}</div>
  <div class="card"><h2>Week by week <small class="mute">green = run goal hit</small></h2><div class="sc"><table><tr><th>Week of</th>${cols.map(e=>`<th>${esc(e.name)}</th>`).join("")}<th>Reps</th><th>Sets</th><th>Runs</th><th>km</th></tr>${hist}</table></div></div></div>`;
}};

function splitSheet(){
  return `<div data-form><p class="mute" style="margin-top:0">What do you train each day? Leave a day empty for rest. It shows on your Plan and here.</p>
  ${DNL.map((n,i)=>`<label class="fl"><span>${n}</span><input name="s${i}" list="spl" value="${esc(S.split[i])}" placeholder="Rest"></label>`).join("")}
  <datalist id="spl">${SPLITS.map(s=>`<option value="${esc(s)}">`).join("")}</datalist><button class="p" data-a="splitsave" style="width:100%;margin-top:8px">Save split</button></div>`;
}

A.wlog=b=>{mode.wlog=b.dataset.v};
A.aw=(b,f,F)=>{const d=F.v("d"),r={};S.ex.filter(x=>x.on).forEach(x=>{const n=F.n("r_"+x.id);if(n)r[x.id]=n});
  if(!d||!Object.keys(r).length){toast("Enter at least one number");return false}lastD=d;
  const x=S.wo.find(o=>o.d===d);
  if(x){Object.entries(r).forEach(([k,n])=>x.r[k]=(x.r[k]||0)+n);if(F.v("n"))x.n=(x.n?x.n+"; ":"")+F.v("n")}else S.wo.push({id:uid(),d,r,n:F.v("n")});toast(Object.values(r).reduce((a,b)=>a+b,0)+" reps logged")};
A.ar=(b,f,F)=>{if(!F.v("d")||!F.n("km")||!F.n("min")){toast("Enter km and minutes");return false}lastD=F.v("d");S.runs.push({id:uid(),d:F.v("d"),km:F.n("km"),min:F.n("min"),n:F.v("n")});toast("Run logged")};
A.as=(b,f,F)=>{const lift=F.v("lift"),kg=F.n("kg"),rp=F.n("reps"),n=Math.min(20,Math.max(1,Math.round(F.n("n")||1)));
  if(!lift||!rp||!F.v("d")){toast("Enter kg and reps");return false}lastD=F.v("d");
  for(let i=0;i<n;i++)S.sets.push({id:uid(),d:F.v("d"),lift,kg,reps:rp});wform={lift,kg:F.v("kg"),reps:F.v("reps"),n};toast(`${plural(n,"set")} of ${liftName(lift)} logged`)};
A.dw=b=>{S.wo=S.wo.filter(x=>x.id!==b.dataset.id)};
A.dr=b=>{S.runs=S.runs.filter(x=>x.id!==b.dataset.id)};
A.ds=b=>{S.sets=S.sets.filter(x=>x.id!==b.dataset.id)};
A.split=()=>{sheet("Weekly split",splitSheet);return false};
A.splitsave=(b,f,F)=>{S.split=DN.map((_,i)=>F.v("s"+i));closeSheet();toast("Split saved")};
C.lift=el=>{const f=el.closest("[data-form]"),g=n=>f.querySelector(`[name=${n}]`).value;wform={lift:el.value,kg:g("kg"),reps:g("reps"),n:g("n")}};
C.plift=el=>{progLift=el.value};
