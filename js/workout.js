"use strict";
// ---------- Fitness › Workout: bodyweight reps, gym sets (kg × reps), runs, weekly split ----------
const reps=w=>Object.values(w.r).reduce((s,v)=>s+v,0);
const exReps=id=>w=>w.r[id]||0;
const liftName=id=>(S.lifts.find(l=>l.id===id)||{name:"?"}).name;
const exName=id=>(S.ex.find(e=>e.id===id)||{name:id}).name;
function pace(m,k){if(!k)return"—";const p=m/k;let a=Math.floor(p),s=Math.round((p-a)*60);if(s===60){a++;s=0}return a+":"+pad(s)+" "+T("/km")}
const SPLITS=["Chest & Biceps","Back & Triceps","Shoulders","Legs","Upper body","Lower body","Full body","Push","Pull","Run / Cardio","Street workout"];
let wform={lift:"",kg:"",reps:"",n:1},progLift="";
const workDays=()=>new Set([...S.wo,...S.sets,...S.runs].map(x=>x.d));
const topSet=a=>[...a].sort((x,y)=>y.kg-x.kg||y.reps-x.reps)[0];
function prevSession(lift,before){const s=S.sets.filter(x=>x.lift===lift&&x.d<before);if(!s.length)return null;const d=s.reduce((m,x)=>x.d>m?x.d:m,"");return{d,sets:s.filter(x=>x.d===d)}}

// Log forms, shared by the quick-add sheet.
function workForm(kind,d0){
  const act=S.ex.filter(e=>e.on),lifts=S.lifts.filter(l=>l.on);
  if(!lifts.some(l=>l.id===wform.lift))wform.lift=(lifts[0]||{}).id||"";
  const num=(n,p,v="")=>`<label class="fl n"><span>${p}</span><input name="${n}" type="number" inputmode="decimal" min="0" step="any" value="${v}"></label>`;
  const date=`<label class="fl"><span>${T("Date")}</span><input type="date" name="d" value="${d0}"></label>`;
  if(kind==="reps")return act.length?`<div class="f">${act.map(e=>num("r_"+e.id,esc(e.name))).join("")}</div>${date}<label class="fl"><span>${T("Note (optional)")}</span><input name="n" placeholder="${T("Back day")}"></label><button class="btn p w" data-a="aw">${T("Add reps")}</button>
    <p class="lb">${T("Adds to that day's totals if you already logged something.")}</p>`:`<div class="empty">${T("Add bodyweight exercises in Settings first.")}</div>`;
  if(kind==="gym"){const p=prevSession(wform.lift,"9999");
    return lifts.length?`<label class="fl"><span>${T("Exercise")}</span><select name="lift" data-c="lift">${lifts.map(l=>opt(l.id,l.name,l.id===wform.lift)).join("")}</select></label>
    <div class="f">${num("kg",T("kg"),wform.kg)}${num("reps",T("Reps"),wform.reps)}${num("n",T("Sets"),wform.n||1)}</div>${date}
    <p class="lb">${p?T("Last time ({d}): {s}",{d:dayLbl(dt(p.d)),s:p.sets.map(s=>s.kg+"×"+s.reps).join(", ")}):T("Logs that many identical sets.")}</p><button class="btn p w" data-a="as">${T("Add sets")}</button>`:`<div class="empty">${T("Add gym exercises in Settings first.")}</div>`}
  return `<div class="f">${num("km",T("Distance, km"))}${num("min",T("Time, minutes"))}</div>${date}<label class="fl"><span>${T("Note (optional)")}</span><input name="n" placeholder="${T("Felt good")}"></label><button class="btn p w" data-a="ar">${T("Add run")}</button>`;
}

function vWork(){
  const D=wkD(),tk=today(),W=S.wo.filter(w=>inR(w.d,D)),R=S.runs.filter(r=>inR(r.d,D)),G=S.sets.filter(s=>inR(s.d,D)),days=workDays();
  const dayK=inR(tk,D)?tk:key(D[6]),dayI=wdi(dayK),TG=S.sets.filter(s=>s.d===dayK),TW=S.wo.filter(w=>w.d===dayK),TR=S.runs.filter(r=>r.d===dayK);
  const act=S.ex.filter(e=>e.on),cols=S.ex.filter(e=>e.on||S.wo.some(w=>w.r[e.id]));
  // the day's gym exercises with one-tap "+ set"
  const lifts=[...new Set(TG.map(s=>s.lift))].map(l=>{const x=TG.filter(s=>s.lift===l),p=prevSession(l,dayK),top=topSet(x),pt=p&&topSet(p.sets),dk=pt?r1(top.kg-pt.kg):0;
    return `<div class="rw" style="flex-wrap:wrap"><span class="g"><b style="font-weight:600">${esc(liftName(l))}</b>${p?`<div class="meta">${T("last")}: ${p.sets.map(s=>s.kg+"×"+s.reps).join(", ")}${dk?` · <span class="${dk>0?"good":"bad"}">${dk>0?"▲ +":"▼ "}${dk} ${T("kg")}</span>`:""}</div>`:""}</span>
    <span class="chipset" style="width:100%">${x.map(s=>`<button class="chip" data-a="ds" data-id="${s.id}" title="${T("Delete this set")}">${s.kg}×${s.reps} ${ic("x","s")}</button>`).join("")}<button class="chip add" data-a="as1" data-l="${l}" data-d="${dayK}">${ic("plus","s")} ${T("set")}</button></span></div>`}).join("");
  const rep=TW.map(w=>`<div class="rw"><span class="ci">${ic("barbell","s")}</span><span class="g">${Object.entries(w.r).map(([k,v])=>`${v} ${esc(exName(k))}`).join(" · ")}${w.n?`<div class="meta">${esc(w.n)}</div>`:""}</span><button class="ib" data-a="dw" data-id="${w.id}" aria-label="${T("Delete")}">${ic("x","s")}</button></div>`).join("")
    +TR.map(x=>`<div class="rw"><span class="ci">${ic("run","s")}</span><span class="g">${T("{km} km in {min} min",{km:x.km,min:x.min})}<div class="meta">${pace(x.min,x.km)}${x.n?" · "+esc(x.n):""}</div></span><button class="ib" data-a="dr" data-id="${x.id}" aria-label="${T("Delete")}">${ic("x","s")}</button></div>`).join("");
  // charts
  const first=[...days].sort()[0];
  const nw=first?Math.max(4,Math.min(10,Math.round((mon(cur)-mon(dt(first)))/6048e5)+1)):4;   // from the first logged week, 4–10 weeks
  const wks=[...Array(nw)].map((_,i)=>addD(mon(cur),-7*(nw-1-i))),wl=wks.map(w=>sh(w,{day:"numeric",month:"short"})),inWk=w=>x=>inR(x.d,wd(w));
  const repsC=bars(wl,cols.map(e=>({label:e.name,data:wks.map(w=>sum(S.wo.filter(inWk(w)),exReps(e.id))),color:pal(S.ex.indexOf(e))})),{stacked:true,legend:cols.length>1,label:T("Reps per week by exercise")});
  const kmC=bars(wl,[{label:T("Distance"),data:wks.map(w=>r1(sum(S.runs.filter(inWk(w)),"km")))}],{fmt:v=>v+" "+T("km"),label:T("Running per week")});
  const used=S.lifts.filter(l=>S.sets.some(s=>s.lift===l.id));
  if(!used.some(l=>l.id===progLift))progLift=(used.find(l=>l.id===wform.lift)||used[0]||{}).id||"";
  let prog="";
  if(progLift){const ds=[...new Set(S.sets.filter(s=>s.lift===progLift).map(s=>s.d))].sort().slice(-15),top=ds.map(d=>topSet(S.sets.filter(s=>s.lift===progLift&&s.d===d)));
    prog=chart(lines(ds.map(d=>sh(dt(d),{day:"numeric",month:"short"})),[{label:T("Heaviest set"),data:top.map(s=>s.kg)}],{zero:false,label:T("Heaviest set per session"),fmt:(v,c)=>`${v} ${T("kg")} × ${top[c.dataIndex].reps}`}),180)}
  const hist=wks.slice().reverse().map(w=>{const X=wd(w),a=S.wo.filter(o=>inR(o.d,X)),r=S.runs.filter(o=>inR(o.d,X));
    return `<tr class="${S.goal&&r.length>=S.goal?"hit":""}"><td>${sh(w,{day:"numeric",month:"short"})}</td>${cols.map(e=>`<td>${sum(a,exReps(e.id))}</td>`).join("")}<td><b>${sum(a,reps)}</b></td><td>${S.sets.filter(o=>inR(o.d,X)).length}</td><td>${r.length}/${S.goal}</td><td>${sum(r,"km").toFixed(1)}</td></tr>`}).join("");
  return `<div class="stack">
  ${tile(`<div class="wdots">${D.map((d,i)=>{const k=key(d);return `<span class="${days.has(k)?"on":""} ${k===tk?"now":""}" title="${DNL[i]}: ${esc(S.split[i]||T("Rest"))}">${DN[i][0]}</span>`}).join("")}</div>
    <div class="rw" style="border:0;padding-bottom:0;min-height:0;margin-top:6px"><span class="g lb">${plural(D.filter(d=>days.has(key(d))).length,"training day")} · ${T("{a}/{b} runs",{a:R.length,b:S.goal})}</span><button class="btn ghost sm" data-a="split">${ic("calendar-week","s")} ${T("Split")}</button></div>`)}
  ${tile(`<h2><span>${dayK===tk?T("Today"):dayLbl(dt(dayK))} · ${S.split[dayI]?esc(S.split[dayI]):T("Rest day")}</span><button class="btn sm p" data-a="qa" data-k="work">${ic("plus","s")} ${T("Log")}</button></h2>
    ${lifts+rep||`<div class="empty">${T("Nothing logged yet. Tap Log to add sets, reps or a run.")}</div>`}`)}
  <div class="grid2">${tile(`<div class="lb">${T("Reps this week")}</div><div class="big">${sum(W,reps)}</div><div class="meta">${act.map(e=>`${sum(W,exReps(e.id))} ${esc(e.name)}`).join(" · ")}</div>`,"t")}
  ${tile(`<div class="lb">${T("Gym this week")}</div><div class="big">${plural(G.length,"set")}</div><div class="meta">${T("{x} kg volume",{x:Math.round(sum(G,s=>s.kg*s.reps)).toLocaleString("en-US")})}</div>`,"t")}
  ${tile(`<div class="lb">${T("Runs")}</div><div class="big">${R.length} / ${S.goal}</div>${bar(S.goal?R.length/S.goal*100:0)}`,"t")}
  ${tile(`<div class="lb">${T("Distance")}</div><div class="big">${sum(R,"km").toFixed(1)} ${T("km")}</div><div class="meta">${pace(sum(R,"min"),sum(R,"km"))}</div>`,"t")}</div>
  ${tile(`<h2><span>${T("Strength progress")}</span>${used.length?`<select data-c="plift" aria-label="${T("Exercise")}" style="width:auto;max-width:55%;padding:6px 10px">${used.map(l=>opt(l.id,l.name,l.id===progLift)).join("")}</select>`:""}</h2>${prog||`<div class="empty">${T("Log gym sets to see your strength grow here.")}</div>`}`)}
  ${tile(`<h2>${T("Reps per week")}</h2>${chart(repsC,190)}`)}
  ${tile(`<h2>${T("Running per week")}</h2>${chart(kmC,160)}`)}
  ${tile(`<details><summary>${T("Week by week table")}</summary><div class="sc" style="margin-top:8px"><table><tr><th>${T("Week")}</th>${cols.map(e=>`<th>${esc(e.name)}</th>`).join("")}<th>${T("Reps")}</th><th>${T("Sets")}</th><th>${T("Runs")}</th><th>${T("km")}</th></tr>${hist}</table></div></details>`)}
  </div>`;
}

function splitSheet(){
  return `<div data-form><p class="lb" style="margin-top:0">${T("What do you train each day? Leave a day empty for rest.")}</p>
  ${DNL.map((n,i)=>`<label class="fl"><span>${n}</span><input name="s${i}" list="spl" value="${esc(S.split[i])}" placeholder="${T("Rest")}"></label>`).join("")}
  <datalist id="spl">${SPLITS.map(s=>`<option value="${esc(T(s))}">`).join("")}</datalist><button class="btn p w" data-a="splitsave">${T("Save split")}</button></div>`;
}

V.fit={nav:()=>mode.fit==="work"?"week":"day",render(){
  const w=mode.fit==="work",ws=weekStreak(workDays());
  return head(w?T("Workout"):T("Food"),{nav:w?"week":"day",right:w&&ws>=2?`<span class="badge fire">${ic("flame","s")} ${ws} ${T("wk")}</span>`:""})+seg("fmode",[["work",T("Workout")],["food",T("Food")]],mode.fit)+(w?vWork():vFood());
}};

A.fmode=b=>{mode.fit=b.dataset.v;anim=true};
A.aw=(b,f,F)=>{const d=F.v("d"),r={};S.ex.filter(x=>x.on).forEach(x=>{const n=F.n("r_"+x.id);if(n)r[x.id]=n});
  if(!d||!Object.keys(r).length){toast(T("Enter at least one number"));return false}lastD=d;snap();
  const x=S.wo.find(o=>o.d===d);
  if(x){Object.entries(r).forEach(([k,n])=>x.r[k]=(x.r[k]||0)+n);if(F.v("n"))x.n=(x.n?x.n+"; ":"")+F.v("n")}else S.wo.push({id:uid(),d,r,n:F.v("n")});
  closeSheet();undoToast(T("{n} reps logged",{n:Object.values(r).reduce((a,b)=>a+b,0)}))};
A.ar=(b,f,F)=>{if(!F.v("d")||!F.n("km")||!F.n("min")){toast(T("Enter distance and time"));return false}lastD=F.v("d");snap();
  S.runs.push({id:uid(),d:F.v("d"),km:F.n("km"),min:F.n("min"),n:F.v("n")});closeSheet();undoToast(T("Run logged"))};
A.as=(b,f,F)=>{const lift=F.v("lift"),kg=F.n("kg"),rp=F.n("reps"),n=Math.min(20,Math.max(1,Math.round(F.n("n")||1)));
  if(!lift||!rp||!F.v("d")){toast(T("Enter kg and reps"));return false}lastD=F.v("d");snap();
  for(let i=0;i<n;i++)S.sets.push({id:uid(),d:F.v("d"),lift,kg,reps:rp});wform={lift,kg:F.v("kg"),reps:F.v("reps"),n};closeSheet();undoToast(T("{s} of {l} logged",{s:plural(n,"set"),l:liftName(lift)}))};
A.as1=b=>{const l=b.dataset.l,d=b.dataset.d,last=S.sets.filter(s=>s.lift===l&&s.d<=d).pop();if(!last)return false;snap();
  S.sets.push({id:uid(),d,lift:l,kg:last.kg,reps:last.reps});try{navigator.vibrate&&navigator.vibrate(10)}catch(e){}undoToast(T("{x} added",{x:last.kg+"×"+last.reps}))};
A.dw=b=>{snap();S.wo=S.wo.filter(x=>x.id!==b.dataset.id);undoToast(T("Reps deleted"))};
A.dr=b=>{snap();S.runs=S.runs.filter(x=>x.id!==b.dataset.id);undoToast(T("Run deleted"))};
A.ds=b=>{snap();S.sets=S.sets.filter(x=>x.id!==b.dataset.id);undoToast(T("Set deleted"))};
A.split=()=>{sheet(T("Weekly split"),splitSheet);return false};
A.splitsave=(b,f,F)=>{S.split=DN.map((_,i)=>F.v("s"+i));closeSheet();toast(T("Split saved"))};
C.lift=el=>{const f=el.closest("[data-form]"),g=n=>f.querySelector(`[name=${n}]`).value;wform={lift:el.value,kg:g("kg"),reps:g("reps"),n:g("n")}};
C.plift=el=>{progLift=el.value};
