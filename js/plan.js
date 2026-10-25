"use strict";
// ---------- Plan: day / week / month, weekly goals, repeating tasks ----------
const task=id=>S.tasks.find(t=>t.id===id);
const tsort=a=>[...a].sort((x,y)=>{const a1=x.tm||"~",b1=y.tm||"~";return a1<b1?-1:a1>b1?1:(y.p-x.p)});
const recDays=d=>{const s=[...d].sort().join("");return s==="0123456"?"Every day":s==="01234"?"Weekdays":s==="56"?"Weekends":d.slice().sort().map(i=>DN[i]).join(", ")};

// Repeating tasks become real tasks the first time a day that matches them is shown.
function ensureRec(D){
  let ch=false;
  D.forEach(d=>{const k=key(d),w=(d.getDay()+6)%7;
    S.rec.forEach(r=>{if(r.days.includes(w)&&k>=r.start&&!r.skip.includes(k)&&!S.tasks.some(t=>t.rid===r.id&&t.d===k)){
      S.tasks.push({id:uid(),d:k,t:r.t,x:false,p:r.p,tm:r.tm,rid:r.id,lid:r.lid,lu:r.lu});ch=true}})});
  if(ch)save();
}
function skipRec(t){const r=t.rid&&S.rec.find(x=>x.id===t.rid);if(r&&!r.skip.includes(t.d))r.skip.push(t.d)}

function trow(t){
  const L=t.lid&&S.learn.find(l=>l.id===t.lid);
  return `<div class="row ${t.x?"done":""}"><label class="ck"><input type="checkbox" data-a="tg" data-id="${t.id}" ${t.x?"checked":""} aria-label="Done"></label>
  <span class="g tt" data-a="te" data-id="${t.id}">${t.tm?`<b class="mute">${t.tm}</b> `:""}${t.p?"⭐ ":""}${esc(t.t)}${t.rid?'<span class="tag" title="Repeating">🔁</span>':""}${L?`<span class="tag">📚 ${esc(L.name)}${t.lu?" +"+t.lu:""}</span>`:""}</span>
  <button class="ib" data-a="mv" data-id="${t.id}" title="Move to next day" aria-label="Move to next day">↪</button><button class="ib" data-a="dt" data-id="${t.id}" aria-label="Delete">✕</button></div>`;
}
function learnFields(lid,lu){
  const L=S.learn.filter(l=>l.st!=="done"||l.id===lid);
  if(!L.length)return"";
  return `<div class="f"><label class="fl" style="flex:2 1 170px"><span>📚 Counts toward learning</span><select name="lid">${opt("","Not linked",!lid)}${L.map(l=>opt(l.id,l.name,l.id===lid)).join("")}</select></label>
  <label class="fl n"><span>Units when done</span><input name="lu" type="number" inputmode="decimal" min="0" step="any" value="${lu||1}"></label></div>`;
}
function goalsCard(){
  const w=key(mon(cur)),G=S.goals.filter(g=>g.d===w);
  return `<div class="card soft mb" data-form data-w="${w}"><h2><span>🎯 Goals this week</span><small class="mute">${G.filter(g=>g.x).length}/${G.length} done</small></h2>
  ${G.map(g=>`<div class="row ${g.x?"done":""}"><label><input type="checkbox" data-a="gt" data-id="${g.id}" ${g.x?"checked":""}><span class="tt">${esc(g.t)}</span></label><button class="ib" data-a="gd" data-id="${g.id}" aria-label="Delete">✕</button></div>`).join("")||'<div class="empty">No goals for this week yet.</div>'}
  <div class="f" style="margin-top:6px"><input name="g" placeholder="Add a goal for the week…" enterkeyhint="done"><button class="p x" data-a="ag" aria-label="Add goal">+</button></div></div>`;
}
const dayTotals=k=>({sp:sum(S.exp.filter(e=>e.d===k),"a"),rp:sum(S.wo.filter(w=>w.d===k),reps),sets:S.sets.filter(s=>s.d===k).length,km:sum(S.runs.filter(r=>r.d===k),"km"),
  kc:sum(S.meals.filter(m=>m.d===k),"kcal"),st:sum(S.study.filter(s=>s.d===k),"min")});

function vDay(){
  const k=key(cur);ensureRec([cur]);
  const T=tsort(S.tasks.filter(t=>t.d===k)),done=T.filter(t=>t.x).length,x=dayTotals(k),tg=targets(),split=S.split[wdi(k)];
  const wk=[x.rp?x.rp+" reps":"",x.sets?plural(x.sets,"set"):"",x.km?r1(x.km)+" km":""].filter(Boolean).join(" · ");
  return `<div class="stats">
   ${stat("Tasks done",done+" / "+T.length,T.length?Math.round(done/T.length*100)+"% complete":"Nothing planned yet")}
   ${stat("Calories",Math.round(x.kc)+(tg?" / "+tg.kcal:""),tg?(tg.kcal-x.kc>=0?Math.round(tg.kcal-x.kc)+" kcal left":Math.round(x.kc-tg.kcal)+" kcal over"):"Set a target in Food")}
   ${stat("Spent",money(x.sp),S.budget?"daily budget "+money(S.budget/7):"")}
   ${stat("Study time",hm(x.st),"")}</div>
  <div class="card mb" data-form data-k="${k}"><h2><span>Tasks</span><button class="sm" data-a="rec">🔁 Repeating</button></h2>
  ${T.map(trow).join("")||'<div class="empty">Nothing planned. Add your first task below.</div>'}
  <div class="f" style="margin-top:10px"><input name="t" class="w" placeholder="Add a task…" enterkeyhint="done"></div>
  <div class="f"><input name="tm" type="time" aria-label="Time (optional)"><label class="dchip x"><input type="checkbox" name="p"><span>⭐ Important</span></label><button class="p x" data-a="at">Add task</button></div>
  ${learnFields("",1)}</div>
  <div class="two"><div class="card"><h2><span>💪 Workout</span><button class="sm" data-a="tab" data-t="work">Open</button></h2>
  <p style="margin:0"><b>${split?esc(split):"Rest day"}</b> <span class="mute">${wk?"· "+wk:"· nothing logged"}</span></p></div>
  <div class="card"><h2><span>🥗 Food</span><button class="sm" data-a="tab" data-t="food">Open</button></h2>${tg?bar(x.kc/tg.kcal*100,x.kc>tg.kcal*1.05):""}<p class="mute" style="margin:6px 0 0">${Math.round(x.kc)} kcal eaten${tg?" of "+tg.kcal:""}</p></div></div>
  ${goalsCard()}`;
}

function vWeek(){
  const D=wkD(),tk=today();ensureRec(D);
  const T=S.tasks.filter(t=>inR(t.d,D)),done=T.filter(t=>t.x).length,R=S.runs.filter(r=>inR(r.d,D));
  let h=`<div class="stats">${stat("Tasks done",done+" / "+T.length,T.length?Math.round(done/T.length*100)+"% complete":"Add tasks below")}${stat("Spent",money(sum(S.exp.filter(e=>inR(e.d,D)),"a")),"this week")}
  ${stat("Workout reps",sum(S.wo.filter(w=>inR(w.d,D)),reps),plural(new Set(S.sets.filter(s=>inR(s.d,D)).map(s=>s.d)).size,"gym day"))}${stat("Study time",hm(sum(S.study.filter(s=>inR(s.d,D)),"min")),R.length+" / "+S.goal+" runs")}</div>
  ${goalsCard()}<div class="grid">`;
  D.forEach((d,i)=>{
    const k=key(d),t=tsort(S.tasks.filter(x=>x.d===k)),x=dayTotals(k),sp=S.split[i];
    h+=`<div class="day ${k===tk?"today":""}" data-form data-k="${k}"><h3><span data-a="cal" data-k="${k}" class="tt">${DN[i]} ${d.getDate()} ${sh(d,{month:"short"})}</span>${k===tk?'<span class="chip soft">Today</span>':""}</h3>
    ${sp?`<small class="mute">💪 ${esc(sp)}</small>`:""}
    ${t.map(trow).join("")||'<div class="empty">Nothing planned</div>'}
    <div class="f"><input name="t" placeholder="Add a task…" enterkeyhint="done"><button class="p x" data-a="at" aria-label="Add task">+</button></div>
    <div class="chips">${x.sp?`<span class="chip soft">💸 ${moneyS(x.sp)}</span>`:""}${x.rp?`<span class="chip soft">💪 ${x.rp}</span>`:""}${x.sets?`<span class="chip soft">🏋️ ${x.sets} sets</span>`:""}${x.km?`<span class="chip soft">🏃 ${r1(x.km)} km</span>`:""}${x.kc?`<span class="chip soft">🥗 ${Math.round(x.kc)}</span>`:""}${x.st?`<span class="chip soft">📚 ${hm(x.st)}</span>`:""}</div></div>`;
  });
  return h+"</div>";
}

function vMonth(){
  const M=monthDays(cur),tk=today(),mk=key(cur).slice(0,7);ensureRec(M);
  const cells=[];for(let d=mon(M[0]);d<=addD(mon(M[M.length-1]),6);d=addD(d,1))cells.push(d);
  const MT=S.tasks.filter(t=>t.d.startsWith(mk)),done=MT.filter(t=>t.x).length;
  let perfect=0;
  const c=cells.map(d=>{const k=key(d),T=S.tasks.filter(t=>t.d===k),x=T.filter(t=>t.x).length,p=T.length?x/T.length:0,inM=k.startsWith(mk);
    if(inM&&T.length&&x===T.length)perfect++;
    const bg=T.length&&x?`background:color-mix(in srgb,${pal(0)} ${Math.round(14+70*p)}%,var(--card));${p>=.6?"color:#fff;":""}`:"";
    return `<button data-a="cal" data-k="${k}" class="${inM?"":"out"} ${k===tk?"today":""}" style="${bg}" aria-label="${dayLbl(d)}: ${x} of ${T.length} tasks done"><span>${d.getDate()}</span><small>${T.length?x+"/"+T.length:""}</small></button>`}).join("");
  const sw=(p,l)=>`<span><i class="dot" style="background:color-mix(in srgb,${pal(0)} ${Math.round(14+70*p)}%,var(--card))"></i>${l}</span>`;
  return `<div class="stats">${stat("Tasks done",done+" / "+MT.length,MT.length?Math.round(done/MT.length*100)+"% complete":"")}${stat("Perfect days",perfect,"every task done")}
  ${stat("Spent",money(sum(S.exp.filter(e=>e.d.startsWith(mk)),"a")),"this month")}${stat("Study time",hm(sum(S.study.filter(s=>s.d.startsWith(mk)),"min")),"this month")}</div>
  <div class="card"><div class="cal">${DN.map(n=>`<div class="hd">${n}</div>`).join("")}${c}</div>
  <div class="legend">Shade = share of tasks done: ${sw(.1,"few")}${sw(.5,"half")}${sw(1,"all")} · tap a day to open it</div></div>`;
}

function recSheet(){
  return `${S.rec.map(r=>{const L=r.lid&&S.learn.find(l=>l.id===r.lid);return `<div class="row"><span class="g">${r.tm?`<b class="mute">${r.tm}</b> `:""}${r.p?"⭐ ":""}${esc(r.t)}<br><small class="mute">${recDays(r.days)}${L?" · 📚 "+esc(L.name):""}</small></span><button class="ib" data-a="rdel" data-id="${r.id}" aria-label="Delete">✕</button></div>`}).join("")||'<div class="empty">No repeating tasks yet.</div>'}
  <div data-form style="margin-top:14px"><h3>New repeating task</h3>
  <label class="fl"><span>Task</span><input name="t" placeholder="e.g. Leetcode 2 problems"></label>
  <div class="fl"><span>Repeats on</span>${dayChecks([0,1,2,3,4])}<div class="f" style="margin-top:6px"><button class="sm x" data-a="rq" data-v="0123456">Every day</button><button class="sm x" data-a="rq" data-v="01234">Weekdays</button><button class="sm x" data-a="rq" data-v="56">Weekends</button></div></div>
  <div class="f"><label class="fl"><span>Time (optional)</span><input name="tm" type="time"></label><div class="fl"><span>&nbsp;</span><label class="dchip"><input type="checkbox" name="p"><span>⭐ Important</span></label></div></div>
  ${learnFields("",1)}<button class="p" data-a="radd" style="width:100%;margin-top:8px">Add repeating task</button>
  <p class="mute"><small>New tasks appear on matching days from today on. Deleting one day's copy skips just that day.</small></p></div>`;
}
function taskSheet(id){
  const t=task(id);if(!t)return'<div class="empty">This task was deleted.</div>';
  return `<div data-form data-id="${id}"><label class="fl"><span>Task</span><input name="t" value="${esc(t.t)}"></label>
  <div class="f"><label class="fl"><span>Date</span><input type="date" name="d" value="${t.d}"></label><label class="fl"><span>Time</span><input type="time" name="tm" value="${t.tm}"></label></div>
  <label class="row"><input type="checkbox" name="p" ${t.p?"checked":""}> ⭐ Important</label>
  ${learnFields(t.lid,t.lu)}${t.rid?'<p class="mute"><small>🔁 This is one day of a repeating task. Changes apply to this day only.</small></p>':""}
  <div class="btns" style="margin-top:12px"><button class="p" data-a="tsave">Save</button><button data-a="dt" data-id="${id}">Delete</button></div></div>`;
}

V.plan={title:"Plan",nav:()=>mode.plan,render(){
  return seg("pmode",[["day","Day"],["week","Week"],["month","Month"]],mode.plan)+(mode.plan==="day"?vDay():mode.plan==="week"?vWeek():vMonth());
}};

A.pmode=b=>{mode.plan=b.dataset.v};
A.cal=b=>{cur=dt(b.dataset.k);mode.plan="day";scrollTo(0,0)};
A.tg=b=>{const t=task(b.dataset.id);if(!t)return false;t.x=b.checked;syncLearn(t)};
A.mv=b=>{const t=task(b.dataset.id);skipRec(t);t.d=key(addD(dt(t.d),1));syncLearn(t);toast("Moved to "+dayLbl(dt(t.d)))};
A.dt=b=>{const t=task(b.dataset.id);if(!t)return;skipRec(t);S.tasks=S.tasks.filter(x=>x!==t);S.study=S.study.filter(s=>s.src!==t.id);closeSheet()};
A.at=(b,f,F)=>{const t=F.v("t");if(!t)return false;
  S.tasks.push({id:uid(),d:f.dataset.k,t,x:false,p:F.ck("p"),tm:F.v("tm"),rid:"",lid:F.v("lid"),lu:F.v("lid")?F.n("lu")||1:0});
  return `[data-k="${f.dataset.k}"] [name=t]`};
A.te=b=>{const id=b.dataset.id;sheet("Edit task",()=>taskSheet(id));return false};
A.tsave=(b,f,F)=>{const t=task(f.dataset.id);if(!t||!F.v("t"))return false;
  if(F.v("d")&&F.v("d")!==t.d){skipRec(t);t.d=F.v("d")}
  Object.assign(t,{t:F.v("t"),tm:F.v("tm"),p:F.ck("p"),lid:F.v("lid"),lu:F.v("lid")?F.n("lu")||1:0});syncLearn(t);closeSheet()};
A.ag=(b,f,F)=>{const t=F.v("g");if(!t)return false;S.goals.push({id:uid(),d:f.dataset.w,t,x:false});return `[data-w] [name=g]`};
A.gt=b=>{const g=S.goals.find(x=>x.id===b.dataset.id);g.x=b.checked};
A.gd=b=>{S.goals=S.goals.filter(x=>x.id!==b.dataset.id)};
A.rec=()=>{sheet("Repeating tasks",recSheet);return false};
A.rq=(b,f)=>{f.querySelectorAll("[name=rd]").forEach(i=>i.checked=b.dataset.v.includes(i.value));return false};
A.radd=(b,f,F)=>{const t=F.v("t"),days=F.all("rd").map(Number);
  if(!t||!days.length){toast("Add a task name and pick at least one day");return false}
  S.rec.push({id:uid(),t,days,tm:F.v("tm"),p:F.ck("p"),lid:F.v("lid"),lu:F.v("lid")?F.n("lu")||1:0,start:today(),skip:[]});toast("Repeating task added")};
A.rdel=async b=>{const r=S.rec.find(x=>x.id===b.dataset.id);
  const ok=await ask(`<h2>Stop repeating “${esc(r.t)}”?</h2><p class="mute">Upcoming unfinished copies are removed. Days you already completed stay in your history.</p>`,[["y","Stop repeating"],["","Cancel"]]);
  if(!ok)return false;const t=today();
  S.tasks=S.tasks.filter(x=>!(x.rid===r.id&&!x.x&&x.d>=t));S.tasks.forEach(x=>{if(x.rid===r.id)x.rid=""});S.rec=S.rec.filter(x=>x!==r)};
